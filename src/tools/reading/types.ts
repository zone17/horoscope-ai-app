/**
 * reading:types — Shared types for horoscope reading data
 *
 * Two shapes exist for the same data:
 * - ReadingOutput (camelCase) — tool output, used internally
 * - HoroscopeData (snake_case) — API response, used by frontend and legacy consumers
 */

/** Tool-internal camelCase shape */
export interface ReadingOutput {
  sign: string;
  date: string;
  philosopher: string;
  message: string;
  bestMatch: string;
  inspirationalQuote: string;
  quoteAuthor: string;
  peacefulThought: string;
}

/** API/frontend snake_case shape */
export interface HoroscopeData {
  sign: string;
  type: string;
  date: string;
  message: string;
  best_match: string;
  inspirational_quote: string;
  quote_author: string;
  peaceful_thought: string;
  [key: string]: unknown;
}
