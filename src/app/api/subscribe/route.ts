import { NextRequest, NextResponse } from 'next/server';

const VALID_SIGNS = [
  'aries', 'taurus', 'gemini', 'cancer',
  'leo', 'virgo', 'libra', 'scorpio',
  'sagittarius', 'capricorn', 'aquarius', 'pisces',
];

/**
 * Domains commonly used for throwaway / disposable email. Not exhaustive
 * (the operator can extend) but catches the most-abused cases. Wave 1A QA
 * finding 2.5 noted that `*@example.com` and similar accept successfully;
 * `example.com` is RFC-reserved and cannot receive mail, so it is rejected
 * here.
 */
const DISPOSABLE_DOMAINS = new Set([
  'example.com', 'example.org', 'example.net',
  'test.com', 'test.org', 'localhost', 'invalid',
  'mailinator.com', 'tempmail.com', 'temp-mail.org', 'guerrillamail.com',
  '10minutemail.com', 'yopmail.com', 'throwawaymail.com', 'getnada.com',
  'maildrop.cc', 'sharklasers.com', 'fakemailgenerator.com',
  'mvrht.net', 'minuteinbox.com', 'tempinbox.com',
]);

const RATE_LIMIT_WINDOW_SECONDS = 60 * 60; // 1h
const RATE_LIMIT_MAX_PER_IP = 10;

/**
 * POST /api/subscribe
 *
 * Captures an email + sign for future daily-digest delivery.
 * Stores in Upstash Redis. No email sending infrastructure yet.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, sign, philosophers } = body as {
      email?: string;
      sign?: string;
      philosophers?: string[];
    };

    if (!email || !sign) {
      return NextResponse.json(
        { error: 'Email and sign are required' },
        { status: 400 }
      );
    }

    // RFC 5322-style format check (cheap pre-filter; the disposable-domain
    // check below catches the bulk of abuse-shaped submissions).
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    // Disposable / throwaway domain rejection. Wave 1A QA finding 2.5
    // observed that obvious test addresses returned {success:true}; we
    // would rather reject at the API edge than burn a Resend send on
    // an undeliverable address.
    const domain = email.toLowerCase().split('@')[1] ?? '';
    if (DISPOSABLE_DOMAINS.has(domain)) {
      return NextResponse.json(
        { error: 'That email domain looks throwaway. Please use a real address.' },
        { status: 400 }
      );
    }

    const lowerSign = sign.toLowerCase();
    if (!VALID_SIGNS.includes(lowerSign)) {
      return NextResponse.json(
        { error: 'Invalid zodiac sign' },
        { status: 400 }
      );
    }

    // Per-IP rate limit: 10 subscribes/hour. Generous enough for legitimate
    // multi-account households, tight enough to prevent the form from
    // being used as a free signup-spam vector. Soft-fails when Redis is
    // unavailable so we don't break legitimate signups during an outage.
    try {
      const { Redis } = await import('@upstash/redis');
      const redis = Redis.fromEnv();
      const ip =
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        request.headers.get('x-real-ip') ||
        'unknown';
      const rateKey = `subscribe-ratelimit:${ip}`;
      const count = await redis.incr(rateKey);
      if (count === 1) {
        await redis.expire(rateKey, RATE_LIMIT_WINDOW_SECONDS);
      }
      if (count > RATE_LIMIT_MAX_PER_IP) {
        return NextResponse.json(
          { error: 'Too many sign-ups from this network. Try again in an hour.' },
          { status: 429 }
        );
      }
    } catch {
      // Redis unavailable; allow through.
    }

    // Store in Redis if available, otherwise just acknowledge
    try {
      const { Redis } = await import('@upstash/redis');
      const redis = Redis.fromEnv();

      // Store as a hash: subscriber:{email} -> { sign, subscribedAt, philosophers }
      const subscriberData: Record<string, string> = {
        sign: lowerSign,
        subscribedAt: new Date().toISOString(),
      };

      // Store philosopher selections as JSON string (Redis hset values are strings)
      if (philosophers && Array.isArray(philosophers) && philosophers.length > 0) {
        subscriberData.philosophers = JSON.stringify(philosophers);
      }

      await redis.hset(`subscriber:${email}`, subscriberData);

      // Also add to a sign-specific set for batch sending later
      await redis.sadd(`subscribers:${lowerSign}`, email);
    } catch {
      // Redis not configured — log and still return success
      // so the UX isn't broken during development
      console.log(`[subscribe] Would store: ${email} for ${lowerSign}`);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
