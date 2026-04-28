/**
 * Video rendering helpers — maps zodiac signs to element colors and transforms
 * HoroscopeData into Remotion HoroscopeVideoProps.
 */

import { SIGN_META, VALID_SIGNS, type ValidSign, isValidSign } from '@/constants/zodiac';
import type { HoroscopeData } from '@/tools/reading/types';

/** Element-to-hex color map matching the site's design system */
export const ELEMENT_COLORS: Record<string, string> = {
  Fire: '#F97316',
  Earth: '#84CC16',
  Air: '#38BDF8',
  Water: '#A78BFA',
};

/**
 * Per-sign accent colors used by the video composition. Curated for short-
 * form vertical video — each sign gets ONE accent that drives active-word
 * highlight, hook underline, and CTA arrow. Everything else stays cream
 * or charcoal (single-accent discipline is what separates premium from
 * "AI slop" in this category — see docs/brainstorms/video research).
 */
export const SIGN_ACCENTS: Record<string, string> = {
  aries:       '#E85A4F', // ember red
  taurus:      '#7FA88A', // sage
  gemini:      '#F4C95D', // marigold
  cancer:      '#C8C0E2', // lavender pearl
  leo:         '#E8A33D', // amber
  virgo:       '#B8C4A1', // moss
  libra:       '#E8B5C4', // dusty rose
  scorpio:     '#8B3A4A', // garnet
  sagittarius: '#9B5DE5', // amethyst
  capricorn:   '#3D4F5C', // slate
  aquarius:    '#5DBFE8', // arctic blue
  pisces:      '#7DC9B7', // seafoam
};

const FALLBACK_COLOR = '#A78BFA';

/**
 * Returns the hex color for a sign's element (legacy — used by older paths).
 * Falls back to Water purple if sign is unknown.
 */
export function getSignElementColor(sign: string): string {
  const normalized = sign.toLowerCase();
  if (!isValidSign(normalized)) return FALLBACK_COLOR;
  const element = SIGN_META[normalized].element;
  return ELEMENT_COLORS[element] ?? FALLBACK_COLOR;
}

/**
 * Returns the per-sign accent color used in the video composition.
 * The video pipeline prefers this over element color for tighter brand
 * differentiation across the 12 daily videos.
 */
export function getSignAccentColor(sign: string): string {
  return SIGN_ACCENTS[sign.toLowerCase()] ?? FALLBACK_COLOR;
}

export interface HoroscopeVideoProps {
  sign: string;
  date: string;
  message: string;
  quote: string;
  quoteAuthor: string;
  peacefulThought: string;
  elementColor: string;
  symbol: string;
  voiceoverSrc?: string;
  ambientSrc?: string;
}

/**
 * Transforms a HoroscopeData object (from Redis) into props for the Remotion
 * HoroscopeVideo composition.
 */
export function getSignVideoProps(
  sign: string,
  data: HoroscopeData
): HoroscopeVideoProps {
  const normalized = sign.toLowerCase();
  const meta = isValidSign(normalized) ? SIGN_META[normalized] : null;

  // Format date for display: "April 8, 2026"
  let displayDate = data.date;
  try {
    const d = new Date(data.date + 'T12:00:00Z');
    displayDate = d.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC',
    });
  } catch {
    // Keep raw date string if parsing fails
  }

  return {
    sign: normalized,
    date: displayDate,
    message: data.message,
    quote: data.inspirational_quote,
    quoteAuthor: data.quote_author,
    peacefulThought: data.peaceful_thought,
    // The composition reads `elementColor` but it's now the per-sign
    // accent — single-accent-per-video discipline. Field name kept for
    // backwards compatibility with existing Remotion props shape.
    elementColor: getSignAccentColor(normalized),
    symbol: meta?.symbol ?? '✦',
  };
}
