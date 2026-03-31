import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { redis, CACHE_DURATIONS } from '@/utils/redis';
import { horoscopeKeys } from '@/utils/cache-keys';
import { safelyStoreInRedis } from '@/utils/redis-helpers';
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

// CORS preflight is handled by middleware.ts for all /api/* routes
export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

/**
 * Vercel Cron handler - runs at midnight daily
 * Requires CRON_SECRET in Authorization header for all requests.
 * The Vercel cron scheduler sends this automatically.
 */
export async function GET(request: NextRequest) {
  // Require CRON_SECRET for all requests — no origin-based bypass
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error('CRON_SECRET environment variable is not configured — denying all requests');
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${cronSecret}`) {
    console.log('Unauthorized request to generate horoscopes');
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    // Generate and cache all horoscopes
    const result = await generateAllHoroscopes();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      date: getTodayDate(),
      ...result
    });
  } catch (error) {
    console.error('Cron job error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'An error occurred during horoscope generation'
      },
      { status: 500 }
    );
  }
}
