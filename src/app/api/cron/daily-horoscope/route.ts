import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { redis, CACHE_DURATIONS } from '@/utils/redis';
import { horoscopeKeys } from '@/utils/cache-keys';
import { safelyStoreInRedis } from '@/utils/redis-helpers';
import { applyCorsHeaders, isAllowedOrigin } from '@/utils/cors-service';

// Valid zodiac signs
const VALID_SIGNS = [
  'aries', 'taurus', 'gemini', 'cancer', 
  'leo', 'virgo', 'libra', 'scorpio', 
  'sagittarius', 'capricorn', 'aquarius', 'pisces'
];

// Helper to get today's date in YYYY-MM-DD format
const getTodayDate = () => new Date().toISOString().split('T')[0];

/**
 * Generate a daily horoscope using OpenAI for a specific sign
 */
async function generateDailyHoroscope(sign: string) {
  // Check if API key is configured
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  // Initialize OpenAI client
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  
  // Prompt for the horoscope generation based on user requirements
  const prompt = `You are an insightful and spiritually reflective AI with all the historic knowledge of all of the best works of Allan Watts, Richard Feynman, Albert Einstein, Friedrich Nietzsche, Lao Tzu, Socrates, Plato, Aristotle, Epicurus, Marcus Aurelius, Seneca, Jiddu Krishnamurti, Dr. Joe Dispenza, Walter Russell providing a daily symbolic horoscope designed to nurture mindfulness, self-awareness, and personal growth for ${sign}. Your horoscope does not predict literal or material outcomes but offers thoughtful, symbolic guidance rooted in the principles of mindfulness, perspective, connection to nature, self-discovery, and emotional resilience.

For today's horoscope, you MUST include ALL of the following elements:
1. Insightful Daily Guidance:
    * Offer symbolic advice encouraging the reader to stay mindfully present (hora), observe inwardly their thoughts and emotions (skopos), connect meaningfully with nature, or cultivate qualities such as patience, empathy, wisdom, and compassion.
    * Suggest gently letting go of rigid expectations or material attachments, encouraging emotional resilience and inner peace.
2. Best Match:
    * Provide ONE zodiac sign that harmonizes well with this sign today (choose from: aries, taurus, gemini, cancer, leo, virgo, libra, scorpio, sagittarius, capricorn, aquarius, pisces).
3. Inspirational Quote:
    * Include a short, powerful quote from EXACTLY ONE of these thinkers: Allan Watts, Richard Feynman, Albert Einstein, Friedrich Nietzsche, Lao Tzu, Socrates, Plato, Aristotle, Epicurus, Marcus Aurelius, Seneca, Jiddu Krishnamurti, Dr. Joe Dispenza, or Walter Russell.
    * Attribute the quote to the correct person.
    * Keep the quote concise (under 150 characters).
4. Peaceful Nighttime Thought:
    * End with a calming, reflective thought designed to help the reader peacefully unwind, foster gratitude, and encourage restful sleep by releasing attachment to the day's outcomes.

Your tone should remain nurturing, reflective, and empowering, guiding readers gently toward self-awareness, inner reflection, and a mindful, purposeful approach to daily life.

Format the response in JSON with the following fields:
- message: The main horoscope guidance message
- best_match: A single zodiac sign name (lowercase, e.g., "cancer")
- inspirational_quote: The quote text
- quote_author: The name of the quote's author (e.g., "Marcus Aurelius")
- peaceful_thought: A calming nighttime reflection

IMPORTANT: Your response MUST include all fields and they must be formatted exactly as specified. Make sure each zodiac sign gets a different quote author - do not repeat the same thinker across different signs.`;

  // Generate the horoscope using OpenAI
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
    
    // Validate the required fields exist
    if (!horoscopeData.message || horoscopeData.best_match === undefined || !horoscopeData.inspirational_quote || !horoscopeData.quote_author) {
      throw new Error('Missing required horoscope fields');
    }
    
    return {
      sign,
      type: 'daily',
      date: getTodayDate(),
      ...horoscopeData,
    };
  } catch (error) {
    console.error('Error parsing horoscope JSON:', error);
    throw new Error('Failed to generate horoscope');
  }
}

/**
 * Generate and cache horoscopes for all signs
 */
async function generateAllHoroscopes() {
  const date = getTodayDate();
  const results = [];
  const errors = [];

  // Generate horoscopes for all signs in parallel
  const horoscopePromises = VALID_SIGNS.map(async (sign) => {
    try {
      // Generate horoscope for this sign
      const horoscope = await generateDailyHoroscope(sign);
      
      // Generate cache key
      const cacheKey = horoscopeKeys.daily(sign, date);
      
      // Store in Redis using the helper function for proper serialization
      const storeSuccess = await safelyStoreInRedis(cacheKey, horoscope, {
        ttl: CACHE_DURATIONS.ONE_DAY
      });
      
      results.push({ sign, success: storeSuccess });
    } catch (error) {
      console.error(`Error generating horoscope for ${sign}:`, error);
      errors.push({ sign, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Wait for all horoscopes to be generated
  await Promise.all(horoscopePromises);

  return { results, errors };
}

// Function to apply CORS headers directly
function addCorsHeaders(response: NextResponse, origin: string): NextResponse {
  // Define allowed origins
  const allowedOrigins = [
    'https://www.gettodayshoroscope.com',
    'https://gettodayshoroscope.com',
  ];
  
  // Add localhost for development
  if (process.env.NODE_ENV === 'development') {
    allowedOrigins.push('http://localhost:3000');
  }
  
  // Use the specific origin if it's allowed, otherwise use the first allowed origin
  const responseOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  
  response.headers.set('Access-Control-Allow-Origin', responseOrigin);
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cache-Control');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Max-Age', '86400');
  
  return response;
}

/**
 * Vercel Cron handler - runs at midnight daily
 */
export async function GET(request: NextRequest) {
  // Get the origin for CORS
  const origin = request.headers.get('origin') || '';
  console.log(`Request from origin: ${origin}`);
  
  // Define allowed origins
  const allowedOrigins = [
    'https://www.gettodayshoroscope.com',
    'https://gettodayshoroscope.com',
  ];
  
  // Add localhost for development
  if (process.env.NODE_ENV === 'development') {
    allowedOrigins.push('http://localhost:3000');
  }
  
  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    // Use the specific origin if it's allowed, otherwise use the first allowed origin
    const responseOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
    
    return new NextResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': responseOrigin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cache-Control',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400'
      }
    });
  }

  try {
    // Always allow this endpoint to be called from the frontend
    // We only check for CRON_SECRET if it's not from our frontend domains
    const authHeader = request.headers.get('authorization');
    const isFrontendOrigin = origin && (
      origin.includes('gettodayshoroscope.com') || 
      origin.includes('localhost:3000')
    );

    // Skip auth check for frontend requests
    const isAuthorized = isFrontendOrigin || 
      (process.env.CRON_SECRET ? authHeader === `Bearer ${process.env.CRON_SECRET}` : true);

    if (!isAuthorized) {
      console.log('Unauthorized request to generate horoscopes');
      const errorResponse = NextResponse.json(
        { success: false, error: 'Unauthorized access to horoscope generation' },
        { status: 401 }
      );
      return addCorsHeaders(errorResponse, origin);
    }
    
    // Generate and cache all horoscopes
    const result = await generateAllHoroscopes();
    
    // Create success response
    const successResponse = NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      date: getTodayDate(),
      ...result
    });
    
    // Apply CORS headers directly and return
    return addCorsHeaders(successResponse, origin);
  } catch (error) {
    console.error('Cron job error:', error);
    
    // Create error response
    const errorResponse = NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'An error occurred during horoscope generation'
      },
      { status: 500 }
    );
    
    // Apply CORS headers to error response
    return addCorsHeaders(errorResponse, origin);
  }
} 