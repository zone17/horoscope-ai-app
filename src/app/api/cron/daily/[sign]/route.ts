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
import {
  formatReading,
  type Platform,
  type ReadingContent as FormatReadingContent,
} from '@/tools/content/format';
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
  const requested = raw.split(',').map((p) => p.trim().toLowerCase()).filter(Boolean);
  const filtered = requested.filter(
    (p): p is SocialPlatform => ALLOWED_SOCIAL.includes(p as SocialPlatform),
  );
  // Dedup so SOCIAL_PLATFORMS="facebook,facebook" does not double-post.
  const deduped = Array.from(new Set(filtered));
  if (requested.length > 0 && deduped.length === 0) {
    // All entries were rejected by the allowlist — likely an ops typo. Fall
    // back to the safe default so the cron does not silently no-post.
    console.warn(
      `[cron] SOCIAL_PLATFORMS=${JSON.stringify(raw)} matched no allowed platforms (${ALLOWED_SOCIAL.join('|')}); falling back to ['facebook']`,
    );
    return ['facebook'];
  }
  return deduped;
}

/**
 * Acquire a per-(sign,date) idempotency lock so a cron retry or a concurrent
 * manual curl cannot double-publish. Atomic SET NX with a 24h TTL — first
 * caller wins, all later callers short-circuit. Fails open (returns true) if
 * Redis is unreachable: silent double-publish is bad, but silent no-publish
 * is worse, and the cron lock is a soft guarantee.
 */
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
  /** True when the cron handler completed without throwing. Distinct from
   *  `published` — generation can succeed but every email and every social
   *  post fail; that path returns success:true, published:false. */
  success: boolean;
  /** True when this invocation actually published anything visible to users
   *  (at least one email sent OR at least one social platform succeeded),
   *  OR when there was nothing to publish (no subscribers and no platforms). */
  published: boolean;
  /** True when an earlier invocation already ran for this (sign,date) pair
   *  and we short-circuited to avoid double-publishing. */
  alreadyRunning?: boolean;
  /** True when the critique loop's quality threshold could not be met after
   *  the round budget was exhausted; the route stores the reading but skips
   *  social distribution to avoid publishing degraded content publicly. */
  qualityGated?: boolean;
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

  // ─── Idempotency lock ───────────────────────────────────────────────
  // A Vercel cron retry (transient flake) or a concurrent manual curl would
  // otherwise double-send emails and double-post social. Per-(sign,date)
  // Redis lock makes this at-most-once-per-day. Skipped when Redis is down
  // (fail-open: missed publish > duplicate publish under provider outage).
  if (redisHealthy) {
    const acquired = await tryAcquireDailyLock(sign, date);
    if (!acquired) {
      console.warn(`[cron:daily/${sign}] lock already held for ${date} — skipping to avoid double-publish`);
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
          // sign is narrowed to ValidSign by isValidSign above; no cast needed.
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
  // Quality gate: when the critique loop exhausted its budget, we still
  // store the reading + email subscribers (subscribers expect daily delivery
  // and the reading is the BEST of N attempts), but we do NOT post the
  // degraded content publicly to social — the moat is anti-template quality.
  const requestedPlatforms = getSocialPlatforms();
  const qualityGated = result.thresholdMissedAfterMaxRounds;
  const platforms = qualityGated ? [] : requestedPlatforms;

  if (qualityGated && requestedPlatforms.length > 0) {
    console.warn(
      `[cron:daily/${sign}] skipping social distribute (${requestedPlatforms.join(',')}) — quality threshold missed after ${result.rounds} critique rounds. Email + cache still ran.`,
    );
  }

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

  // Surface BOTH what we attempted and what we would have attempted (for
  // observability when the quality gate fired). On the quality-gated path
  // platformResults is empty by construction; success: false and
  // qualityGated: true together tell ops "we held back deliberately."
  const social: SignCronResult['social'] = {
    attempted: qualityGated ? requestedPlatforms : platforms,
    success: platforms.length > 0 && platforms.every((p) => platformResults[p]?.success === true),
    platformResults,
  };
  if (platforms.length > 0 && !social.success && anyPlatformSucceeded) {
    console.warn(
      `[cron:daily/${sign}] partial social success — ${Object.entries(platformResults)
        .filter(([, r]) => !r.success)
        .map(([p, r]) => `${p}: ${r.error ?? 'unknown'}`)
        .join('; ')}`,
    );
  }

  // `published` is the user-visible truth: did anything actually reach a
  // subscriber or social platform? Distinct from `success` (cron didn't
  // throw). When the route didn't actually attempt to publish anywhere
  // (no subscribers AND no post-gate platforms) the run is vacuously
  // published — there was nothing to publish, so the absence of failure
  // is the absence of failure. Note: `platforms` here is the post-quality-
  // gate list. A run that was quality-gated with zero subscribers
  // produces published:true because no degraded content went out — that
  // is a non-error outcome, not a publishing failure.
  const triedToPublish = emailed + emailErrors > 0 || platforms.length > 0;
  const published = !triedToPublish || emailed > 0 || anyPlatformSucceeded;

  return NextResponse.json({
    success: true,
    published,
    qualityGated: qualityGated || undefined,
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
    published: false,
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
 * sign/philosopher/date as siblings of the message fields. Explicit return
 * type prevents silent drift if ReadingContent gains a required field.
 */
function readingForFormat(
  reading: Awaited<ReturnType<typeof generateReadingWithCritique>>['reading'],
  philosopher: string,
): FormatReadingContent {
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
