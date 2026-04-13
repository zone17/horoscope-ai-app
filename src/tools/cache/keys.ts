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
 */
function hashCouncil(council: string[]): string {
  const normalized = [...council].map((p) => p.toLowerCase().trim()).sort();
  const digest = createHash('sha256')
    .update(normalized.join('|'))
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
