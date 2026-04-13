/**
 * cache:invalidate — Atomic tool
 *
 * Deletes cached entries matching a glob pattern using SCAN + DEL.
 * Never uses KEYS to avoid blocking Redis on large datasets.
 *
 * Input:  { pattern: string }  e.g. "horoscope:daily:aries:*"
 * Output: { deleted: number }
 *
 * Uses the existing Redis client from @/utils/redis.
 */

import { redis } from '@/utils/redis';

// ─── Types ──────────────────────────────────────────────────────────────

export interface InvalidateInput {
  pattern: string; // Redis glob pattern, e.g. "horoscope:daily:aries:*"
}

export interface InvalidateOutput {
  deleted: number;
}

// ─── Core Logic ─────────────────────────────────────────────────────────

/**
 * cache:invalidate
 *
 * Scan for keys matching the pattern and delete them in batches.
 * Uses SCAN (cursor-based) instead of KEYS to stay non-blocking.
 *
 * @param input.pattern - Redis glob pattern for key matching
 *
 * @returns { deleted } — total number of keys removed
 */
export async function invalidate(
  input: InvalidateInput,
): Promise<InvalidateOutput> {
  const { pattern } = input;
  let deleted = 0;

  try {
    let cursor = 0;

    do {
      // Upstash redis.scan returns [cursor, keys]
      const [nextCursor, keys] = await redis.scan(cursor, {
        match: pattern,
        count: 100,
      });

      cursor = typeof nextCursor === 'string' ? parseInt(nextCursor, 10) : nextCursor;

      if (keys.length > 0) {
        // Delete in batch using pipeline for efficiency
        const pipeline = redis.pipeline();
        for (const key of keys) {
          pipeline.del(key);
        }
        await pipeline.exec();
        deleted += keys.length;
      }
    } while (cursor !== 0);

    console.log(
      `[cache:invalidate] Deleted ${deleted} key(s) matching "${pattern}"`,
    );
    return { deleted };
  } catch (err) {
    console.warn(
      `[cache:invalidate] Redis unavailable or scan failed for pattern "${pattern}"`,
      err,
    );
    return { deleted };
  }
}
