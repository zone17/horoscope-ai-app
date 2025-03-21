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
  // Improved check for API key configuration
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === 'your_openai_api_key_here') {
    console.error('OpenAI API key not configured or using default placeholder value');
    throw new Error('OpenAI API key not properly configured');
  }

  // Initialize OpenAI client
  const openai = new OpenAI({
    apiKey: apiKey,
  });

  // Log model information for debugging
  console.log('Making OpenAI request with:', {
    sign,
    type,
    model: 'gpt-4o-mini-2024-07-18',
  });

  const timeframe = type === 'daily' ? 'today' : type;
  
  // Prompt for the horoscope generation - exact clone of cron job prompt
  const prompt = `You are an insightful and spiritually reflective AI with all the historic knowledge of all of the best works of Allan Watts, Richard Feynman, Albert Einstein, Friedrich Nietzsche, Lao Tzu, Socrates, Plato, Aristotle, Epicurus, Marcus Aurelius, Seneca, Jiddu Krishnamurti, Dr. Joe Dispenza, Walter Russell providing a daily symbolic horoscope designed to nurture mindfulness, self-awareness, and personal growth for ${sign}. Your horoscope does not predict literal or material outcomes but offers thoughtful, symbolic guidance rooted in the principles of mindfulness, perspective, connection to nature, self-discovery, and emotional resilience.

For today's horoscope, include the following elements:
1. Insightful Daily Guidance:
    * Offer symbolic advice encouraging the reader to stay mindfully present (hora), observe inwardly their thoughts and emotions (skopos), connect meaningfully with nature, or cultivate qualities such as patience, empathy, wisdom, and compassion.
    * Suggest gently letting go of rigid expectations or material attachments, encouraging emotional resilience and inner peace.
2. Lucky Color:
    * Suggest a meaningful color for the day with a brief symbolic explanation emphasizing emotional or spiritual resonance.
3. Lucky Number:
    * Provide a number with symbolic significance, briefly explaining its reflective or spiritual symbolism for the day.
4. Peaceful Nighttime Thought:
    * End with a calming, reflective thought designed to help the reader peacefully unwind, foster gratitude, and encourage restful sleep by releasing attachment to the day's outcomes.

Your tone should remain nurturing, reflective, and empowering, guiding readers gently toward self-awareness, inner reflection, and a mindful, purposeful approach to daily life.

Format the response in JSON with the following fields:
- message: The main horoscope guidance message
- lucky_number: A lucky number for today with its symbolic meaning
- lucky_color: A lucky color for today with its symbolic meaning
- peaceful_thought: A calming nighttime reflection`;

  // Generate the horoscope using OpenAI - using same model as cron job
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini-2024-07-18',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    max_tokens: 800,
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
      { 
        status: 500
      }
    );
  }
} 