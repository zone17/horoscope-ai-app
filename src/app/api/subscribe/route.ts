import { NextRequest, NextResponse } from 'next/server';

const VALID_SIGNS = [
  'aries', 'taurus', 'gemini', 'cancer',
  'leo', 'virgo', 'libra', 'scorpio',
  'sagittarius', 'capricorn', 'aquarius', 'pisces',
];

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

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
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
