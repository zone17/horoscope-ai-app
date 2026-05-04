/**
 * cache:keys — Shared key generation
 *
 * Deterministic cache key builder that includes philosopher selections.
 * Fixes P0 #2: cache keys now always include philosopher context so two
 * users with different councils never share a cached reading.
 *
 * Both store and retrieve import this to guarantee key symmetry.
 */

import { createHash } from 'crypto';

// ─── Types ──────────────────────────────────────────────────────────────

export interface CacheKeyParams {
  sign: string;
  philosopher: string;
  date: string;
  council?: string[];
}

// ─── Helpers ────────────────────────────────────────────────────────────

/**
 * Produces a short, deterministic hash of a sorted council array.
 * Uses SHA-256 truncated to 12 hex chars — collision-safe for our key space.
 *
 * Dedups + Unicode-normalizes before hashing so logically-equivalent councils
 * share a cache entry: ['Marcus', 'Marcus'] and ['Marcus'] hash the same;
 * 'Pema Chödrön' and 'Pema Chodron' hash the same. Without this, duplicate
 * entries or diacritic drift produced separate cache entries for the same
 * logical council (Wave 1C QA finding 2.13).
 */
function hashCouncil(council: string[]): string {
  const normalized = council
    .map((p) => p.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim())
    .filter((p) => p.length > 0);
  const deduped = Array.from(new Set(normalized)).sort();
  const digest = createHash('sha256')
    .update(deduped.join('|'))
    .digest('hex');
  return digest.slice(0, 12);
}

// ─── Public API ─────────────────────────────────────────────────────────

/**
 * Build a deterministic cache key from reading parameters.
 *
 * Key formats:
 *   - No council:   horoscope:daily:{sign}:{date}:{philosopher}
 *   - With council:  horoscope:personalized:{sign}:{date}:{councilHash}
 *
 * The philosopher is always embedded — either literally in the daily key
 * or via the council hash in the personalized key.
 */
export function buildCacheKey(params: CacheKeyParams): string {
  const sign = params.sign.toLowerCase().trim();
  const philosopher = params.philosopher.toLowerCase().trim();
  const date = params.date.trim();

  if (params.council && params.council.length > 0) {
    const councilHash = hashCouncil(params.council);
    return `horoscope:personalized:${sign}:${date}:${councilHash}`;
  }

  return `horoscope:daily:${sign}:${date}:${philosopher}`;
}

// ─── v2 cache key (current architecture) ────────────────────────────────

export interface CacheKeyV2Params {
  sign: string;
  date: string;
  /** User council; empty array or undefined uses the "default" key. */
  council?: string[];
}

/**
 * v2 cache key.
 *
 * One entry per (sign, council, date) containing both morning_reading and
 * evening_reading plus the quote. No philosopher in the key — the v2
 * architecture has no per-philosopher variation; the council shapes the
 * reading via deep injection, and the council hash discriminates entries.
 *
 * Format:
 *   - No council:    reading-v2:default:{sign}:{date}
 *   - With council:  reading-v2:personalized:{sign}:{date}:{councilHash}
 */
export function buildCacheKeyV2(params: CacheKeyV2Params): string {
  const sign = params.sign.toLowerCase().trim();
  const date = params.date.trim();

  if (params.council && params.council.length > 0) {
    const councilHash = hashCouncil(params.council);
    return `reading-v2:personalized:${sign}:${date}:${councilHash}`;
  }
  return `reading-v2:default:${sign}:${date}`;
}
