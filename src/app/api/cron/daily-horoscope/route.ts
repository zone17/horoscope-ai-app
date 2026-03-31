import { NextRequest, NextResponse } from 'next/server';
import { CACHE_DURATIONS } from '@/utils/redis';
import { horoscopeKeys } from '@/utils/cache-keys';
import { safelyStoreInRedis } from '@/utils/redis-helpers';
import { generateHoroscope, VALID_SIGNS, getTodayDate } from '@/utils/horoscope-generator';

/**
 * Generate and cache horoscopes for all signs using the shared generator.
 */
async function generateAllHoroscopes() {
  const date = getTodayDate();
  const results: { sign: string; success: boolean }[] = [];
  const errors: { sign: string; error: string }[] = [];

  for (const sign of VALID_SIGNS) {
    try {
      console.log(`[cron] Generating ${sign}...`);
      const horoscope = await generateHoroscope(sign, 'daily');

      const cacheKey = horoscopeKeys.daily(sign, date);
      const storeSuccess = await safelyStoreInRedis(cacheKey, horoscope, {
        ttl: CACHE_DURATIONS.ONE_DAY
      });

      results.push({ sign, success: storeSuccess });
    } catch (error) {
      console.error(`Error generating horoscope for ${sign}:`, error);
      errors.push({ sign, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  return { results, errors };
}

// CORS preflight is handled by middleware.ts for all /api/* routes
export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

/**
 * Vercel Cron handler - runs at midnight daily.
 * Requires CRON_SECRET in Authorization header for all requests.
 * The Vercel cron scheduler sends this automatically.
 */
export async function GET(request: NextRequest) {
  // Require CRON_SECRET for all requests — no origin-based bypass
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error('CRON_SECRET environment variable is not configured — denying all requests');
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${cronSecret}`) {
    console.log('Unauthorized request to generate horoscopes');
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    // Generate and cache all horoscopes
    const result = await generateAllHoroscopes();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      date: getTodayDate(),
      ...result
    });
  } catch (error) {
    console.error('Cron job error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'An error occurred during horoscope generation'
      },
      { status: 500 }
    );
  }
}
