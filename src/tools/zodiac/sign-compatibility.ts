/**
 * zodiac:sign-compatibility — Atomic tool
 *
 * Returns element-based compatible signs for a given zodiac sign.
 * Independently useful: get compatibility data without building a full prompt.
 *
 * Input:  { sign: string, count?: number }
 * Output: { sign, compatibleSigns, element, compatibleElements }
 *
 * Rules extracted from src/utils/horoscope-prompts.ts (lines 173-178):
 * - Fire pairs with Fire + Air
 * - Earth pairs with Earth + Water
 * - Air pairs with Air + Fire
 * - Water pairs with Water + Earth
 * - Libra MUST include Aquarius; Aquarius MUST include Libra
 * - NEVER include the input sign in its own matches
 */

import {
  isValidSign,
  VALID_SIGNS,
  type ValidSign,
  getSignProfile,
} from '@/tools/zodiac/sign-profile';

type Element = 'Fire' | 'Earth' | 'Air' | 'Water';

/** Which elements each element is compatible with */
const ELEMENT_COMPATIBILITY: Record<Element, Element[]> = {
  Fire: ['Fire', 'Air'],
  Earth: ['Earth', 'Water'],
  Air: ['Air', 'Fire'],
  Water: ['Water', 'Earth'],
};

/** Forced pairings: sign MUST appear in the other's results */
const FORCED_PAIRINGS: Partial<Record<ValidSign, ValidSign>> = {
  libra: 'aquarius',
  aquarius: 'libra',
};

export interface SignCompatibilityResult {
  sign: string;
  compatibleSigns: string[];
  element: Element;
  compatibleElements: Element[];
}

/**
 * zodiac:sign-compatibility
 *
 * Get compatible signs based on element affinity.
 *
 * @param sign - The zodiac sign to find matches for
 * @param count - How many compatible signs to return (default 3, max 11)
 */
export function getSignCompatibility(
  sign: string,
  count: number = 3
): SignCompatibilityResult {
  const normalizedSign = sign.toLowerCase();
  if (!isValidSign(normalizedSign)) {
    throw new Error(
      `Unknown sign: ${sign}. Valid signs: ${VALID_SIGNS.join(', ')}`
    );
  }

  // Clamp count to valid range (1-11, since we exclude the input sign)
  const clampedCount = Math.max(1, Math.min(count, 11));

  const profile = getSignProfile(normalizedSign);
  const element = profile.element;
  const compatibleElements = ELEMENT_COMPATIBILITY[element];

  // Gather all signs from compatible elements, excluding self
  const candidates = VALID_SIGNS.filter((s) => {
    if (s === normalizedSign) return false;
    const sProfile = getSignProfile(s);
    return compatibleElements.includes(sProfile.element);
  });

  // Check for forced pairings
  const forcedSign = FORCED_PAIRINGS[normalizedSign as ValidSign];

  let result: string[];

  if (forcedSign && !candidates.includes(forcedSign)) {
    // Forced sign is not in candidates (shouldn't happen with current rules, but safety net)
    result = [forcedSign, ...candidates.slice(0, clampedCount - 1)];
  } else if (forcedSign) {
    // Ensure forced sign is included — put it first, then fill remaining slots
    const rest = candidates.filter((s) => s !== forcedSign);
    result = [forcedSign, ...rest.slice(0, clampedCount - 1)];
  } else {
    result = candidates.slice(0, clampedCount);
  }

  return {
    sign: normalizedSign,
    compatibleSigns: result,
    element,
    compatibleElements,
  };
}

/**
 * zodiac:element-group
 *
 * List all signs in a given element group.
 */
export function getElementGroup(element: string): ValidSign[] {
  const normalized =
    (element.charAt(0).toUpperCase() + element.slice(1).toLowerCase()) as Element;
  if (!ELEMENT_COMPATIBILITY[normalized]) {
    throw new Error(
      `Unknown element: ${element}. Valid elements: Fire, Earth, Air, Water`
    );
  }
  return VALID_SIGNS.filter((s) => getSignProfile(s).element === normalized);
}
