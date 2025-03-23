import { NextRequest, NextResponse } from 'next/server';
import { redis, CACHE_DURATIONS } from '@/utils/redis';
import { horoscopeKeys } from '@/utils/cache-keys';
import { safelyStoreInRedis } from '@/utils/redis-helpers';
import fetch from 'node-fetch';

// Valid zodiac signs
const VALID_SIGNS = [
  'aries', 'taurus', 'gemini', 'cancer', 
  'leo', 'virgo', 'libra', 'scorpio', 
  'sagittarius', 'capricorn', 'aquarius', 'pisces'
];

// Helper to get today's date in YYYY-MM-DD format
const getTodayDate = () => new Date().toISOString().split('T')[0];

/**
 * Force refresh endpoint to regenerate all horoscopes and fix any caching issues
 */
export async function GET(request: NextRequest) {
  try {
    // Get environment variables for base URL
    const apiUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    
    console.log(`Using API base URL: ${apiUrl}`);
    
    // Call the regenerate endpoint
    const response = await fetch(`${apiUrl}/api/debug/regenerate-horoscopes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error(`Error from regenerate endpoint: ${error}`);
      return NextResponse.json({
        success: false,
        error: `Regeneration API failed: ${response.status}`,
        date: getTodayDate(),
      }, { status: 500 });
    }
    
    const data = await response.json();
    
    // For each sign, verify the cache has the correct data
    const verificationResults = [];
    
    for (const sign of VALID_SIGNS) {
      const date = getTodayDate();
      const cacheKey = horoscopeKeys.daily(sign, date);
      
      // Get the cached data
      const cachedData = await redis.get(`horoscope-prod:${cacheKey}`);
      
      if (!cachedData) {
        verificationResults.push({
          sign,
          cached: false,
          error: 'No data in cache after regeneration'
        });
        continue;
      }
      
      try {
        // Parse the cached data
        const horoscope = JSON.parse(cachedData);
        
        // Verify critical fields
        const hasBestMatch = Boolean(horoscope.best_match);
        const hasQuote = Boolean(horoscope.inspirational_quote);
        
        verificationResults.push({
          sign,
          cached: true,
          hasBestMatch,
          hasQuote,
          bestMatch: horoscope.best_match,
          quote: horoscope.inspirational_quote ? 
            `${horoscope.inspirational_quote.substring(0, 20)}...` : null
        });
      } catch (error) {
        verificationResults.push({
          sign,
          cached: true,
          error: 'Failed to parse cached data'
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Successfully refreshed all horoscopes',
      date: getTodayDate(),
      regenerationResults: data,
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