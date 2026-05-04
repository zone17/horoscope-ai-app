/**
 * quote:select — Atomic tool
 *
 * Pick today's quote for a user with a given council. Independent of
 * reading:generate per the new architecture in
 * docs/research/2026-04-29-readings-resonance.md §7. The quote is its own
 * daily artifact; it does not influence the reading and the reading does
 * not influence it. They share only the council selection signal.
 *
 * Logic:
 *   1. Pick today's quote-philosopher: deterministic rotation over the
 *      council, seeded by (dayNum + signIndex) % council.length.
 *   2. Pull a verified quote from that philosopher's bank, deterministic
 *      by date so the same (philosopher, date) returns the same quote.
 *   3. Return text and philosopher.
 *
 * Falls back to the global default rotation when council is empty.
 *
 * Input:  SelectQuoteInput
 * Output: SelectQuoteOutput
 */

import { VERIFIED_QUOTES } from '@/utils/verified-quotes';
import { VALID_SIGNS, isValidSign } from '@/tools/zodiac/sign-profile';

// ─── Types ──────────────────────────────────────────────────────────────

export interface SelectQuoteInput {
  /** User's selected council (philosopher display names, e.g. "Marcus Aurelius") */
  council?: string[];
  /** Date in YYYY-MM-DD format. Defaults to today (UTC). */
  date?: string;
  /** Zodiac sign (case-insensitive). Used in the rotation seed. */
  sign: string;
}

export interface SelectQuoteOutput {
  /** Verified quote text */
  text: string;
  /** Display name of the attributed philosopher */
  quote_philosopher: string;
  /** Quote source (book, chapter, year). Useful for citation surfaces. */
  source: string;
}

// ─── Default rotation (used when council is empty) ──────────────────────

/**
 * Default rotation when no council is provided. Mirrors the rotation used
 * by philosopher:assign-daily; users without a selected council still see
 * variety across days.
 */
const DEFAULT_ROTATION: string[] = [
  'Alan Watts',
  'Marcus Aurelius',
  'Lao Tzu',
  'Seneca',
  'Pema Chödrön',
  'Ralph Waldo Emerson',
  'Rumi',
  'Carl Jung',
  'Friedrich Nietzsche',
  'Confucius',
  'Mary Oliver',
  'Albert Einstein',
];

// ─── Helpers ────────────────────────────────────────────────────────────

/**
 * Strip combining diacritical marks for a Unicode-normalized comparison.
 * Without this, "Pema Chödrön" (deep-briefs canonical) does not match
 * "Pema Chodron" (verified-quotes key), and the council member is silently
 * skipped via the no-quotes-fallback path. This bug skewed default-council
 * quote distribution to 8/12 Naval before it was caught.
 */
function normalizeForComparison(s: string): string {
  // Combining diacritical marks block: U+0300..U+036F. Explicit char-range
  // works under ES5 target where the \p{Diacritic} Unicode-property flag
  // is unavailable.
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

/**
 * Resolve a council member name to its canonical key in VERIFIED_QUOTES.
 * Tries exact match first, then Unicode-normalized comparison (handles the
 * Pema Chödrön / Pema Chodron mismatch and any future diacritic drift).
 * Returns undefined if no quotes exist for this philosopher (council member
 * with no bank coverage falls through to the next in rotation).
 */
function resolveQuoteBankKey(name: string): string | undefined {
  if (VERIFIED_QUOTES[name]) return name;
  const target = normalizeForComparison(name);
  return Object.keys(VERIFIED_QUOTES).find(k => normalizeForComparison(k) === target);
}

function dayNumber(date: Date): number {
  return Math.floor(date.getTime() / 86400000);
}

function signIndex(sign: string): number {
  const idx = VALID_SIGNS.indexOf(sign as typeof VALID_SIGNS[number]);
  return idx === -1 ? 0 : idx;
}

// ─── Public API ─────────────────────────────────────────────────────────

/**
 * Pick today's quote for the given (council, date, sign).
 *
 * Deterministic: same inputs always yield same output.
 *
 * Council members without verified-quote coverage are skipped via rotation
 * advance so the user still gets a quote from someone in their council
 * (or from the default rotation if their entire council is uncovered).
 */
export function selectQuote(input: SelectQuoteInput): SelectQuoteOutput {
  const normalizedSign = input.sign.toLowerCase();
  if (!isValidSign(normalizedSign)) {
    throw new Error(`Invalid sign: ${input.sign}`);
  }

  const resolvedDate = input.date ?? new Date().toISOString().split('T')[0];
  const date = new Date(`${resolvedDate}T12:00:00Z`);
  const dayNum = dayNumber(date);
  const sIdx = signIndex(normalizedSign);

  const candidatePool: string[] =
    input.council && input.council.length > 0 ? input.council : DEFAULT_ROTATION;

  // Walk the rotation forward until we find a council member with verified
  // quote coverage. Bounded by pool length so we always terminate.
  let chosenName: string | undefined;
  let chosenKey: string | undefined;
  for (let offset = 0; offset < candidatePool.length; offset++) {
    const idx = (dayNum + sIdx + offset) % candidatePool.length;
    const candidate = candidatePool[idx];
    const key = resolveQuoteBankKey(candidate);
    if (key) {
      chosenName = candidate;
      chosenKey = key;
      break;
    }
  }

  // If the entire council has no quote coverage, fall through to the global
  // default rotation. This keeps the quote surface from ever being empty.
  if (!chosenKey) {
    for (let offset = 0; offset < DEFAULT_ROTATION.length; offset++) {
      const idx = (dayNum + sIdx + offset) % DEFAULT_ROTATION.length;
      const candidate = DEFAULT_ROTATION[idx];
      const key = resolveQuoteBankKey(candidate);
      if (key) {
        chosenName = candidate;
        chosenKey = key;
        break;
      }
    }
  }

  if (!chosenKey || !chosenName) {
    // Should be unreachable: the default rotation contains philosophers
    // with verified coverage. Throw rather than silently return empty
    // because the failure mode is a setup bug, not a runtime condition.
    throw new Error('quote:select — no philosopher in council or default rotation has verified quotes. Check VERIFIED_QUOTES coverage.');
  }

  const quotes = VERIFIED_QUOTES[chosenKey];
  // Deterministic per (philosopher, date) quote pick within their bank.
  const pickIdx = dayNum % quotes.length;
  const quote = quotes[pickIdx];

  return {
    text: quote.text,
    quote_philosopher: chosenName,
    source: quote.source,
  };
}
