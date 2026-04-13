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

const VALID_SIGNS = new Set([
  'aries', 'taurus', 'gemini', 'cancer',
  'leo', 'virgo', 'libra', 'scorpio',
  'sagittarius', 'capricorn', 'aquarius', 'pisces',
]);

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ─── Rate Limiting ──────────────────────────────────────────────────────

/** Max subscribe attempts per IP within the window */
const RATE_LIMIT_MAX = 5;
/** Rate limit window in milliseconds (15 minutes) */
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

/**
 * In-memory rate limiter keyed by IP address.
 * Resets per-IP after the 15-minute window expires.
 */
const rateLimitMap = new Map<string, RateLimitEntry>();

/**
 * Check and increment rate limit for an IP.
 * Returns true if the request is allowed, false if rate-limited.
 */
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    // New window
    rateLimitMap.set(ip, { count: 1, windowStart: now });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }

  entry.count += 1;
  return true;
}

/**
 * Periodically clean up stale rate limit entries to prevent memory leaks.
 * Runs every 15 minutes, removing entries older than the window.
 */
let cleanupScheduled = false;
function scheduleCleanup(): void {
  if (cleanupScheduled) return;
  cleanupScheduled = true;

  setInterval(() => {
    const now = Date.now();
    const entries = Array.from(rateLimitMap.entries());
    for (const [key, entry] of entries) {
      if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
        rateLimitMap.delete(key);
      }
    }
  }, RATE_LIMIT_WINDOW_MS).unref();
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
  if (sign && !VALID_SIGNS.has(sign.toLowerCase())) {
    return { success: false, message: 'Invalid zodiac sign' };
  }

  // Rate limiting (P0 #5)
  if (ip) {
    scheduleCleanup();
    if (!checkRateLimit(ip)) {
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
