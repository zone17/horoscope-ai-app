import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { redis, CACHE_DURATIONS } from '@/utils/redis';
import { horoscopeKeys } from '@/utils/cache-keys';

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
      
      // Store in Redis with TTL of one day
      await redis.set(cacheKey, horoscope, {
        ex: CACHE_DURATIONS.ONE_DAY
      });
      
      results.push({ sign, success: true });
    } catch (error) {
      console.error(`Error generating horoscope for ${sign}:`, error);
      errors.push({ sign, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Wait for all horoscopes to be generated
  await Promise.all(horoscopePromises);

  return { results, errors };
}

/**
 * Vercel Cron handler - runs at midnight daily
 */
export async function GET(request: NextRequest) {
  try {
    // Check for authorization (optional for enhanced security)
    const authHeader = request.headers.get('authorization');
    const isAuthorized = process.env.CRON_SECRET 
      ? authHeader === `Bearer ${process.env.CRON_SECRET}`
      : true;
    
    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Generate and cache all horoscopes
    const result = await generateAllHoroscopes();
    
    // Return success response
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      date: getTodayDate(),
      ...result
    });
  } catch (error) {
    console.error('Cron job error:', error);
    
    // Return error response
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'An error occurred during horoscope generation'
      },
      { status: 500 }
    );
  }
} 