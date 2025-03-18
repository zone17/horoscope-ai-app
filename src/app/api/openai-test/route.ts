import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { withCache } from '@/utils/cache';
import { isFeatureEnabled, FEATURE_FLAGS } from '@/utils/feature-flags';
import { CACHE_DURATIONS } from '@/utils/redis';
import { CACHE_KEY_PREFIXES, generateCacheKey } from '@/utils/cache-keys';

// Set route to be publicly accessible
export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export async function GET() {
  try {
    // Check if API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Generate a cache key
    const cacheKey = generateCacheKey(CACHE_KEY_PREFIXES.OPENAI_TEST, { 
      test: 'connection', 
      timestamp: new Date().toISOString().split('T')[0] // Cache per day
    });
    
    // Function to fetch data from OpenAI
    const fetchFromOpenAI = async () => {
      // Initialize OpenAI client
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      // Test the API key with a simple request
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Hello, this is a test.' }],
        max_tokens: 50,
      });

      return {
        success: true,
        message: 'OpenAI API key is working correctly!',
        response: response.choices[0].message,
        cached: false,
      };
    };

    // Use Redis caching if enabled, otherwise fetch directly
    const isCachingEnabled = isFeatureEnabled(FEATURE_FLAGS.USE_REDIS_CACHE, true);
    
    if (isCachingEnabled) {
      // Fetch with caching
      const result = await withCache(
        cacheKey,
        fetchFromOpenAI,
        { ttl: CACHE_DURATIONS.FIVE_MINUTES }
      );
      
      // Add cache info to the response
      return NextResponse.json({ ...result, cached: true });
    } else {
      // Fetch without caching
      const result = await fetchFromOpenAI();
      return NextResponse.json(result);
    }
  } catch (error) {
    console.error('OpenAI API error:', error);
    
    // Return error response with proper type checking
    const errorMessage = error instanceof Error ? error.message : 'An error occurred with the OpenAI API';
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage
      },
      { status: 500 }
    );
  }
} 