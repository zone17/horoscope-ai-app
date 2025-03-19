import { NextRequest, NextResponse } from 'next/server';
import { safelyRetrieveForUI } from '@/utils/redis-helpers';
import { horoscopeKeys } from '@/utils/cache-keys';
import { redis } from '@/utils/redis';

// Set route to be dynamic to prevent caching at edge level
export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    // Get sign parameter
    const { searchParams } = new URL(request.url);
    const sign = searchParams.get('sign')?.toLowerCase() || 'aries';
    const rawData = searchParams.get('raw') === 'true';
    
    // Get today's date
    const date = new Date().toISOString().split('T')[0];
    
    // Generate the cache key
    const cacheKey = horoscopeKeys.daily(sign, date);
    
    // Get direct Redis data (without helper)
    const directRedisData = await redis.get(cacheKey);

    // Get data using helper
    const helperRedisData = await safelyRetrieveForUI(cacheKey);
    
    // Return the data details
    return NextResponse.json({
      success: true,
      metadata: {
        sign,
        date,
        cacheKey,
        rawDataRequested: rawData,
        directDataType: typeof directRedisData,
        helperDataType: typeof helperRedisData,
        directDataExists: directRedisData !== null,
        helperDataExists: helperRedisData !== null
      },
      helper: {
        data: helperRedisData,
        stringified: helperRedisData ? JSON.stringify(helperRedisData) : null
      },
      direct: rawData ? directRedisData : (
        typeof directRedisData === 'string' 
          ? directRedisData.substring(0, 500) + '...' 
          : directRedisData
      )
    });
  } catch (error) {
    console.error('Redis debug error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'An error occurred accessing Redis'
      },
      { status: 500 }
    );
  }
} 