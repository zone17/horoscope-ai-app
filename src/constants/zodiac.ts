/**
 * Shared zodiac sign metadata — single source of truth.
 * Import this instead of redefining VALID_SIGNS, SIGN_META, or capitalize() in page files.
 */

export const VALID_SIGNS = [
  'aries', 'taurus', 'gemini', 'cancer',
  'leo', 'virgo', 'libra', 'scorpio',
  'sagittarius', 'capricorn', 'aquarius', 'pisces',
] as const;

export type ValidSign = (typeof VALID_SIGNS)[number];

export function isValidSign(sign: string): sign is ValidSign {
  return (VALID_SIGNS as readonly string[]).includes(sign);
}

export const SIGN_META: Record<ValidSign, { symbol: string; dateRange: string; element: string }> = {
  aries:       { symbol: '\u2648', dateRange: 'Mar 21 \u2013 Apr 19', element: 'Fire' },
  taurus:      { symbol: '\u2649', dateRange: 'Apr 20 \u2013 May 20', element: 'Earth' },
  gemini:      { symbol: '\u264A', dateRange: 'May 21 \u2013 Jun 20', element: 'Air' },
  cancer:      { symbol: '\u264B', dateRange: 'Jun 21 \u2013 Jul 22', element: 'Water' },
  leo:         { symbol: '\u264C', dateRange: 'Jul 23 \u2013 Aug 22', element: 'Fire' },
  virgo:       { symbol: '\u264D', dateRange: 'Aug 23 \u2013 Sep 22', element: 'Earth' },
  libra:       { symbol: '\u264E', dateRange: 'Sep 23 \u2013 Oct 22', element: 'Air' },
  scorpio:     { symbol: '\u264F', dateRange: 'Oct 23 \u2013 Nov 21', element: 'Water' },
  sagittarius: { symbol: '\u2650', dateRange: 'Nov 22 \u2013 Dec 21', element: 'Fire' },
  capricorn:   { symbol: '\u2651', dateRange: 'Dec 22 \u2013 Jan 19', element: 'Earth' },
  aquarius:    { symbol: '\u2652', dateRange: 'Jan 20 \u2013 Feb 18', element: 'Air' },
  pisces:      { symbol: '\u2653', dateRange: 'Feb 19 \u2013 Mar 20', element: 'Water' },
};
