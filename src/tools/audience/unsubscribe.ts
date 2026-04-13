/**
 * audience:unsubscribe — Atomic tool
 *
 * Removes a subscriber from Redis. Extracted from
 * src/app/api/unsubscribe/route.ts. The API route handles HMAC token
 * verification; this tool handles the data operation only.
 *
 * Input:  UnsubscribeInput
 * Output: UnsubscribeOutput
 *
 * Never throws. Returns { success, message }.
 */

import { redis } from '@/utils/redis';

// ─── Types ──────────────────────────────────────────────────────────────

export interface UnsubscribeInput {
  /** Email address to unsubscribe */
  email: string;
}

export interface UnsubscribeOutput {
  success: boolean;
  message: string;
}

// ─── Constants ──────────────────────────────────────────────────────────

const VALID_SIGNS = new Set([
  'aries', 'taurus', 'gemini', 'cancer',
  'leo', 'virgo', 'libra', 'scorpio',
  'sagittarius', 'capricorn', 'aquarius', 'pisces',
]);

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ─── Core Logic ─────────────────────────────────────────────────────────

/**
 * audience:unsubscribe
 *
 * Remove a subscriber from Redis. Cleans up the subscriber hash,
 * the sign-specific set, and the global subscriber set.
 *
 * @param input.email - Email address to unsubscribe
 *
 * @returns { success, message }
 */
export async function unsubscribe(input: UnsubscribeInput): Promise<UnsubscribeOutput> {
  const { email } = input;

  // Validate email
  if (!email || !EMAIL_REGEX.test(email)) {
    return { success: false, message: 'Invalid email format' };
  }

  try {
    // Look up subscriber to find their sign (for set cleanup)
    const subscriberData = await redis.hgetall(`subscriber:${email}`);

    if (!subscriberData || Object.keys(subscriberData).length === 0) {
      console.log(`[audience:unsubscribe] Not found: ${email}`);
      return { success: true, message: 'Email was not subscribed' };
    }

    const sign = (subscriberData as Record<string, string>).sign;

    // Remove subscriber hash
    await redis.del(`subscriber:${email}`);

    // Remove from sign-specific set
    if (sign && VALID_SIGNS.has(sign.toLowerCase())) {
      await redis.srem(`subscribers:${sign.toLowerCase()}`, email);
    }

    // Remove from global subscriber set
    await redis.srem('subscribers:all', email);

    console.log(`[audience:unsubscribe] Removed: ${email}`);

    return {
      success: true,
      message: 'Successfully unsubscribed',
    };
  } catch (err) {
    console.error('[audience:unsubscribe] Redis error:', err);
    return {
      success: false,
      message: 'Unsubscribe service temporarily unavailable',
    };
  }
}
