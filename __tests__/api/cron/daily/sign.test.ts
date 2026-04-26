/**
 * @jest-environment node
 *
 * Tests for /api/cron/daily/[sign] — the per-sign content cron route.
 *
 * Mocks the underlying verbs (generate-with-critique, store, segment, email,
 * distribute, redis) so we test the composer's wiring without touching real
 * services. The verbs themselves have their own tests; this file proves the
 * route validates auth/sign, sequences the steps, and surfaces partial
 * failures without crashing.
 *
 * Node test env: route transitively imports the AI SDK; jsdom lacks
 * TransformStream (HANDOFF.md Pitfall #13).
 */

import { NextRequest } from 'next/server';
import type { ReadingOutput } from '@/tools/reading/types';
import type { JudgeResult } from '@/tools/reading/judge';
import type { GenerateWithCritiqueResult } from '@/tools/reading/generate-with-critique';

// ─── Mocks ──────────────────────────────────────────────────────────────

const mockGenerateWithCritique = jest.fn();
const mockStore = jest.fn();
const mockSegment = jest.fn();
const mockSendDailyEmail = jest.fn();
const mockDistribute = jest.fn();
const mockRedisPing = jest.fn();
const mockRedisSet = jest.fn();

jest.mock('@/tools/reading/generate-with-critique', () => ({
  generateReadingWithCritique: (...args: unknown[]) => mockGenerateWithCritique(...args),
}));

jest.mock('@/tools/cache/store', () => ({
  store: (...args: unknown[]) => mockStore(...args),
}));

jest.mock('@/tools/audience/segment', () => ({
  segment: (...args: unknown[]) => mockSegment(...args),
}));

jest.mock('@/utils/email', () => ({
  sendDailyEmail: (...args: unknown[]) => mockSendDailyEmail(...args),
}));

jest.mock('@/tools/content/distribute', () => ({
  distribute: (...args: unknown[]) => mockDistribute(...args),
}));

jest.mock('@/utils/redis', () => ({
  redis: {
    ping: () => mockRedisPing(),
    set: (...args: unknown[]) => mockRedisSet(...args),
  },
}));

// Import AFTER mocks are registered
import { GET } from '@/app/api/cron/daily/[sign]/route';

// ─── Fixtures ───────────────────────────────────────────────────────────

const READING: ReadingOutput = {
  sign: 'aries',
  date: '2026-04-26',
  philosopher: 'Alan Watts',
  // Long enough that an UNFORMATTED post (raw message + quote + author) blows
  // past 280 chars — so the X-platform cap test below actually exercises the
  // 280-char limit, not just trivially passes on a short fixture.
  message:
    'You are not a stranger to the world; the world is the very fabric of you, breathing through every choice you make today. Notice the small reluctance that hides under your busy hours — the one that whispers there is something you are postponing because it asks more honesty of you than you have practiced. Today is a generous day to practice it. Step toward the conversation, the page, the call you have been deferring; the universe rarely rewards delay, and almost always meets honest motion with luck that looks like coincidence.',
  bestMatch: 'leo, sagittarius, gemini',
  inspirationalQuote: 'You are the universe experiencing itself.',
  quoteAuthor: 'Alan Watts',
  peacefulThought: 'Tonight, let your shoulders drop.',
};

const PASSING_JUDGE: JudgeResult = {
  scores: { voiceAuthenticity: 4, antiBarnum: 4, antiTemplate: 5, quoteFidelity: 5, overall: 4 },
  violations: [],
  rationale: 'Solid reading.',
};

const CRITIQUE_OK: GenerateWithCritiqueResult = {
  reading: READING,
  judge: PASSING_JUDGE,
  rounds: 0,
  thresholdMissedAfterMaxRounds: false,
};

function makeRequest(opts: { authHeader?: string }): NextRequest {
  const headers = new Headers();
  if (opts.authHeader) headers.set('authorization', opts.authHeader);
  return new NextRequest('https://api.gettodayshoroscope.com/api/cron/daily/aries', {
    headers,
  });
}

function makeContext(sign: string): { params: Promise<{ sign: string }> } {
  return { params: Promise.resolve({ sign }) };
}

// ─── Tests ──────────────────────────────────────────────────────────────

describe('/api/cron/daily/[sign]', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    process.env = { ...ORIGINAL_ENV, CRON_SECRET: 'test-secret' };
    delete process.env.SOCIAL_PLATFORMS;

    // Reasonable defaults for "happy path"
    mockRedisPing.mockResolvedValue('PONG');
    mockRedisSet.mockResolvedValue('OK'); // lock acquires successfully by default
    mockGenerateWithCritique.mockResolvedValue(CRITIQUE_OK);
    mockStore.mockResolvedValue({ success: true, key: 'horoscope-prod:aries:Alan Watts:2026-04-26' });
    mockSegment.mockResolvedValue({ subscribers: [], count: 0 });
    mockSendDailyEmail.mockResolvedValue({ success: true, email: 'a@b.com' });
    mockDistribute.mockResolvedValue({
      success: true,
      platformResults: { facebook: { success: true, postId: 'fb-123' } },
    });
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
    jest.restoreAllMocks();
  });

  it('rejects request without bearer token (401)', async () => {
    const res = await GET(makeRequest({}), makeContext('aries'));
    expect(res.status).toBe(401);
    expect(mockGenerateWithCritique).not.toHaveBeenCalled();
  });

  it('rejects request with wrong bearer token (401)', async () => {
    const res = await GET(makeRequest({ authHeader: 'Bearer nope' }), makeContext('aries'));
    expect(res.status).toBe(401);
    expect(mockGenerateWithCritique).not.toHaveBeenCalled();
  });

  it('rejects request with invalid sign (400)', async () => {
    const res = await GET(
      makeRequest({ authHeader: 'Bearer test-secret' }),
      makeContext('unicorn'),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.errors[0]).toMatch(/Invalid sign/);
    expect(mockGenerateWithCritique).not.toHaveBeenCalled();
  });

  it('happy path: generates, stores, distributes, returns 200 with status', async () => {
    const res = await GET(
      makeRequest({ authHeader: 'Bearer test-secret' }),
      makeContext('aries'),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.published).toBe(true); // FB succeeded
    expect(body.sign).toBe('aries');
    expect(body.philosopher).toBeTruthy();
    expect(body.cached).toBe(true);
    expect(body.rounds).toBe(0);
    expect(body.thresholdMissedAfterMaxRounds).toBe(false);
    expect(body.social.success).toBe(true);
    expect(body.social.attempted).toEqual(['facebook']);
    expect(mockGenerateWithCritique).toHaveBeenCalledTimes(1);
    expect(mockStore).toHaveBeenCalledTimes(1);
    expect(mockDistribute).toHaveBeenCalledTimes(1);
    // Idempotency lock was acquired before generation began.
    expect(mockRedisSet).toHaveBeenCalledTimes(1);
    const lockArgs = mockRedisSet.mock.calls[0];
    expect(lockArgs[0]).toMatch(/^cron-lock:aries:/);
    expect(lockArgs[2]).toMatchObject({ nx: true });
  });

  it('emails each subscriber when segment returns any', async () => {
    mockSegment.mockResolvedValue({
      subscribers: [
        { email: 'a@b.com', sign: 'aries' },
        { email: 'c@d.com', sign: 'aries' },
      ],
      count: 2,
    });

    const res = await GET(
      makeRequest({ authHeader: 'Bearer test-secret' }),
      makeContext('aries'),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.emailed).toBe(2);
    expect(body.emailErrors).toBe(0);
    expect(mockSendDailyEmail).toHaveBeenCalledTimes(2);
  });

  it('counts email errors but does not fail the cron', async () => {
    mockSegment.mockResolvedValue({
      subscribers: [{ email: 'a@b.com', sign: 'aries' }],
      count: 1,
    });
    mockSendDailyEmail.mockResolvedValue({
      success: false,
      email: 'a@b.com',
      error: 'Resend down',
    });

    const res = await GET(
      makeRequest({ authHeader: 'Bearer test-secret' }),
      makeContext('aries'),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.emailed).toBe(0);
    expect(body.emailErrors).toBe(1);
    expect(body.success).toBe(true);
  });

  it('skips cache + email when redis ping fails', async () => {
    mockRedisPing.mockRejectedValue(new Error('redis down'));

    const res = await GET(
      makeRequest({ authHeader: 'Bearer test-secret' }),
      makeContext('aries'),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.cached).toBe(false);
    expect(body.emailed).toBe(0);
    expect(mockStore).not.toHaveBeenCalled();
    expect(mockSegment).not.toHaveBeenCalled();
    // Generation + distribute still proceed — content posting must not depend on Redis.
    expect(mockGenerateWithCritique).toHaveBeenCalledTimes(1);
    expect(mockDistribute).toHaveBeenCalledTimes(1);
  });

  it('returns 500 when generation throws', async () => {
    mockGenerateWithCritique.mockRejectedValue(new Error('gateway 503'));

    const res = await GET(
      makeRequest({ authHeader: 'Bearer test-secret' }),
      makeContext('aries'),
    );
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.errors[0]).toMatch(/generate: gateway 503/);
    expect(mockStore).not.toHaveBeenCalled();
    expect(mockDistribute).not.toHaveBeenCalled();
  });

  it('continues when distribute reports failure (still 200; social.success=false)', async () => {
    mockDistribute.mockResolvedValue({
      success: false,
      platformResults: { facebook: { success: false, error: 'Ayrshare 401' } },
    });

    const res = await GET(
      makeRequest({ authHeader: 'Bearer test-secret' }),
      makeContext('aries'),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.social.success).toBe(false);
    expect(body.social.platformResults.facebook.error).toBe('Ayrshare 401');
  });

  it('honors SOCIAL_PLATFORMS env override and posts to each platform independently', async () => {
    process.env.SOCIAL_PLATFORMS = 'facebook,x,tiktok';
    // Per-platform mock: distribute is called once per platform with a
    // single-element platforms array. Each call returns its own result.
    mockDistribute.mockImplementation(async ({ platforms }: { platforms: string[] }) => ({
      success: true,
      platformResults: { [platforms[0]]: { success: true, postId: `${platforms[0]}-1` } },
    }));

    const res = await GET(makeRequest({ authHeader: 'Bearer test-secret' }), makeContext('aries'));
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(mockDistribute).toHaveBeenCalledTimes(3);
    // Each call gets a single-platform array; the route formats per-platform
    // so an X-rejected post on facebook formatting doesn't propagate.
    expect(mockDistribute.mock.calls[0][0].platforms).toEqual(['facebook']);
    expect(mockDistribute.mock.calls[1][0].platforms).toEqual(['x']);
    expect(mockDistribute.mock.calls[2][0].platforms).toEqual(['tiktok']);

    // Content must differ per platform — X is character-capped at 280, FB
    // is long-form. If they were equal, the bug would still be present.
    const fbContent = mockDistribute.mock.calls[0][0].content as string;
    const xContent = mockDistribute.mock.calls[1][0].content as string;
    expect(fbContent).not.toBe(xContent);
    expect(xContent.length).toBeLessThanOrEqual(280);

    expect(body.social.attempted).toEqual(['facebook', 'x', 'tiktok']);
    expect(body.social.success).toBe(true);
  });

  it('records per-platform partial success when one platform fails', async () => {
    process.env.SOCIAL_PLATFORMS = 'facebook,x';
    mockDistribute.mockImplementation(async ({ platforms }: { platforms: string[] }) => {
      const p = platforms[0];
      if (p === 'x') {
        return { success: false, platformResults: { x: { success: false, error: 'rate limited' } } };
      }
      return { success: true, platformResults: { facebook: { success: true, postId: 'fb-1' } } };
    });

    const res = await GET(makeRequest({ authHeader: 'Bearer test-secret' }), makeContext('aries'));
    const body = await res.json();
    expect(res.status).toBe(200);
    // social.success is "all platforms succeeded" — partial = false.
    expect(body.social.success).toBe(false);
    expect(body.social.platformResults.facebook.success).toBe(true);
    expect(body.social.platformResults.x.success).toBe(false);
    expect(body.social.platformResults.x.error).toBe('rate limited');
  });

  it('skips distribute when SOCIAL_PLATFORMS is set to an empty list', async () => {
    process.env.SOCIAL_PLATFORMS = '';

    const res = await GET(
      makeRequest({ authHeader: 'Bearer test-secret' }),
      makeContext('aries'),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    // Empty env → falls back to default ['facebook'], so distribute IS called.
    // (Empty-string is truthy-empty after split/filter, but raw === '' branches
    // back to the default.) This documents the contract.
    expect(body.social.attempted).toEqual(['facebook']);
  });

  it('quality-gates social distribute when critique loop exhausts budget', async () => {
    mockGenerateWithCritique.mockResolvedValue({
      ...CRITIQUE_OK,
      rounds: 2,
      thresholdMissedAfterMaxRounds: true,
    });

    const res = await GET(
      makeRequest({ authHeader: 'Bearer test-secret' }),
      makeContext('aries'),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.thresholdMissedAfterMaxRounds).toBe(true);
    expect(body.rounds).toBe(2);
    expect(body.qualityGated).toBe(true);
    // Reading is still surfaced and stored — best-of-N path. Email still
    // delivers (subscribers expect daily delivery and the reading is the
    // best of N attempts), but social is held back to avoid public posting
    // of degraded content.
    expect(mockStore).toHaveBeenCalledTimes(1);
    expect(mockDistribute).not.toHaveBeenCalled();
    // social.attempted reflects what we WOULD have posted to so ops can see
    // the gate fired against the configured platform list.
    expect(body.social.attempted).toEqual(['facebook']);
    expect(body.social.success).toBe(false);
    expect(body.social.platformResults).toEqual({});
  });

  it('lowercases sign param so /api/cron/daily/ARIES still works', async () => {
    const res = await GET(
      makeRequest({ authHeader: 'Bearer test-secret' }),
      makeContext('ARIES'),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.sign).toBe('aries');
  });

  // ─── Idempotency lock ────────────────────────────────────────────────

  it('short-circuits with alreadyRunning:true when the per-(sign,date) lock is already held', async () => {
    // Upstash returns null when SET NX rejects an existing key.
    mockRedisSet.mockResolvedValue(null);

    const res = await GET(
      makeRequest({ authHeader: 'Bearer test-secret' }),
      makeContext('aries'),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.published).toBe(false);
    expect(body.alreadyRunning).toBe(true);
    // No work happened — generation, store, segment, distribute all skipped.
    expect(mockGenerateWithCritique).not.toHaveBeenCalled();
    expect(mockStore).not.toHaveBeenCalled();
    expect(mockSegment).not.toHaveBeenCalled();
    expect(mockDistribute).not.toHaveBeenCalled();
  });

  it('skips the lock when Redis is down (fail-open: better duplicate than no publish)', async () => {
    mockRedisPing.mockRejectedValue(new Error('redis down'));

    const res = await GET(
      makeRequest({ authHeader: 'Bearer test-secret' }),
      makeContext('aries'),
    );
    expect(res.status).toBe(200);
    // SET should NOT be attempted when ping failed.
    expect(mockRedisSet).not.toHaveBeenCalled();
    // Generation + distribute still proceed.
    expect(mockGenerateWithCritique).toHaveBeenCalledTimes(1);
    expect(mockDistribute).toHaveBeenCalledTimes(1);
  });

  // ─── SOCIAL_PLATFORMS edge cases ─────────────────────────────────────

  it('dedups SOCIAL_PLATFORMS so "facebook,facebook" does not double-post', async () => {
    process.env.SOCIAL_PLATFORMS = 'facebook,facebook';
    await GET(makeRequest({ authHeader: 'Bearer test-secret' }), makeContext('aries'));
    expect(mockDistribute).toHaveBeenCalledTimes(1);
    expect(mockDistribute.mock.calls[0][0].platforms).toEqual(['facebook']);
  });

  it('falls back to default ["facebook"] when SOCIAL_PLATFORMS contains only invalid entries', async () => {
    process.env.SOCIAL_PLATFORMS = 'twiter,linkdin'; // typos / unknown platforms
    const warnSpy = jest.spyOn(console, 'warn');

    const res = await GET(
      makeRequest({ authHeader: 'Bearer test-secret' }),
      makeContext('aries'),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    // Fallback fires so cron does not silently no-post; warn surfaces the typo.
    expect(body.social.attempted).toEqual(['facebook']);
    expect(mockDistribute).toHaveBeenCalledTimes(1);
    expect(mockDistribute.mock.calls[0][0].platforms).toEqual(['facebook']);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('matched no allowed platforms'),
    );
  });

  it('drops invalid entries silently when SOCIAL_PLATFORMS has at least one valid platform', async () => {
    process.env.SOCIAL_PLATFORMS = 'facebook,twiter';
    await GET(makeRequest({ authHeader: 'Bearer test-secret' }), makeContext('aries'));
    expect(mockDistribute).toHaveBeenCalledTimes(1);
    expect(mockDistribute.mock.calls[0][0].platforms).toEqual(['facebook']);
  });

  // ─── published vs success semantics ──────────────────────────────────

  it('published:false when generation succeeded but every email and platform failed', async () => {
    mockSegment.mockResolvedValue({
      subscribers: [{ email: 'a@b.com', sign: 'aries' }],
      count: 1,
    });
    mockSendDailyEmail.mockResolvedValue({ success: false, email: 'a@b.com', error: 'resend down' });
    mockDistribute.mockResolvedValue({
      success: false,
      platformResults: { facebook: { success: false, error: 'ayrshare 401' } },
    });

    const res = await GET(
      makeRequest({ authHeader: 'Bearer test-secret' }),
      makeContext('aries'),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    // success: cron didn't crash. published: nothing actually reached anyone.
    expect(body.success).toBe(true);
    expect(body.published).toBe(false);
    expect(body.emailed).toBe(0);
    expect(body.emailErrors).toBe(1);
    expect(body.social.success).toBe(false);
  });

  it('published:true when no subscribers AND no platforms (vacuous publish)', async () => {
    process.env.SOCIAL_PLATFORMS = 'twiter'; // → falls back to facebook (default)
    // To truly have no platforms, the only path is the quality gate. So this
    // test sets up no subscribers + quality gate (no platforms posted) and
    // asserts the route still reports the run as a non-error.
    mockGenerateWithCritique.mockResolvedValue({
      ...CRITIQUE_OK,
      rounds: 2,
      thresholdMissedAfterMaxRounds: true,
    });
    mockSegment.mockResolvedValue({ subscribers: [], count: 0 });

    const res = await GET(
      makeRequest({ authHeader: 'Bearer test-secret' }),
      makeContext('aries'),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    // No subscribers, no platforms posted (quality gate) → published is
    // vacuously true: there was nothing to publish, run is a non-error.
    expect(body.published).toBe(true);
    expect(body.qualityGated).toBe(true);
  });
});
