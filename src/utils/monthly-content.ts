/**
 * Monthly horoscope content utilities.
 * Provides month metadata, prompt additions, and slug validation for monthly pages.
 */

export interface MonthMeta {
  /** Human-readable month name, e.g. "April" */
  name: string;
  /** Full display string, e.g. "April 2026" */
  display: string;
  /** ISO year number */
  year: number;
  /** 1-based month number */
  month: number;
  /** ISO date string for the first day of the month, used as datePublished */
  firstDay: string;
  /** ISO date string for the last day of the month */
  lastDay: string;
}

/**
 * The supported monthly slug values and their metadata.
 * Add new months here when expanding the programme.
 */
export const VALID_MONTH_SLUGS: Record<string, MonthMeta> = {
  'april-2026': {
    name: 'April',
    display: 'April 2026',
    year: 2026,
    month: 4,
    firstDay: '2026-04-01',
    lastDay: '2026-04-30',
  },
  'may-2026': {
    name: 'May',
    display: 'May 2026',
    year: 2026,
    month: 5,
    firstDay: '2026-05-01',
    lastDay: '2026-05-31',
  },
};

/**
 * Returns true if the slug is a currently supported month-year value.
 */
export function isValidMonthSlug(slug: string): boolean {
  return Object.prototype.hasOwnProperty.call(VALID_MONTH_SLUGS, slug);
}

/**
 * Returns month metadata for a given slug, or null if invalid.
 */
export function getMonthMeta(slug: string): MonthMeta | null {
  return VALID_MONTH_SLUGS[slug] ?? null;
}

/**
 * Returns all valid month slugs as an array, in chronological order.
 */
export function getValidMonthSlugs(): string[] {
  return Object.keys(VALID_MONTH_SLUGS);
}

/**
 * Builds the monthly-specific prompt addition to inject into the horoscope
 * generation pipeline. This is appended to the standard prompt to request
 * 300-500 word monthly content instead of the default 40-80 word daily content.
 */
export function buildMonthlyPromptAddition(sign: string, monthMeta: MonthMeta): string {
  const capitalizedSign = sign.charAt(0).toUpperCase() + sign.slice(1);

  return `

## MONTHLY HOROSCOPE OVERRIDE

This is a MONTHLY horoscope for ${capitalizedSign} for ${monthMeta.display}, NOT a daily reading.

Expand the "message" field to 300-500 words. Structure it as follows:
1. **Opening theme** (1 paragraph): The overarching philosophical theme for ${capitalizedSign} in ${monthMeta.name}. What question or tension defines this month?
2. **Challenges** (1-2 paragraphs): The genuine difficulties ${capitalizedSign} will face this month and how philosophical wisdom addresses them — without minimizing or sugarcoating.
3. **Growth opportunities** (1-2 paragraphs): Where the month's energy can be channeled for growth. Be specific, not generic.
4. **Closing reflection** (1 paragraph): A grounding thought or practice to carry through ${monthMeta.name}.

Maintain the same voice, philosophical lens, and formatting approach as described above. Use the same verified quote from the philosopher assigned. The content should feel like a thoughtful monthly letter, not a list of predictions.

Keep "best_match", "inspirational_quote", "quote_author", and "peaceful_thought" exactly as they would be for any reading.

The word count for "message" MUST be between 300 and 500 words.`;
}
