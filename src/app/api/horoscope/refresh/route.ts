import { NextRequest, NextResponse } from 'next/server';
import { CACHE_DURATIONS } from '@/utils/redis';
import { horoscopeKeys } from '@/utils/cache-keys';
import { safelyStoreInRedis, safelyRetrieveForUI } from '@/utils/redis-helpers';
import { generateHoroscope, VALID_SIGNS, getTodayDate } from '@/utils/horoscope-generator';

/**
 * Force refresh endpoint to regenerate all horoscopes.
 * Requires CRON_SECRET for authorization.
 * Uses the shared generator directly — no HTTP self-calls, no node-fetch.
 */
export async function GET(request: NextRequest) {
  // Require CRON_SECRET
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const date = getTodayDate();

    // Generate horoscopes for all signs using the shared generator
    const generationResults: { sign: string; success: boolean; error?: string }[] = [];

    for (const sign of VALID_SIGNS) {
      try {
        const horoscope = await generateHoroscope(sign, 'daily');
        const cacheKey = horoscopeKeys.daily(sign, date);
        const storeSuccess = await safelyStoreInRedis(cacheKey, horoscope, {
          ttl: CACHE_DURATIONS.ONE_DAY
        });
        generationResults.push({ sign, success: storeSuccess });
      } catch (error) {
        generationResults.push({
          sign,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Verify each sign's cache entry using safelyRetrieveForUI (handles namespacing correctly)
    const verificationResults = [];

    for (const sign of VALID_SIGNS) {
      const cacheKey = horoscopeKeys.daily(sign, date);
      const cachedData = await safelyRetrieveForUI<Record<string, unknown>>(cacheKey);

      if (!cachedData) {
        verificationResults.push({
          sign,
          cached: false,
          error: 'No data in cache after regeneration'
        });
        continue;
      }

      verificationResults.push({
        sign,
        cached: true,
        hasBestMatch: Boolean(cachedData.best_match),
        hasQuote: Boolean(cachedData.inspirational_quote),
        bestMatch: cachedData.best_match,
        quote: cachedData.inspirational_quote
          ? String(cachedData.inspirational_quote).substring(0, 40) + '...'
          : null
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully refreshed all horoscopes',
      date,
      generationResults,
      verificationResults
    });
  } catch (error) {
    console.error('Error refreshing horoscopes:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      date: getTodayDate()
    }, { status: 500 });
  }
}
