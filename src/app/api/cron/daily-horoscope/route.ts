import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { redis, CACHE_DURATIONS } from '@/utils/redis';
import { horoscopeKeys } from '@/utils/cache-keys';
import { safelyStoreInRedis } from '@/utils/redis-helpers';
import { applyCorsHeaders, isAllowedOrigin } from '@/utils/cors-service';
import { buildHoroscopePrompt, getPhilosopherAssignment, VALID_AUTHORS } from '@/utils/horoscope-prompts';

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
async function generateDailyHoroscope(sign: string, assignedPhilosopher?: string) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const today = getTodayDate();
  const philosopher = assignedPhilosopher || getPhilosopherAssignment(sign, today);
  const prompt = buildHoroscopePrompt(sign, philosopher);

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini-2024-07-18',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    max_tokens: 800,
  });

  const content = response.choices[0].message.content;
  const horoscopeData = JSON.parse(content || '{}');

  // Validate required fields
  if (!horoscopeData.message || !horoscopeData.inspirational_quote || !horoscopeData.quote_author) {
    throw new Error('Missing required horoscope fields');
  }

  // Validate quote author is from approved list
  if (!VALID_AUTHORS.some(author =>
      horoscopeData.quote_author.toLowerCase().includes(author.toLowerCase()))) {
    console.error(`Invalid quote author: ${horoscopeData.quote_author}. Using assigned: ${philosopher}`);
    horoscopeData.quote_author = philosopher;
  }

  // Ensure sign is not in its own best matches
  if (horoscopeData.best_match) {
    const matches = horoscopeData.best_match.toLowerCase().split(',').map((s: string) => s.trim());
    horoscopeData.best_match = matches.filter((m: string) => m !== sign.toLowerCase()).join(', ');
  }

  return { sign, type: 'daily', date: today, ...horoscopeData };
}

/**
 * Generate and cache horoscopes for all signs.
 * Uses pre-assigned philosopher rotation — no retries needed.
 */
async function generateAllHoroscopes() {
  const date = getTodayDate();
  const results = [];
  const errors = [];

  for (const sign of VALID_SIGNS) {
    try {
      const philosopher = getPhilosopherAssignment(sign, date);
      console.log(`Generating ${sign} with philosopher: ${philosopher}`);
      const horoscope = await generateDailyHoroscope(sign, philosopher);

      const cacheKey = horoscopeKeys.daily(sign, date);
      const storeSuccess = await safelyStoreInRedis(cacheKey, horoscope, {
        ttl: CACHE_DURATIONS.ONE_DAY
      });

      results.push({ sign, success: storeSuccess, philosopher });
    } catch (error) {
      console.error(`Error generating horoscope for ${sign}:`, error);
      errors.push({ sign, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

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