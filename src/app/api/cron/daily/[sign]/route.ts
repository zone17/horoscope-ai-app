/**
 * /api/cron/daily/[sign] — Per-sign daily content cron (v2).
 *
 * Pipeline per sign (post-rebuild):
 *   1. Validate Bearer CRON_SECRET + sign param.
 *   2. composeReadingV2({ sign, council: DEFAULT_COUNCIL, date })
 *      generates morning + evening readings + selects today's quote.
 *      Auto-fail filters in generate-v2 do the runtime gating; the
 *      v1 critique loop is no longer used.
 *   3. cache:store the ReadingV2 payload at the v2 cache key.
 *   4. audience:segment + sendDailyEmail using morning_reading content.
 *   5. content:format(facebook) → content:distribute via Ayrshare.
 *
 * Returns a per-sign status object. Never throws; all step failures are
 * logged and surfaced in the response so cron history shows what broke.
 *
 * See docs/research/2026-04-29-readings-resonance.md for the architecture.
 */

import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/utils/redis';
import { sendDailyEmail, type ReadingContent } from '@/utils/email';
import { composeReadingV2 } from '@/tools/reading/compose-v2';
import { buildCacheKeyV2 } from '@/tools/cache/keys';
import { CACHE_DURATIONS } from '@/utils/redis';
import {
  formatReading,
  type Platform,
  type ReadingContent as FormatReadingContent,
} from '@/tools/content/format';
import { distribute } from '@/tools/content/distribute';
import { segment } from '@/tools/audience/segment';
import { isValidSign, VALID_SIGNS } from '@/tools/zodiac/sign-profile';
import type { ReadingV2 } from '@/tools/reading/types';

export const dynamic = 'force-dynamic';

/**
 * Per-route timeout. Two parallel reading generations + Haiku council
 * synthesis + cache + email + social fits comfortably in 60s. The v1
 * critique loop required 60s for a single reading; the v2 path is
 * significantly faster (no critique loop) and handles 2 surfaces.
 */
export const maxDuration = 60;

/**
 * Default council for cron-generated readings. Per
 * docs/research/2026-04-29-readings-resonance.md §13.3 an anonymous
 * "default" reading needs a council to drive deep injection; this 3-
 * philosopher composite is tuned for the median reader.
 */
const DEFAULT_COUNCIL: string[] = ['Marcus Aurelius', 'Pema Chödrön', 'Naval Ravikant'];

type SocialPlatform = 'facebook' | 'x' | 'tiktok' | 'instagram';
const ALLOWED_SOCIAL: SocialPlatform[] = ['facebook', 'x', 'tiktok', 'instagram'];

function getSocialPlatforms(): SocialPlatform[] {
  const raw = process.env.SOCIAL_PLATFORMS;
  if (!raw) return ['facebook'];
  const requested = raw.split(',').map((p) => p.trim().toLowerCase()).filter(Boolean);
  const filtered = requested.filter(
    (p): p is SocialPlatform => ALLOWED_SOCIAL.includes(p as SocialPlatform),
  );
  const deduped = Array.from(new Set(filtered));
  if (requested.length > 0 && deduped.length === 0) {
    console.warn(
      `[cron] SOCIAL_PLATFORMS=${JSON.stringify(raw)} matched no allowed platforms; falling back to ['facebook']`,
    );
    return ['facebook'];
  }
  return deduped;
}

async function tryAcquireDailyLock(sign: string, date: string): Promise<boolean> {
  try {
    const result = await redis.set(`cron-lock:${sign}:${date}`, new Date().toISOString(), {
      nx: true,
      ex: 24 * 60 * 60,
    });
    return result === 'OK';
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown';
    console.warn(`[cron:daily/${sign}] lock acquire failed (${msg}); proceeding without lock`);
    return true;
  }
}

interface SignCronResult {
  success: boolean;
  published: boolean;
  alreadyRunning?: boolean;
  sign: string;
  date: string;
  retries?: { morning: number; evening: number };
  cached: boolean;
  emailed: number;
  emailErrors: number;
  social: {
    attempted: SocialPlatform[];
    success: boolean;
    platformResults: Record<string, { success: boolean; error?: string }>;
  };
  errors: string[];
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ sign: string }> },
): Promise<NextResponse<SignCronResult>> {
  const errors: string[] = [];
  const date = new Date().toISOString().split('T')[0];

  // ─── Auth ───────────────────────────────────────────────────────────
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      emptyResult({ sign: 'unknown', date, errors: ['Unauthorized'] }),
      { status: 401 },
    );
  }

  const { sign: rawSign } = await context.params;
  const sign = (rawSign ?? '').toLowerCase();
  if (!isValidSign(sign)) {
    return NextResponse.json(
      emptyResult({
        sign: rawSign ?? 'unknown',
        date,
        errors: [`Invalid sign: "${rawSign}". Valid: ${VALID_SIGNS.join(', ')}`],
      }),
      { status: 400 },
    );
  }

  // ─── Redis health (best-effort) ─────────────────────────────────────
  let redisHealthy = true;
  try {
    await redis.ping();
  } catch {
    redisHealthy = false;
    console.warn(`[cron:daily/${sign}] Redis unavailable — skipping cache + segment`);
  }

  // ─── Idempotency lock ───────────────────────────────────────────────
  if (redisHealthy) {
    const acquired = await tryAcquireDailyLock(sign, date);
    if (!acquired) {
      console.warn(`[cron:daily/${sign}] lock already held for ${date}; skipping to avoid double-publish`);
      return NextResponse.json({
        success: true,
        published: false,
        alreadyRunning: true,
        sign,
        date,
        cached: false,
        emailed: 0,
        emailErrors: 0,
        social: { attempted: [], success: false, platformResults: {} },
        errors: [],
      });
    }
  }

  // ─── Generate ───────────────────────────────────────────────────────
  let reading: ReadingV2;
  let retries: { morning: number; evening: number };
  try {
    const composed = await composeReadingV2({ sign, council: DEFAULT_COUNCIL, date });
    reading = composed.reading;
    retries = composed.retries;
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown generate error';
    console.error(`[cron:daily/${sign}] generation failed:`, msg);
    return NextResponse.json(
      emptyResult({ sign, date, errors: [`generate: ${msg}`] }),
      { status: 500 },
    );
  }

  // ─── Cache (best-effort) ────────────────────────────────────────────
  let cached = false;
  if (redisHealthy) {
    try {
      const cacheKey = buildCacheKeyV2({ sign, date });
      await redis.set(cacheKey, JSON.stringify(reading), { ex: CACHE_DURATIONS.ONE_DAY });
      cached = true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown store error';
      errors.push(`store: ${msg}`);
      console.error(`[cron:daily/${sign}] store failed:`, msg);
    }
  }

  // ─── Email subscribers (best-effort) ────────────────────────────────
  let emailed = 0;
  let emailErrors = 0;
  if (redisHealthy) {
    try {
      const { subscribers } = await segment({ sign });
      if (subscribers.length > 0) {
        const formatted = formatReading({
          reading: readingForFormat(reading),
          platform: 'email' satisfies Platform,
        });
        const emailContent: ReadingContent = {
          text: formatted.text,
          quote: { text: reading.quote.text, author: reading.quote.quote_philosopher, source: reading.quote.source },
        };

        for (const sub of subscribers) {
          const sendResult = await sendDailyEmail({ email: sub.email, sign }, emailContent);
          if (sendResult.success) emailed++;
          else emailErrors++;
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown email error';
      errors.push(`email: ${msg}`);
      console.error(`[cron:daily/${sign}] email loop failed:`, msg);
    }
  }

  // ─── Social distribute (best-effort) ────────────────────────────────
  // No critique-loop quality gate under v2: auto-fail filters in generate-v2
  // already enforce the dash ban / anti-tells / length / buzzword caps before
  // a reading is returned. If the filters pass, the reading meets the bar.
  const platforms = getSocialPlatforms();
  const platformResults: Record<string, { success: boolean; error?: string }> = {};
  let anyPlatformSucceeded = false;

  for (const platform of platforms) {
    try {
      const formatted = formatReading({
        reading: readingForFormat(reading),
        platform: platform satisfies Platform,
      });
      const hashtagSuffix = formatted.hashtags.length > 0
        ? '\n\n' + formatted.hashtags.map((h) => `#${h}`).join(' ')
        : '';
      const post = formatted.text + hashtagSuffix;

      const distributed = await distribute({ content: post, platforms: [platform] });
      const platformResult = distributed.platformResults[platform] ?? {
        success: distributed.success,
        error: distributed.success ? undefined : 'No result returned for platform',
      };
      platformResults[platform] = { success: platformResult.success, error: platformResult.error };
      if (platformResult.success) anyPlatformSucceeded = true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown distribute error';
      platformResults[platform] = { success: false, error: msg };
      errors.push(`distribute:${platform}: ${msg}`);
      console.error(`[cron:daily/${sign}] distribute failed for ${platform}:`, msg);
    }
  }

  const social: SignCronResult['social'] = {
    attempted: platforms,
    success: platforms.length > 0 && platforms.every((p) => platformResults[p]?.success === true),
    platformResults,
  };
  if (platforms.length > 0 && !social.success && anyPlatformSucceeded) {
    console.warn(
      `[cron:daily/${sign}] partial social success: ${Object.entries(platformResults)
        .filter(([, r]) => !r.success)
        .map(([p, r]) => `${p}: ${r.error ?? 'unknown'}`)
        .join('; ')}`,
    );
  }

  const triedToPublish = emailed + emailErrors > 0 || platforms.length > 0;
  const published = !triedToPublish || emailed > 0 || anyPlatformSucceeded;

  return NextResponse.json({
    success: true,
    published,
    sign,
    date,
    retries,
    cached,
    emailed,
    emailErrors,
    social,
    errors,
  });
}

// ─── Helpers ────────────────────────────────────────────────────────────

function emptyResult(input: {
  sign: string;
  date: string;
  errors: string[];
}): SignCronResult {
  return {
    success: false,
    published: false,
    sign: input.sign,
    date: input.date,
    cached: false,
    emailed: 0,
    emailErrors: 0,
    social: { attempted: [], success: false, platformResults: {} },
    errors: input.errors,
  };
}

/**
 * Adapt the v2 ReadingV2 payload to the legacy FormatReadingContent shape
 * used by content:format. This is a temporary bridge while format.ts is
 * still v1-shaped; format.ts can later be rewritten to take ReadingV2
 * directly.
 *
 * The bridge: morning_reading becomes the message body for social/email;
 * evening_reading is appended as a "Tonight:" tail line so subscribers
 * receive both surfaces in their daily email; quote stays as quote.
 * Philosopher field is set to the quote's philosopher (legacy formatters
 * reference it for caption attribution where appropriate).
 */
function readingForFormat(reading: ReadingV2): FormatReadingContent {
  return {
    sign: reading.sign,
    message: reading.morning_reading,
    inspirationalQuote: reading.quote.text,
    quoteAuthor: reading.quote.quote_philosopher,
    peacefulThought: reading.evening_reading,
    philosopher: reading.quote.quote_philosopher,
    date: reading.date,
  };
}
