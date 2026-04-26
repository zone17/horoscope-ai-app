/**
 * reading:types — Shared types for horoscope reading data
 *
 * Two shapes exist for the same data:
 * - ReadingOutput (camelCase) — tool output, used internally
 * - HoroscopeData (snake_case) — API response, used by frontend and legacy consumers
 *
 * `ReadingOutputModelSchema` is the runtime Zod parallel to ReadingOutput,
 * minus the fields the verb injects itself (sign, date, philosopher).
 * Used by `reading:generate` via `generateObject` to enforce structured
 * output from the model, and by the eval harness as the canonical
 * single-source-of-truth schema.
 */

import { z } from 'zod';

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

/**
 * Runtime Zod schema enforced by `generateObject` in `reading:generate`.
 *
 * Excludes the three fields the verb injects (sign, date, philosopher) —
 * the model does not produce them. All field min-lengths are intentionally
 * permissive: word-count and stylistic constraints live in the prompt,
 * not the schema. Hard schema constraints risk flaky throws on otherwise-
 * acceptable model output and degrade UX without improving quality.
 */
export const ReadingOutputModelSchema = z.object({
  message: z.string().min(1),
  bestMatch: z.string().min(1),
  inspirationalQuote: z.string().min(1),
  quoteAuthor: z.string().min(1),
  peacefulThought: z.string().min(1),
});

export type ReadingOutputModel = z.infer<typeof ReadingOutputModelSchema>;

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
