/**
 * /api/cron/daily/[sign] — Per-sign daily content cron.
 *
 * Replaces the single sequential 12-sign cron at /api/cron/daily-horoscope,
 * which was structurally guaranteed to time out under the 30s function budget
 * (12 signs × ~10s = 120s, with critique loop ~30-50s/sign on top of that).
 *
 * Each sign now runs its own cron tick in vercel.json `crons[]` (staggered by
 * minute to avoid provider RPM spikes). One sign per invocation gives the
 * critique loop comfortable headroom inside maxDuration=60.
 *
 * Pipeline per sign:
 *   1. Validate Bearer CRON_SECRET + sign param.
 *   2. assignDaily({ sign, date }) → today's philosopher.
 *   3. generateReadingWithCritique({ sign, philosopher, date }) — Sonnet 4.6
 *      via the bounded critique loop (Phase 1e). Up to 3 generations + 3 judges.
 *   4. cache:store the reading (best-effort; cron does not fail if Redis is down).
 *   5. audience:segment + sendDailyEmail for each subscriber to this sign.
 *   6. content:format(facebook) → content:distribute via Ayrshare.
 *
 * Returns a per-sign status object. Never throws; all step failures are
 * logged and surfaced in the response so cron history shows what broke.
 */

import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/utils/redis';
import { sendDailyEmail, type ReadingContent } from '@/utils/email';
import { assignDaily } from '@/tools/philosopher/assign-daily';
import { generateReadingWithCritique } from '@/tools/reading/generate-with-critique';
import { store } from '@/tools/cache/store';
import { formatReading, type Platform } from '@/tools/content/format';
import { distribute } from '@/tools/content/distribute';
import { segment } from '@/tools/audience/segment';
import { isValidSign, VALID_SIGNS, type ValidSign } from '@/tools/zodiac/sign-profile';

export const dynamic = 'force-dynamic';

/**
 * Per-route timeout override. The default in vercel.json is 30s; the critique
 * loop's worst case is ~30-50s, so we lift this route specifically. 60s leaves
 * headroom for the email/distribute tail. vercel.json carries the same value
 * as belt-and-suspenders for environments that don't honor route exports.
 */
export const maxDuration = 60;

type SocialPlatform = 'facebook' | 'x' | 'tiktok' | 'instagram';
const ALLOWED_SOCIAL: SocialPlatform[] = ['facebook', 'x', 'tiktok', 'instagram'];

/**
 * Platforms to post to via Ayrshare. Driven by SOCIAL_PLATFORMS env var
 * (comma-separated, e.g. "facebook,x"). Defaults to facebook only — the
 * only platform connected to Ayrshare today per HANDOFF.md §13. Ops can
 * flip on x/tiktok/instagram by setting the env var, no redeploy needed.
 */
function getSocialPlatforms(): SocialPlatform[] {
  const raw = process.env.SOCIAL_PLATFORMS;
  if (!raw) return ['facebook'];
  return raw
    .split(',')
    .map((p) => p.trim().toLowerCase())
    .filter((p): p is SocialPlatform => ALLOWED_SOCIAL.includes(p as SocialPlatform));
}

interface SignCronResult {
  success: boolean;
  sign: string;
  date: string;
  philosopher?: string;
  rounds?: number;
  thresholdMissedAfterMaxRounds?: boolean;
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

  // ─── Validate sign ──────────────────────────────────────────────────
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

  // ─── Generate ───────────────────────────────────────────────────────
  const { philosopher } = assignDaily({ sign, date });
  let result: Awaited<ReturnType<typeof generateReadingWithCritique>>;
  try {
    result = await generateReadingWithCritique({ sign, philosopher, date });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown generate error';
    console.error(`[cron:daily/${sign}] generation failed:`, msg);
    return NextResponse.json(
      emptyResult({
        sign,
        date,
        errors: [`generate: ${msg}`],
        philosopher,
      }),
      { status: 500 },
    );
  }

  const reading = result.reading;
  if (result.thresholdMissedAfterMaxRounds) {
    console.warn(
      `[cron:daily/${sign}] critique-loop exhausted budget — surfacing best-of-${result.rounds + 1} (overall=${result.judge.scores.overall}, antiBarnum=${result.judge.scores.antiBarnum}, voice=${result.judge.scores.voiceAuthenticity})`,
    );
  }

  // ─── Cache (best-effort) ────────────────────────────────────────────
  let cached = false;
  if (redisHealthy) {
    try {
      const stored = await store({ sign, philosopher, date, reading });
      cached = stored.success;
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
          reading: readingForFormat(reading, philosopher),
          platform: 'email' satisfies Platform,
        });
        const emailContent: ReadingContent = {
          text: formatted.text,
          quote: { text: reading.inspirationalQuote, author: reading.quoteAuthor, source: '' },
        };

        for (const sub of subscribers) {
          const sendResult = await sendDailyEmail(
            { email: sub.email, sign: sign as ValidSign },
            emailContent,
          );
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
  const platforms = getSocialPlatforms();
  let social: SignCronResult['social'] = {
    attempted: platforms,
    success: false,
    platformResults: {},
  };

  // Format and post per platform. Each platform has its own length budget
  // and hashtag strategy (X is 280 chars; FB allows long-form CTA; etc.) —
  // posting a single FB-formatted blob to all platforms would silently
  // truncate or get rejected on X. Sequential per-platform calls keep each
  // post correctly sized; total added latency is ~1s × N.
  const platformResults: Record<string, { success: boolean; error?: string }> = {};
  let anyPlatformSucceeded = false;

  for (const platform of platforms) {
    try {
      const formatted = formatReading({
        reading: readingForFormat(reading, philosopher),
        platform: platform satisfies Platform,
      });
      // formatReading owns per-platform hashtag strategy; appending here
      // keeps distribute as a dumb passthrough.
      const hashtagSuffix = formatted.hashtags.length > 0
        ? '\n\n' + formatted.hashtags.map((h) => `#${h}`).join(' ')
        : '';
      const post = formatted.text + hashtagSuffix;

      const distributed = await distribute({ content: post, platforms: [platform] });
      const result = distributed.platformResults[platform] ?? {
        success: distributed.success,
        error: distributed.success ? undefined : 'No result returned for platform',
      };
      platformResults[platform] = { success: result.success, error: result.error };
      if (result.success) anyPlatformSucceeded = true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown distribute error';
      platformResults[platform] = { success: false, error: msg };
      errors.push(`distribute:${platform}: ${msg}`);
      console.error(`[cron:daily/${sign}] distribute failed for ${platform}:`, msg);
    }
  }

  if (platforms.length > 0) {
    social = {
      attempted: platforms,
      // success means "all attempted platforms succeeded" — same contract as
      // the underlying distribute verb; partial-success is visible per platform.
      success: platforms.every((p) => platformResults[p]?.success === true),
      platformResults,
    };
    if (!social.success && anyPlatformSucceeded) {
      console.warn(
        `[cron:daily/${sign}] partial social success — ${Object.entries(platformResults)
          .filter(([, r]) => !r.success)
          .map(([p, r]) => `${p}: ${r.error ?? 'unknown'}`)
          .join('; ')}`,
      );
    }
  }

  return NextResponse.json({
    success: true,
    sign,
    date,
    philosopher,
    rounds: result.rounds,
    thresholdMissedAfterMaxRounds: result.thresholdMissedAfterMaxRounds,
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
  philosopher?: string;
}): SignCronResult {
  return {
    success: false,
    sign: input.sign,
    date: input.date,
    philosopher: input.philosopher,
    cached: false,
    emailed: 0,
    emailErrors: 0,
    social: { attempted: [], success: false, platformResults: {} },
    errors: input.errors,
  };
}

/**
 * Adapt a tool ReadingOutput to the ReadingContent shape `formatReading`
 * expects. They are nearly identical — `formatReading` just needs the
 * sign/philosopher/date as siblings of the message fields.
 */
function readingForFormat(
  reading: Awaited<ReturnType<typeof generateReadingWithCritique>>['reading'],
  philosopher: string,
) {
  return {
    sign: reading.sign,
    message: reading.message,
    inspirationalQuote: reading.inspirationalQuote,
    quoteAuthor: reading.quoteAuthor,
    peacefulThought: reading.peacefulThought,
    philosopher,
    date: reading.date,
  };
}
