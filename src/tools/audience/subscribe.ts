/**
 * audience:subscribe — Atomic tool
 *
 * Subscribes an email to daily horoscope delivery, optionally associated
 * with a zodiac sign. Extracted from src/app/api/subscribe/route.ts with
 * the addition of in-memory rate limiting (P0 #5).
 *
 * Input:  SubscribeInput
 * Output: SubscribeOutput
 *
 * Never throws. Returns { success, message, alreadySubscribed? }.
 */

import { redis } from '@/utils/redis';
import { isValidSign } from '@/tools/zodiac/sign-profile';

// ─── Types ──────────────────────────────────────────────────────────────

export interface SubscribeInput {
  /** Subscriber email address */
  email: string;
  /** Optional zodiac sign to associate */
  sign?: string;
  /** Caller IP for rate limiting (injected by API route) */
  ip?: string;
}

export interface SubscribeOutput {
  success: boolean;
  message: string;
  alreadySubscribed?: boolean;
  rateLimited?: boolean;
}

// ─── Constants ──────────────────────────────────────────────────────────

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ─── Rate Limiting ──────────────────────────────────────────────────────

/** Max subscribe attempts per IP within the window */
const RATE_LIMIT_MAX = 5;
/** Rate limit window TTL in seconds (15 minutes) */
const RATE_LIMIT_WINDOW_SEC = 15 * 60;

/**
 * Check and increment rate limit for an IP using Redis INCR + EXPIRE.
 * Returns true if the request is allowed, false if rate-limited.
 * If Redis is unavailable, allows the request through (fail-open).
 */
async function checkRateLimit(ip: string): Promise<boolean> {
  try {
    const key = `ratelimit:subscribe:${ip}`;
    const count = await redis.incr(key);

    // Set TTL only on first request in the window (count === 1)
    if (count === 1) {
      await redis.expire(key, RATE_LIMIT_WINDOW_SEC);
    }

    return count <= RATE_LIMIT_MAX;
  } catch (err) {
    // Redis unavailable — fail open so subscribers aren't blocked
    console.warn('[audience:subscribe] Rate limit check failed, allowing request:', err);
    return true;
  }
}

// ─── Core Logic ─────────────────────────────────────────────────────────

/**
 * audience:subscribe
 *
 * Subscribe an email to daily horoscope delivery. Validates email format,
 * checks rate limits, detects duplicates, and stores in Redis.
 *
 * @param input.email - Email address to subscribe
 * @param input.sign  - Optional zodiac sign
 * @param input.ip    - Caller IP for rate limiting
 *
 * @returns { success, message, alreadySubscribed?, rateLimited? }
 */
export async function subscribe(input: SubscribeInput): Promise<SubscribeOutput> {
  const { email, sign, ip } = input;

  // Validate email
  if (!email || !EMAIL_REGEX.test(email)) {
    return { success: false, message: 'Invalid email format' };
  }

  // Validate sign if provided
  if (sign && !isValidSign(sign)) {
    return { success: false, message: 'Invalid zodiac sign' };
  }

  // Rate limiting (P0 #5)
  if (ip) {
    if (!(await checkRateLimit(ip))) {
      console.warn(`[audience:subscribe] Rate limited IP: ${ip}`);
      return {
        success: false,
        message: 'Too many subscribe attempts. Please try again later.',
        rateLimited: true,
      };
    }
  }

  const normalizedSign = sign?.toLowerCase();

  try {
    // Check if already subscribed
    const existing = await redis.hgetall(`subscriber:${email}`);
    if (existing && Object.keys(existing).length > 0) {
      console.log(`[audience:subscribe] Already subscribed: ${email}`);
      return {
        success: true,
        message: 'Email is already subscribed',
        alreadySubscribed: true,
      };
    }

    // Store subscriber hash
    const subscriberData: Record<string, string> = {
      subscribedAt: new Date().toISOString(),
    };
    if (normalizedSign) {
      subscriberData.sign = normalizedSign;
    }

    await redis.hset(`subscriber:${email}`, subscriberData);

    // Add to sign-specific set for batch sending / segmentation
    if (normalizedSign) {
      await redis.sadd(`subscribers:${normalizedSign}`, email);
    }

    // Also add to the global subscriber set for full-list queries
    await redis.sadd('subscribers:all', email);

    console.log(
      `[audience:subscribe] Subscribed: ${email}` +
        (normalizedSign ? ` (${normalizedSign})` : '')
    );

    return { success: true, message: 'Successfully subscribed' };
  } catch (err) {
    console.error('[audience:subscribe] Redis error:', err);
    // Degrade gracefully — acknowledge the intent even if storage fails
    return {
      success: false,
      message: 'Subscription service temporarily unavailable',
    };
  }
}
