/**
 * reading:quote-bank — Atomic tool
 *
 * Access verified, source-attributed philosopher quotes.
 * Independently useful: get quotes for any philosopher without generating a reading.
 *
 * Input:  { philosopher: string, count?: number }
 * Output: { quotes: VerifiedQuote[] }
 *
 * Re-exports the existing VERIFIED_QUOTES data but provides
 * a clean tool interface with validation.
 */

// Re-export the data type
export { type VerifiedQuote } from '@/utils/verified-quotes';

// Import the existing data (will be moved here fully in Phase 3)
import { VERIFIED_QUOTES, type VerifiedQuote } from '@/utils/verified-quotes';
import { lookupPhilosopher } from '@/tools/philosopher/registry';

/**
 * reading:quote-bank
 *
 * Get verified quotes for a philosopher.
 * Returns quotes shuffled by date seed for daily variety.
 */
export function getQuotes(
  philosopher: string,
  options?: { count?: number; dateSeed?: string }
): VerifiedQuote[] {
  const count = options?.count ?? 4;

  // Try exact match first, then case-insensitive
  let quotes: VerifiedQuote[] | undefined = VERIFIED_QUOTES[philosopher];
  if (!quotes) {
    const key = Object.keys(VERIFIED_QUOTES).find(
      (k) => k.toLowerCase() === philosopher.toLowerCase()
    );
    quotes = key ? VERIFIED_QUOTES[key] : undefined;
  }

  if (!quotes || quotes.length === 0) {
    return [];
  }

  // Shuffle deterministically by date for daily variety
  const seed = options?.dateSeed ?? new Date().toISOString().split('T')[0];
  const dayNum = Math.floor(new Date(seed).getTime() / (1000 * 60 * 60 * 24));
  const shuffled = [...quotes].sort((a, b) => {
    const ha = hashString(a.text + dayNum) % 1000;
    const hb = hashString(b.text + dayNum) % 1000;
    return ha - hb;
  });

  return shuffled.slice(0, count);
}

/**
 * Check if a philosopher has verified quotes available.
 */
export function hasVerifiedQuotes(philosopher: string): boolean {
  return getQuotes(philosopher, { count: 1 }).length > 0;
}

/**
 * Get all philosophers that have verified quotes.
 */
export function getPhilosophersWithQuotes(): string[] {
  return Object.keys(VERIFIED_QUOTES).filter(
    (name) => VERIFIED_QUOTES[name].length > 0
  );
}

// Simple deterministic hash for shuffling
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}
