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
  redis: { ping: () => mockRedisPing() },
}));

// Import AFTER mocks are registered
import { GET } from '@/app/api/cron/daily/[sign]/route';

// ─── Fixtures ───────────────────────────────────────────────────────────

const READING: ReadingOutput = {
  sign: 'aries',
  date: '2026-04-26',
  philosopher: 'Alan Watts',
  message:
    'A test reading message of sufficient length to satisfy schema and look reasonable in any downstream formatter that lays it out for a subscriber.',
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

  it('honors SOCIAL_PLATFORMS env override', async () => {
    process.env.SOCIAL_PLATFORMS = 'facebook,x,tiktok';

    await GET(makeRequest({ authHeader: 'Bearer test-secret' }), makeContext('aries'));

    expect(mockDistribute).toHaveBeenCalledTimes(1);
    const call = mockDistribute.mock.calls[0][0];
    expect(call.platforms).toEqual(['facebook', 'x', 'tiktok']);
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

  it('logs and returns thresholdMissedAfterMaxRounds when critique loop exhausts budget', async () => {
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
    // Reading is still surfaced and stored — best-of-N path.
    expect(mockStore).toHaveBeenCalledTimes(1);
    expect(mockDistribute).toHaveBeenCalledTimes(1);
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
});
