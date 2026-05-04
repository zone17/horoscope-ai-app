/**
 * reading:compose-v2 — Atomic composer for the new architecture.
 *
 * Wraps the v2 pipeline into a single call: generate morning + evening
 * readings in parallel via reading:generate-v2, select today's quote via
 * quote:select, compute deterministic best_match. Returns the full
 * ReadingV2 payload that the API serves and the cron stores.
 *
 * Independently callable: the API route, the cron route, and an eval
 * harness all use this. Keeps the route layer thin and the cron route
 * readable.
 */

import { generateReadingV2 } from '@/tools/reading/generate-v2';
import { selectQuote } from '@/tools/reading/quote-select';
import { getBestMatch } from '@/tools/zodiac/best-match';
import type { ReadingV2 } from '@/tools/reading/types';

export interface ComposeReadingV2Input {
  sign: string;
  council: string[];
  date: string;
  hemisphere?: 'north' | 'south';
}

export interface ComposeReadingV2Output {
  reading: ReadingV2;
  /** Per-surface retry counts from auto-fail filters. Useful for cron telemetry. */
  retries: { morning: number; evening: number };
}

/**
 * Compose the full v2 reading for a (sign, council, date).
 *
 * Morning and evening readings run in parallel — they share the council
 * shape synthesis cache (single Haiku call total, even for both surfaces),
 * so concurrent execution does not multiply cost. Quote select is cheap
 * (deterministic; no model call).
 */
export async function composeReadingV2(
  input: ComposeReadingV2Input,
): Promise<ComposeReadingV2Output> {
  const sign = input.sign.toLowerCase();
  const date = input.date;

  const [morning, evening] = await Promise.all([
    generateReadingV2({ sign, council: input.council, date, hemisphere: input.hemisphere, timeOfDay: 'morning' }),
    generateReadingV2({ sign, council: input.council, date, hemisphere: input.hemisphere, timeOfDay: 'evening' }),
  ]);

  const quote = selectQuote({ sign, council: input.council, date });
  const bestMatch = getBestMatch(sign);

  const reading: ReadingV2 = {
    sign,
    date,
    morning_reading: morning.text,
    evening_reading: evening.text,
    best_match: bestMatch,
    quote: {
      text: quote.text,
      quote_philosopher: quote.quote_philosopher,
      source: quote.source,
    },
  };

  return {
    reading,
    retries: { morning: morning.retries, evening: evening.retries },
  };
}
