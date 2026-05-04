/**
 * zodiac:best-match — Deterministic compatibility list per sign.
 *
 * Pulled out of reading:generate (v1) where it was an LLM output field.
 * Under v2 the reading is anonymous and best_match is sign-only data
 * with no model dependence — pure compute, no tokens, no flake.
 *
 * Rules: Fire (aries/leo/sagittarius) pairs with Fire + Air. Earth pairs
 * with Earth + Water. Air pairs with Air + Fire. Water pairs with Water +
 * Earth. Two locked exceptions: libra-aquarius and aquarius-libra always
 * include each other (carried over from the v1 prompt rule).
 */

import { isValidSign, type ValidSign } from '@/tools/zodiac/sign-profile';

const ELEMENT_BEST_MATCHES: Record<ValidSign, string> = {
  aries: 'leo, sagittarius, gemini',
  leo: 'aries, sagittarius, gemini',
  sagittarius: 'aries, leo, libra',
  taurus: 'virgo, capricorn, cancer',
  virgo: 'taurus, capricorn, scorpio',
  capricorn: 'taurus, virgo, pisces',
  gemini: 'libra, aquarius, leo',
  libra: 'gemini, aquarius, sagittarius',
  aquarius: 'gemini, libra, aries',
  cancer: 'scorpio, pisces, taurus',
  scorpio: 'cancer, pisces, virgo',
  pisces: 'cancer, scorpio, capricorn',
};

/**
 * Compute the canonical best-match list for a sign.
 * Returns a comma-separated lowercase string (matches the legacy API shape).
 */
export function getBestMatch(sign: string): string {
  const normalized = sign.toLowerCase();
  if (!isValidSign(normalized)) {
    throw new Error(`zodiac:best-match — invalid sign: "${sign}"`);
  }
  return ELEMENT_BEST_MATCHES[normalized];
}
