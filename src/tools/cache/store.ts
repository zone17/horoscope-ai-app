/**
 * cache:store — Atomic tool
 *
 * Stores a reading in Redis with a key derived from all relevant inputs
 * (sign, philosopher, date, council). Fixes P0 #2 by ensuring philosopher
 * selections are always part of the key.
 *
 * Input:  { sign, philosopher, date, council?, reading, ttl? }
 * Output: { success: boolean, key: string }
 *
 * Uses the existing Redis client from @/utils/redis. Gracefully handles
 * Redis being unavailable — logs a warning and returns success: false.
 */

import { redis, CACHE_DURATIONS } from '@/utils/redis';
import { buildCacheKey, type CacheKeyParams } from '@/tools/cache/keys';

// ─── Types ──────────────────────────────────────────────────────────────

export interface StoreInput {
  sign: string;
  philosopher: string;
  date: string;
  council?: string[];
  reading: unknown;
  ttl?: number; // seconds, defaults to 86400 (1 day)
}

export interface StoreOutput {
  success: boolean;
  key: string;
}

// ─── Core Logic ─────────────────────────────────────────────────────────

/**
 * cache:store
 *
 * Serialize and store a reading in Redis. The cache key is built from all
 * inputs so different philosopher/council combinations never collide.
 *
 * @param input.sign        - Zodiac sign (case-insensitive)
 * @param input.philosopher - The philosopher for this reading (MUST be in key)
 * @param input.date        - Date in YYYY-MM-DD format
 * @param input.council     - Optional council array; if provided, hashed into key
 * @param input.reading     - The reading data to cache
 * @param input.ttl         - Time to live in seconds (default: 1 day)
 *
 * @returns { success, key }
 */
export async function store(input: StoreInput): Promise<StoreOutput> {
  const keyParams: CacheKeyParams = {
    sign: input.sign,
    philosopher: input.philosopher,
    date: input.date,
    council: input.council,
  };
  const key = buildCacheKey(keyParams);
  const ttl = input.ttl ?? CACHE_DURATIONS.ONE_DAY;

  try {
    if (input.reading === null || input.reading === undefined) {
      console.warn(`[cache:store] Attempted to store null/undefined for key: ${key}`);
      return { success: false, key };
    }

    // Serialize with safe handling for Map/Set
    let serialized: string;
    try {
      serialized = JSON.stringify(input.reading, (_k, v) => {
        if (v instanceof Map) return Object.fromEntries(v);
        if (v instanceof Set) return Array.from(v);
        return v;
      });
      // Validate round-trip
      JSON.parse(serialized);
    } catch (err) {
      console.error(`[cache:store] Serialization failed for key ${key}:`, err);
      return { success: false, key };
    }

    await redis.set(key, serialized, { ex: ttl });
    console.log(`[cache:store] Stored key: ${key} (ttl: ${ttl}s)`);
    return { success: true, key };
  } catch (err) {
    console.warn(`[cache:store] Redis unavailable, skipping store for key: ${key}`, err);
    return { success: false, key };
  }
}
