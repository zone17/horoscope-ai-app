/**
 * Video rendering helpers — maps zodiac signs to element colors and transforms
 * HoroscopeData into Remotion HoroscopeVideoProps.
 */

import { SIGN_META, VALID_SIGNS, type ValidSign, isValidSign } from '@/constants/zodiac';
import type { HoroscopeData } from '@/utils/horoscope-generator';

/** Element-to-hex color map matching the site's design system */
export const ELEMENT_COLORS: Record<string, string> = {
  Fire: '#F97316',
  Earth: '#84CC16',
  Air: '#38BDF8',
  Water: '#A78BFA',
};

const FALLBACK_COLOR = '#A78BFA';

/**
 * Returns the hex color for a sign's element.
 * Falls back to Water purple if sign is unknown.
 */
export function getSignElementColor(sign: string): string {
  const normalized = sign.toLowerCase();
  if (!isValidSign(normalized)) return FALLBACK_COLOR;
  const element = SIGN_META[normalized].element;
  return ELEMENT_COLORS[element] ?? FALLBACK_COLOR;
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
    elementColor: getSignElementColor(normalized),
    symbol: meta?.symbol ?? '✦',
  };
}
