/**
 * cache:retrieve — Atomic tool
 *
 * Retrieves a cached reading from Redis using the same key derivation as
 * cache:store. Returns null on cache miss or Redis unavailability.
 *
 * Input:  { sign, philosopher, date, council? }
 * Output: T | null
 *
 * Uses the existing Redis client from @/utils/redis.
 */

import { redis } from '@/utils/redis';
import { buildCacheKey, type CacheKeyParams } from '@/tools/cache/keys';

// ─── Types ──────────────────────────────────────────────────────────────

export interface RetrieveInput {
  sign: string;
  philosopher: string;
  date: string;
  council?: string[];
}

// ─── Core Logic ─────────────────────────────────────────────────────────

/**
 * cache:retrieve
 *
 * Look up a cached reading. The key is derived identically to cache:store
 * so the same inputs always match.
 *
 * @param input.sign        - Zodiac sign (case-insensitive)
 * @param input.philosopher - The philosopher for this reading
 * @param input.date        - Date in YYYY-MM-DD format
 * @param input.council     - Optional council array
 *
 * @returns The cached reading or null if not found / Redis unavailable
 */
export async function retrieve<T = unknown>(
  input: RetrieveInput,
): Promise<T | null> {
  const keyParams: CacheKeyParams = {
    sign: input.sign,
    philosopher: input.philosopher,
    date: input.date,
    council: input.council,
  };
  const key = buildCacheKey(keyParams);

  try {
    const raw = await redis.get(key);

    if (raw === null || raw === undefined) {
      return null;
    }

    // With automaticDeserialization: false, we always get a string
    if (typeof raw === 'string') {
      try {
        return JSON.parse(raw) as T;
      } catch (err) {
        console.error(`[cache:retrieve] JSON parse failed for key ${key}:`, err);
        // Corrupt entry — delete it so future requests get a fresh reading
        await redis.del(key);
        return null;
      }
    }

    // Unexpected type — should not happen with automaticDeserialization: false
    console.error(
      `[cache:retrieve] Unexpected data type from Redis for key ${key}: ${typeof raw}`,
    );
    await redis.del(key);
    return null;
  } catch (err) {
    console.warn(`[cache:retrieve] Redis unavailable for key: ${key}`, err);
    return null;
  }
}
