import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/utils/redis';
import { applyCorsHeaders } from '@/utils/cors-service';
import { horoscopeKeys } from '@/utils/cache-keys';

// Valid zodiac signs
const VALID_SIGNS = [
  'aries', 'taurus', 'gemini', 'cancer', 
  'leo', 'virgo', 'libra', 'scorpio', 
  'sagittarius', 'capricorn', 'aquarius', 'pisces'
];

// Set route to be dynamic to prevent caching at edge level
export const dynamic = 'force-dynamic';

/**
 * API endpoint to debug Redis cache data
 */
export async function GET(request: NextRequest) {
  try {
    // Get the origin for CORS
    const origin = request.headers.get('origin');
    console.log(`DEBUG-REDIS: Request origin: ${origin}`);
    
    // Get today's date for key generation
    const today = new Date().toISOString().split('T')[0];
    console.log(`DEBUG-REDIS: Using date: ${today}`);
    
    // Check Redis connection
    const redisInfo = {
      url: process.env.UPSTASH_REDIS_REST_URL ? 'Configured' : 'Missing',
      token: process.env.UPSTASH_REDIS_REST_TOKEN ? 'Configured' : 'Missing'
    };
    console.log('DEBUG-REDIS: Redis connection info:', redisInfo);
    
    // Check each sign in Redis
    const redisResults = {};
    const redisErrors = [];
    
    for (const sign of VALID_SIGNS) {
      try {
        // Generate the cache key
        const cacheKey = horoscopeKeys.daily(sign, today);
        console.log(`DEBUG-REDIS: Checking key: ${cacheKey}`);
        
        // Check if key exists in Redis
        const exists = await redis.exists(cacheKey);
        console.log(`DEBUG-REDIS: Key ${cacheKey} exists: ${exists === 1}`);
        
        // Get data if exists
        if (exists === 1) {
          const rawData = await redis.get(cacheKey);
          console.log(`DEBUG-REDIS: Got raw data type: ${typeof rawData}`);
          
          // Try to parse if it's a string
          let parsedData = null;
          if (typeof rawData === 'string') {
            try {
              parsedData = JSON.parse(rawData);
              console.log(`DEBUG-REDIS: Successfully parsed JSON for ${sign}`);
            } catch (parseError) {
              console.error(`DEBUG-REDIS: Error parsing JSON for ${sign}:`, parseError);
              redisErrors.push({sign, error: 'JSON parse error', raw: typeof rawData});
            }
          }
          
          redisResults[sign] = {
            exists: true,
            dataType: typeof rawData,
            hasData: Boolean(parsedData),
            keys: parsedData ? Object.keys(parsedData) : [],
            // Include a preview of the data
            preview: parsedData ? {
              message: parsedData.message ? parsedData.message.substring(0, 50) + '...' : null,
              lucky_number: parsedData.lucky_number,
              lucky_color: parsedData.lucky_color,
              peaceful_thought: parsedData.peaceful_thought ? parsedData.peaceful_thought.substring(0, 50) + '...' : null,
            } : null
          };
        } else {
          redisResults[sign] = { exists: false };
        }
      } catch (error) {
        console.error(`DEBUG-REDIS: Error checking Redis for ${sign}:`, error);
        redisErrors.push({sign, error: error instanceof Error ? error.message : 'Unknown error'});
        redisResults[sign] = { exists: false, error: true };
      }
    }
    
    // Create a response object with all debug information
    const debugResponse = NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      redis: {
        connection: redisInfo,
        date: today,
        results: redisResults,
        errors: redisErrors
      },
      environment: {
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'Not set',
        NODE_ENV: process.env.NODE_ENV
      }
    });
    
    // Apply CORS headers and return
    return origin ? applyCorsHeaders(debugResponse, origin) : debugResponse;
  } catch (error) {
    console.error('DEBUG-REDIS: Unexpected error:', error);
    
    // Get the origin for CORS
    const origin = request.headers.get('origin');
    
    // Create error response
    const errorResponse = NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
      timestamp: new Date().toISOString()
    }, { status: 500 });
    
    // Apply CORS headers and return
    return origin ? applyCorsHeaders(errorResponse, origin) : errorResponse;
  }
} 