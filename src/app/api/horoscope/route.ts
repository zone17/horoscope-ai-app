import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { withCache } from '@/utils/cache';
import { isFeatureEnabled, FEATURE_FLAGS } from '@/utils/feature-flags';
import { CACHE_DURATIONS } from '@/utils/redis';
import { horoscopeKeys } from '@/utils/cache-keys';

// Set route to be dynamic to prevent caching at edge level
export const dynamic = 'force-dynamic';
export const runtime = 'edge';

// Valid zodiac signs
const VALID_SIGNS = [
  'aries', 'taurus', 'gemini', 'cancer', 
  'leo', 'virgo', 'libra', 'scorpio', 
  'sagittarius', 'capricorn', 'aquarius', 'pisces'
];

// Valid forecast types
const VALID_TYPES = ['daily', 'weekly', 'monthly'];

// Helper to get today's date in YYYY-MM-DD format
const getTodayDate = () => new Date().toISOString().split('T')[0];

/**
 * Generate a horoscope using OpenAI for the given sign and type
 */
async function generateHoroscope(sign: string, type: string) {
  // Check if API key is configured
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  // Initialize OpenAI client
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const timeframe = type === 'daily' ? 'today' : type;
  
  // Prompt for the horoscope generation
  const prompt = `Generate a ${timeframe} horoscope for ${sign}. The horoscope should be insightful, 
  positive, and include guidance on love, career, and health. Format the response in JSON with the following fields:
  - message: The main horoscope message
  - lucky_number: A lucky number for the ${timeframe}
  - lucky_color: A lucky color for the ${timeframe}
  - mood: A word describing the overall mood
  - compatibility: The most compatible sign for ${timeframe}`;

  // Generate the horoscope using OpenAI
  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    max_tokens: 500,
  });

  const content = response.choices[0].message.content;
  
  // Parse the JSON response and add metadata
  try {
    const horoscopeData = JSON.parse(content || '{}');
    
    return {
      sign,
      type,
      date: getTodayDate(),
      ...horoscopeData,
    };
  } catch (error) {
    console.error('Error parsing horoscope JSON:', error);
    throw new Error('Failed to generate horoscope');
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get sign and type from query parameters
    const { searchParams } = new URL(request.url);
    const sign = searchParams.get('sign')?.toLowerCase() || '';
    const type = searchParams.get('type')?.toLowerCase() || 'daily';
    
    // Validate sign
    if (!sign || !VALID_SIGNS.includes(sign)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Invalid sign. Must be one of: ${VALID_SIGNS.join(', ')}` 
        },
        { status: 400 }
      );
    }
    
    // Validate type
    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}` 
        },
        { status: 400 }
      );
    }
    
    // Get today's date for daily horoscopes
    const date = type === 'daily' ? getTodayDate() : '';
    
    // Generate an appropriate cache key based on sign, type, and date
    let cacheKey: string;
    
    if (type === 'daily') {
      cacheKey = horoscopeKeys.daily(sign, date);
    } else if (type === 'weekly') {
      cacheKey = horoscopeKeys.weekly(sign);
    } else {
      cacheKey = horoscopeKeys.monthly(sign);
    }
    
    // Use different TTLs based on horoscope type
    const cacheTTL = type === 'daily' 
      ? CACHE_DURATIONS.ONE_DAY 
      : type === 'weekly' 
        ? CACHE_DURATIONS.ONE_WEEK 
        : CACHE_DURATIONS.ONE_WEEK;
    
    // Function to fetch the horoscope
    const fetchHoroscope = () => generateHoroscope(sign, type);
    
    // Use Redis caching if enabled
    const isCachingEnabled = isFeatureEnabled(FEATURE_FLAGS.USE_REDIS_CACHE, true);
    
    let horoscope;
    if (isCachingEnabled) {
      // Fetch with caching
      horoscope = await withCache(
        cacheKey,
        fetchHoroscope,
        { ttl: cacheTTL }
      );
    } else {
      // Fetch without caching
      horoscope = await fetchHoroscope();
    }
    
    // Return the horoscope
    return NextResponse.json({
      success: true,
      cached: isCachingEnabled,
      data: horoscope
    });
  } catch (error) {
    console.error('Horoscope API error:', error);
    
    // Return error response with proper type checking
    const errorMessage = error instanceof Error ? error.message : 'An error occurred generating the horoscope';
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage
      },
      { status: 500 }
    );
  }
} 