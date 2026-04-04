#!/usr/bin/env npx tsx
/**
 * Backfill daily horoscope archive.
 *
 * Generates historical readings for the last N days (default 90) and stores
 * them in Redis with a 30-day TTL. Skips dates/signs that already have
 * cached content.
 *
 * Usage:
 *   npx tsx scripts/backfill-archive.ts              # generate last 90 days
 *   npx tsx scripts/backfill-archive.ts --days 30    # generate last 30 days
 *   npx tsx scripts/backfill-archive.ts --dry-run    # count only, no API calls
 *
 * Requires env vars: OPENAI_API_KEY, UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
 *
 * Estimated cost: ~$0.002/call × (days × 12 signs) = ~$2.16 for 90 days
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { horoscopeKeys } from '../src/utils/cache-keys';
import { checkRedisKey, safelyStoreInRedis } from '../src/utils/redis-helpers';
import { ARCHIVE_START_DATE } from '../src/utils/daily-archive';

// We import the generator module dynamically so we can patch the date
const VALID_SIGNS = [
  'aries', 'taurus', 'gemini', 'cancer',
  'leo', 'virgo', 'libra', 'scorpio',
  'sagittarius', 'capricorn', 'aquarius', 'pisces',
] as const;

// ---------------------------------------------------------------------------
// CLI flags
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const daysIndex = args.indexOf('--days');
const days = daysIndex !== -1 && args[daysIndex + 1]
  ? parseInt(args[daysIndex + 1], 10)
  : 90;

if (isNaN(days) || days < 1) {
  console.error('Invalid --days value. Must be a positive integer.');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Date generation
// ---------------------------------------------------------------------------
function getDatesForBackfill(numDays: number): string[] {
  const dates: string[] = [];
  const now = new Date();
  const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

  for (let i = 1; i <= numDays; i++) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    if (dateStr < ARCHIVE_START_DATE) break;
    dates.push(dateStr);
  }
  return dates;
}

// ---------------------------------------------------------------------------
// Throttled generation with date override
// ---------------------------------------------------------------------------
async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const dates = getDatesForBackfill(days);
  const total = dates.length * VALID_SIGNS.length;

  console.log(`Backfill archive: ${dates.length} dates × ${VALID_SIGNS.length} signs = ${total} readings`);
  if (dates.length > 0) {
    console.log(`  Date range: ${dates[dates.length - 1]} → ${dates[0]}`);
  }
  console.log(`  Mode: ${dryRun ? 'DRY RUN (no API calls)' : 'LIVE'}`);
  console.log('');

  // Build list of work items, checking Redis for existing content
  const work: { sign: string; date: string }[] = [];
  let skipped = 0;

  for (const date of dates) {
    for (const sign of VALID_SIGNS) {
      const cacheKey = horoscopeKeys.daily(sign, date);
      const exists = await checkRedisKey(cacheKey);
      if (exists) {
        skipped++;
      } else {
        work.push({ sign, date });
      }
    }
  }

  console.log(`  Already cached: ${skipped}`);
  console.log(`  To generate:    ${work.length}`);
  console.log('');

  if (dryRun || work.length === 0) {
    console.log(dryRun ? 'Dry run complete. No API calls made.' : 'Nothing to generate. All dates are cached.');
    process.exit(0);
  }

  // Dynamically import to pick up env vars loaded above
  const { generateHoroscope, getTodayDate } = await import('../src/utils/horoscope-generator');
  const { buildHoroscopePrompt, getPhilosopherAssignment } = await import('../src/utils/horoscope-prompts');

  let generated = 0;
  let failed = 0;

  // Process in batches of 2 concurrent
  for (let i = 0; i < work.length; i += 2) {
    const batch = work.slice(i, i + 2);

    const promises = batch.map(async ({ sign, date }) => {
      try {
        // We need to generate with a specific date context.
        // The generator uses getTodayDate() internally, but we need the philosopher
        // assignment and prompt to use our target date. We'll call the generator
        // and then override the date in the stored data.
        //
        // Unfortunately, the generator uses new Date() internally for the date field.
        // We temporarily override Date to ensure correct date context.
        const originalDate = global.Date;
        const targetDate = new Date(date + 'T12:00:00Z');

        // Monkey-patch Date for this call
        const OrigDate = global.Date;
        // @ts-expect-error -- temporary Date override for backfill
        global.Date = class extends OrigDate {
          constructor(...args: unknown[]) {
            if (args.length === 0) {
              super(targetDate.getTime());
            } else {
              // @ts-expect-error -- forwarding constructor args
              super(...args);
            }
          }
          static now() {
            return targetDate.getTime();
          }
        };
        // Preserve static methods
        // @ts-expect-error
        global.Date.UTC = OrigDate.UTC;
        // @ts-expect-error
        global.Date.parse = OrigDate.parse;

        try {
          const horoscope = await generateHoroscope(sign, 'daily');
          // Ensure the date field matches the target date
          horoscope.date = date;

          const cacheKey = horoscopeKeys.daily(sign, date);
          await safelyStoreInRedis(cacheKey, horoscope, { ttl: 2592000 }); // 30 days

          generated++;
          console.log(`  [${generated + failed}/${work.length}] Generated ${sign} for ${date}`);
        } finally {
          global.Date = originalDate;
        }
      } catch (err) {
        failed++;
        console.error(`  [FAIL] ${sign} ${date}: ${err instanceof Error ? err.message : err}`);
      }
    });

    await Promise.all(promises);

    // Throttle between batches to respect rate limits
    if (i + 2 < work.length) {
      await sleep(500);
    }
  }

  console.log('');
  console.log(`Backfill complete: ${generated} generated, ${failed} failed, ${skipped} already cached`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
