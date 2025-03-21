import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { redis, CACHE_DURATIONS } from '@/utils/redis';
import { horoscopeKeys } from '@/utils/cache-keys';
import { safelyStoreInRedis } from '@/utils/redis-helpers';
import { applyCorsHeaders } from '@/utils/cors-service';

// Valid zodiac signs
const VALID_SIGNS = [
  'aries', 'taurus', 'gemini', 'cancer', 
  'leo', 'virgo', 'libra', 'scorpio', 
  'sagittarius', 'capricorn', 'aquarius', 'pisces'
];

// Set route to be dynamic to prevent caching at edge level
export const dynamic = 'force-dynamic';

// Helper to get today's date in YYYY-MM-DD format
const getTodayDate = () => new Date().toISOString().split('T')[0];

/**
 * Generate a daily horoscope using OpenAI for a specific sign
 */
async function generateDailyHoroscope(sign: string) {
  console.log(`DEBUG-GENERATE: Generating horoscope for ${sign}`);
  
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
4. Best Match:
    * Provide 3-4 zodiac signs that harmonize well with this sign today, listed in alphabetical order.
    * Format the list as a comma-separated string (e.g., "aries, gemini, libra").
    * Follow these traditional astrological compatibility patterns:
        - Fire signs (Aries, Leo, Sagittarius) harmonize with other Fire signs and Air signs (Gemini, Libra, Aquarius)
        - Earth signs (Taurus, Virgo, Capricorn) harmonize with other Earth signs and Water signs (Cancer, Scorpio, Pisces)
        - Air signs (Gemini, Libra, Aquarius) harmonize with other Air signs and Fire signs (Aries, Leo, Sagittarius)
        - Water signs (Cancer, Scorpio, Pisces) harmonize with other Water signs and Earth signs (Taurus, Virgo, Capricorn)
    * IMPORTANT: If the sign is Libra, ALWAYS include Aquarius in best matches. If the sign is Aquarius, ALWAYS include Libra in best matches.
5. Inspirational Quote:
    * IMPORTANT: Include a quote EXCLUSIVELY from ONE of these thinkers: Allan Watts, Richard Feynman, Albert Einstein, Friedrich Nietzsche, Lao Tzu, Socrates, Plato, Aristotle, Epicurus, Marcus Aurelius, Seneca, Jiddu Krishnamurti, Dr. Joe Dispenza, or Walter Russell.
    * DO NOT use quotes from ANY other sources (no Buddha, Gandhi, Rumi, etc.) - ONLY use quotes from the philosophers listed above.
    * Attribute the quote correctly to the exact name from the list above.
    * Ensure the quote relates to the horoscope's central theme or advice.
6. Peaceful Nighttime Thought:
    * End with a calming, reflective thought designed to help the reader peacefully unwind, foster gratitude, and encourage restful sleep by releasing attachment to the day's outcomes.

Your tone should remain nurturing, reflective, and empowering, guiding readers gently toward self-awareness, inner reflection, and a mindful, purposeful approach to daily life.

Format the response in JSON with the following fields:
- message: The main horoscope guidance message
- lucky_number: A lucky number for today with its symbolic meaning
- lucky_color: A lucky color for today with its symbolic meaning
- best_match: A comma-separated list of compatible zodiac signs
- inspirational_quote: A philosophical quote from one of the mentioned thinkers
- quote_author: The author of the inspirational quote
- peaceful_thought: A calming nighttime reflection`;

  console.log(`DEBUG-GENERATE: Sending prompt to OpenAI for ${sign}`);
  
  // Generate the horoscope using OpenAI
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini-2024-07-18',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    max_tokens: 800,
  });

  const content = response.choices[0].message.content;
  console.log(`DEBUG-GENERATE: Received response from OpenAI for ${sign}`);
  
  // Parse the JSON response and add metadata
  try {
    const horoscopeData = JSON.parse(content || '{}');
    
    // Valid quote authors list
    const validAuthors = [
      'Allan Watts', 'Alan Watts', 'Richard Feynman', 'Albert Einstein', 
      'Friedrich Nietzsche', 'Lao Tzu', 'Socrates', 'Plato', 'Aristotle', 
      'Epicurus', 'Marcus Aurelius', 'Seneca', 'Jiddu Krishnamurti', 
      'Dr. Joe Dispenza', 'Joe Dispenza', 'Walter Russell'
    ];
    
    // Validate the quote author is from our approved list
    if (!horoscopeData.quote_author || 
        !validAuthors.some(author => 
          horoscopeData.quote_author.toLowerCase().includes(author.toLowerCase()))) {
      console.error(`Invalid or missing quote author: ${horoscopeData.quote_author}. Using fallback.`);
      // Use a fallback author from our list
      horoscopeData.quote_author = validAuthors[Math.floor(Math.random() * validAuthors.length)];
    }
    
    // Validate best match - ensure it's properly formatted
    if (sign === 'libra' && horoscopeData.best_match) {
      // Make sure Aquarius is included for Libra
      const matches = horoscopeData.best_match.toLowerCase().split(/,\s*/);
      if (!matches.includes('aquarius')) {
        matches.push('aquarius');
        // Sort alphabetically and rejoin
        horoscopeData.best_match = [...new Set(matches)].sort().join(', ');
      }
    }
    
    if (sign === 'aquarius' && horoscopeData.best_match) {
      // Make sure Libra is included for Aquarius
      const matches = horoscopeData.best_match.toLowerCase().split(/,\s*/);
      if (!matches.includes('libra')) {
        matches.push('libra');
        // Sort alphabetically and rejoin
        horoscopeData.best_match = [...new Set(matches)].sort().join(', ');
      }
    }
    
    return {
      sign,
      type: 'daily',
      date: getTodayDate(),
      message: horoscopeData.message,
      lucky_number: horoscopeData.lucky_number,
      lucky_color: horoscopeData.lucky_color,
      best_match: horoscopeData.best_match || '',
      inspirational_quote: horoscopeData.inspirational_quote || '',
      quote_author: horoscopeData.quote_author || '',
      peaceful_thought: horoscopeData.peaceful_thought || '',
      lucky_number_full: {
        number: horoscopeData.lucky_number,
        meaning: horoscopeData.lucky_number_meaning || ''
      },
      lucky_color_full: {
        color: horoscopeData.lucky_color,
        meaning: horoscopeData.lucky_color_meaning || ''
      }
    };
  } catch (error) {
    console.error(`DEBUG-GENERATE: Error parsing horoscope JSON for ${sign}:`, error);
    throw new Error(`Failed to generate horoscope for ${sign}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate a horoscope for a specific sign and store it in Redis
 */
async function generateAndStoreHoroscope(sign: string) {
  try {
    // Generate horoscope data
    const horoscope = await generateDailyHoroscope(sign);
    console.log(`DEBUG-GENERATE: Generated horoscope for ${sign}`);
    
    // Generate cache key
    const today = getTodayDate();
    const cacheKey = horoscopeKeys.daily(sign, today);
    console.log(`DEBUG-GENERATE: Storing with key ${cacheKey}`);
    
    // Store in Redis
    const storeSuccess = await safelyStoreInRedis(cacheKey, horoscope, {
      ttl: CACHE_DURATIONS.ONE_DAY
    });
    
    return {
      sign,
      success: storeSuccess,
      data: horoscope
    };
  } catch (error) {
    console.error(`DEBUG-GENERATE: Error generating/storing horoscope for ${sign}:`, error);
    return {
      sign,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * API endpoint to manually trigger horoscope generation
 */
export async function GET(request: NextRequest) {
  try {
    // Get the origin for CORS
    const origin = request.headers.get('origin');
    console.log(`DEBUG-GENERATE: Request origin: ${origin}`);
    
    // Get sign parameter (optional)
    const { searchParams } = new URL(request.url);
    const sign = searchParams.get('sign')?.toLowerCase();
    const all = searchParams.get('all') === 'true';
    
    console.log(`DEBUG-GENERATE: Params - sign: ${sign}, all: ${all}`);
    
    let results = {};
    let errors = [];
    
    // Generate for a specific sign or all signs
    if (all) {
      // Generate for all signs
      console.log('DEBUG-GENERATE: Generating for all signs');
      
      const generatePromises = VALID_SIGNS.map(async (zodiacSign) => {
        return generateAndStoreHoroscope(zodiacSign);
      });
      
      const allResults = await Promise.all(generatePromises);
      
      // Process results
      allResults.forEach(result => {
        results[result.sign] = result;
        if (!result.success) {
          errors.push({ sign: result.sign, error: result.error });
        }
      });
    } else if (sign && VALID_SIGNS.includes(sign)) {
      // Generate for a specific sign
      console.log(`DEBUG-GENERATE: Generating for ${sign}`);
      const result = await generateAndStoreHoroscope(sign);
      results[sign] = result;
      
      if (!result.success) {
        errors.push({ sign, error: result.error });
      }
    } else {
      // Invalid or missing sign parameter
      const errorResponse = NextResponse.json({
        success: false,
        error: `Invalid or missing sign parameter. Must be one of: ${VALID_SIGNS.join(', ')}, or use all=true`
      }, { status: 400 });
      
      return origin ? applyCorsHeaders(errorResponse, origin) : errorResponse;
    }
    
    // Create success response
    const successResponse = NextResponse.json({
      success: errors.length === 0,
      timestamp: new Date().toISOString(),
      results,
      errors: errors.length > 0 ? errors : undefined
    });
    
    // Apply CORS headers and return
    return origin ? applyCorsHeaders(successResponse, origin) : successResponse;
  } catch (error) {
    console.error('DEBUG-GENERATE: Unexpected error:', error);
    
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