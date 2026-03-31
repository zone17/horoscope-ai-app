import { NextRequest, NextResponse } from 'next/server';
import { getCachedData } from '@/utils/cache';
import { isFeatureEnabled, FEATURE_FLAGS } from '@/utils/feature-flags';
import { CACHE_DURATIONS } from '@/utils/redis';
import { horoscopeKeys } from '@/utils/cache-keys';
import { getLocalDateForTimezone, getSafeTimezone } from '@/utils/timezone-utils';
import { safelyStoreInRedis } from '@/utils/redis-helpers';
import { generateHoroscope, VALID_SIGNS, VALID_TYPES, getTodayDate } from '@/utils/horoscope-generator';

// Set route to be dynamic to prevent caching at edge level
export const dynamic = 'force-dynamic';

/**
 * Batch generate horoscopes for all signs for a specific local date.
 * Uses pre-assigned philosopher rotation — no retries needed.
 */
async function batchGenerateHoroscopes(localDate: string, type: string = 'daily') {
  console.log(`Batch generating horoscopes for all signs for local date: ${localDate}`);

  const results: Record<string, Record<string, unknown>> = {};
  const errors: Record<string, string> = {};

  for (const sign of VALID_SIGNS) {
    try {
      const horoscope = await generateHoroscope(sign, type);
      const cacheKey = horoscopeKeys.timezoneDaily(sign, localDate);
      const storeSuccess = await safelyStoreInRedis(cacheKey, horoscope, {
        ttl: CACHE_DURATIONS.ONE_DAY
      });
      results[sign] = { success: storeSuccess, data: horoscope };
      console.log(`Successfully cached ${sign} horoscope for local date ${localDate}`);
    } catch (error) {
      console.error(`Error generating horoscope for ${sign}:`, error);
      errors[sign] = error instanceof Error ? error.message : 'Unknown error';
    }
  }

  return { results, errors, timestamp: new Date().toISOString() };
}

// CORS preflight is handled by middleware.ts for all /api/* routes
export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

export async function GET(request: NextRequest) {
  try {
    // Get sign and type from query parameters
    const { searchParams } = new URL(request.url);
    const sign = searchParams.get('sign')?.toLowerCase() || '';
    const type = searchParams.get('type')?.toLowerCase() || 'daily';
    
    // New parameter: timezone for timezone-aware content
    const timezone = searchParams.get('timezone') || 'UTC';
    
    // Validate sign
    if (!sign || !VALID_SIGNS.includes(sign)) {
      const errorResponse = NextResponse.json(
        { 
          success: false, 
          error: `Invalid sign. Must be one of: ${VALID_SIGNS.join(', ')}` 
        },
        { status: 400 }
      );
      
      return errorResponse;
    }

    // Validate type
    if (!VALID_TYPES.includes(type)) {
      const errorResponse = NextResponse.json(
        {
          success: false,
          error: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}`
        },
        { status: 400 }
      );

      return errorResponse;
    }
    
    // Check if timezone-aware content is enabled
    const useTimezoneContent = isFeatureEnabled(FEATURE_FLAGS.USE_TIMEZONE_CONTENT, false);
    
    // Generate appropriate cache key
    let cacheKey: string;
    let localDate: string = getTodayDate();
    
    if (useTimezoneContent && type === 'daily') {
      // Calculate user's local date based on their timezone
      localDate = getLocalDateForTimezone(getSafeTimezone(timezone));
      cacheKey = horoscopeKeys.timezoneDaily(sign, localDate);
      console.log(`Using timezone-aware cache key with timezone ${timezone} and local date ${localDate}`);
    } else {
      // Use original UTC-based cache key
      cacheKey = horoscopeKeys.daily(sign, getTodayDate());
    }
    
    // Use Redis caching if enabled
    const isCachingEnabled = isFeatureEnabled(FEATURE_FLAGS.USE_REDIS_CACHE, true);
    
    let horoscope;
    let wasCached = false;
    let generatedBatch = false;
    
    if (isCachingEnabled) {
      // Check if data exists in cache first
      const cachedData = await getCachedData(cacheKey);
      
      if (cachedData) {
        // Cache hit - return cached data
        horoscope = cachedData;
        wasCached = true;
        console.log(`Cache hit for ${sign} with local date ${localDate}`);
      } else {
        // Cache miss - need to generate content
        console.log(`Cache miss for ${sign} with local date ${localDate}`);
        
        if (useTimezoneContent && type === 'daily') {
          // Generate horoscopes for ALL signs at once for this local date
          console.log(`Generating batch horoscopes for all signs for local date ${localDate}`);
          
          const batchResult = await batchGenerateHoroscopes(localDate, type);
          generatedBatch = true;
          
          // Get the requested sign's data from the batch results
          if (batchResult.results[sign] && batchResult.results[sign].data) {
            horoscope = batchResult.results[sign].data;
            console.log(`Retrieved ${sign} data from batch generation`);
          } else {
            // Fallback: generate just this sign if batch generation failed for it
            console.log(`Batch generation failed for ${sign}, generating individually`);
            horoscope = await generateHoroscope(sign, type);
            
            // Cache the individual result
            await safelyStoreInRedis(cacheKey, horoscope, { ttl: CACHE_DURATIONS.ONE_DAY });
          }
        } else {
          // Regular non-timezone approach: generate just the requested sign
          horoscope = await generateHoroscope(sign, type);
          
          // Cache the result with the appropriate key and TTL
          const cacheTTL = type === 'daily' 
            ? CACHE_DURATIONS.ONE_DAY 
            : type === 'weekly' 
              ? CACHE_DURATIONS.ONE_WEEK 
              : CACHE_DURATIONS.ONE_WEEK;
          
          await safelyStoreInRedis(cacheKey, horoscope, { ttl: cacheTTL });
        }
      }
    } else {
      // Caching disabled, always generate fresh content
      horoscope = await generateHoroscope(sign, type);
    }
    
    // Create the success response with detailed information
    const successResponse = NextResponse.json({
      success: true,
      cached: wasCached,
      batchGenerated: generatedBatch,
      timezoneAware: useTimezoneContent,
      timezone: useTimezoneContent ? timezone : null,
      localDate: useTimezoneContent ? localDate : null,
      data: horoscope
    });
    
    return successResponse;
  } catch (error) {
    console.error('Horoscope API error:', error);

    const errorResponse = NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      },
      { status: 500 }
    );

    return errorResponse;
  }
} 