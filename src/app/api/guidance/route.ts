import { NextRequest, NextResponse } from 'next/server';
import { isValidSign } from '@/constants/zodiac';
import { generateHoroscope, getTodayDate } from '@/utils/horoscope-generator';

export const dynamic = 'force-dynamic';

// In-memory IP rate limiter (10 req/min)

const rateLimit = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimit.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimit.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  entry.count += 1;
  return entry.count > RATE_LIMIT_MAX;
}

// Periodic cleanup to prevent memory leak (every 5 min)
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimit) {
    if (now > entry.resetAt) rateLimit.delete(ip);
  }
}, 5 * 60_000);

// CORS preflight

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

// GET /api/guidance

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sign = searchParams.get('sign')?.toLowerCase() || '';
  const philosophersParam = searchParams.get('philosophers') || '';

  // Validate sign
  if (!sign || !isValidSign(sign)) {
    return NextResponse.json(
      { error: 'Invalid or missing sign. Must be a valid zodiac sign.' },
      { status: 400 }
    );
  }

  // Rate limit by IP
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Max 10 requests per minute.' },
      {
        status: 429,
        headers: { 'Retry-After': '60' },
      }
    );
  }

  // Parse philosopher list
  const philosophers = philosophersParam
    ? philosophersParam.split(',').map(p => p.trim()).filter(Boolean)
    : undefined;

  try {
    const horoscope = await generateHoroscope(sign, 'daily', { philosophers });

    // Extract first 2 sentences for the short field
    const message = horoscope.message || '';
    const sentences = message.match(/[^.!?]+[.!?]+/g) || [message];
    const short = sentences.slice(0, 2).join('').trim();

    return NextResponse.json({
      sign: horoscope.sign,
      reading: horoscope.message,
      short,
      quote: horoscope.inspirational_quote,
      philosopher: horoscope.quote_author,
      date: horoscope.date || getTodayDate(),
      peaceful_thought: horoscope.peaceful_thought,
    });
  } catch (error) {
    console.error('[guidance] Generation failed:', error);

    return NextResponse.json(
      { error: 'Service temporarily unavailable. Please try again later.' },
      {
        status: 503,
        headers: { 'Retry-After': '30' },
      }
    );
  }
}
