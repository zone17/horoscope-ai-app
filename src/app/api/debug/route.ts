import { NextRequest, NextResponse } from 'next/server';
import { safelyRetrieveForUI } from '@/utils/redis-helpers';
import { horoscopeKeys } from '@/utils/cache-keys';
import { isFeatureEnabled, FEATURE_FLAGS } from '@/utils/feature-flags';
import OpenAI from 'openai';

// Set route to be dynamic to prevent caching at edge level
export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const status = {
    redis: {
      enabled: isFeatureEnabled(FEATURE_FLAGS.USE_REDIS_CACHE, true),
      connected: false,
      cachedSigns: []
    },
    openai: {
      apiKeyConfigured: false,
      working: false,
      model: null
    },
    environment: {
      vercelUrl: process.env.VERCEL_URL || null,
      nextPublicVercelUrl: process.env.NEXT_PUBLIC_VERCEL_URL || null,
      featureFlagRedisCache: process.env.FEATURE_FLAG_USE_REDIS_CACHE || null
    }
  };

  // Check OpenAI configuration
  try {
    status.openai.apiKeyConfigured = Boolean(process.env.OPENAI_API_KEY);
    
    if (status.openai.apiKeyConfigured) {
      // Try to make a simple request to OpenAI
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      
      const response = await openai.models.list();
      status.openai.working = true;
      status.openai.model = response.data.find(m => m.id === 'gpt-3.5-turbo')?.id || 'Not found';
    }
  } catch (error) {
    console.error('OpenAI check failed:', error);
  }

  // Check Redis cache
  if (status.redis.enabled) {
    try {
      // Check for cached horoscopes for all zodiac signs
      const signs = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'];
      const date = new Date().toISOString().split('T')[0];
      
      for (const sign of signs) {
        const cacheKey = horoscopeKeys.daily(sign, date);
        const cachedData = await safelyRetrieveForUI(cacheKey);
        
        if (cachedData) {
          status.redis.connected = true;
          status.redis.cachedSigns.push(sign);
        }
      }
    } catch (error) {
      console.error('Redis check failed:', error);
    }
  }

  return NextResponse.json(status);
} 