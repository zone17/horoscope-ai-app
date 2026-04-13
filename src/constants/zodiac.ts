/**
 * Thin re-export layer — canonical data lives in @/tools/zodiac/sign-profile.
 * Backwards-compatible: all original exports preserved.
 */

export {
  VALID_SIGNS,
  type ValidSign,
  isValidSign,
} from '@/tools/zodiac/sign-profile';

import { VALID_SIGNS, type ValidSign, getSignProfile } from '@/tools/zodiac/sign-profile';

/**
 * Legacy SIGN_META built from the atomic tool's data.
 */
export const SIGN_META: Record<ValidSign, { symbol: string; dateRange: string; element: string }> =
  Object.fromEntries(
    VALID_SIGNS.map((sign) => {
      const p = getSignProfile(sign);
      return [sign, { symbol: p.symbol, dateRange: p.dateRange, element: p.element }];
    })
  ) as Record<ValidSign, { symbol: string; dateRange: string; element: string }>;
