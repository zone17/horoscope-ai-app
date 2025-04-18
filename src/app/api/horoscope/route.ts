import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { withCache, getCachedData } from '@/utils/cache';
import { isFeatureEnabled, FEATURE_FLAGS } from '@/utils/feature-flags';
import { CACHE_DURATIONS } from '@/utils/redis';
import { horoscopeKeys } from '@/utils/cache-keys';
import { applyCorsHeaders } from '@/utils/cors-service';
import { getLocalDateForTimezone, getSafeTimezone } from '@/utils/timezone-utils';
import { safelyStoreInRedis } from '@/utils/redis-helpers';

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
  const prompt = `You are an insightful and spiritually reflective philosopher with detailed knowledge of the extensive work of Allan Watts, Richard Feynman, Albert Einstein, Friedrich Nietzsche, Lao Tzu, Socrates, Plato, Aristotle, Epicurus, Marcus Aurelius, Seneca, Jiddu Krishnamurti, Dr. Joe Dispenza, Walter Russell, please provide a daily symbolic horoscope designed to nurture mindfulness, self-awareness, and personal growth for ${sign}. Your horoscope does not predict literal or material outcomes but offers thoughtful, symbolic guidance rooted in the principles of mindfulness, perspective, connection to nature and the universe, self-discovery, and emotional resilience.

For today's horoscope, include the following elements:
1. Insightful Daily Guidance:
    * Create a unique daily horoscope for ${sign} that feels deeply personal, soulful, and varied in style from other signs. Provide symbolic and mindful guidance that encourages the reader to stay present, explore their inner thoughts, and connect with nature. Include elements such as poetic metaphors, anecdotes, and diverse narrative structures—alternating the order of advice, reflection, and creative imagery to ensure each zodiac sign's reading has its own distinctive rhythm and personality. Avoid a one-size-fits-all template; instead, let each reading have its own voice, varying in tone, sentence structure, and focal themes (e.g., sometimes emphasizing patience and empathy, other times focusing on wisdom or emotional resilience). The result should be a series of daily messages that are both unique and organically written, as if a different philosopher crafted each one.
2. Lucky Color:
    * Suggest a meaningful color for the day with a brief symbolic explanation emphasizing emotional or spiritual resonance.
3. Lucky Number:
    * Provide a number with symbolic significance, briefly explaining its reflective or spiritual symbolism for the day.
4. Best Match:
    * Provide 3-4 zodiac signs that harmonize well with this sign today, listed in alphabetical order.
    * Format the list as a comma-separated string (e.g., "aries, gemini, libra").
    * IMPORTANT: NEVER include the current sign in its own best matches (e.g., Libra should never list Libra as a best match).
    * Follow these traditional astrological compatibility patterns:
        - Fire signs (Aries, Leo, Sagittarius) harmonize with other Fire signs and Air signs (Gemini, Libra, Aquarius)
        - Earth signs (Taurus, Virgo, Capricorn) harmonize with other Earth signs and Water signs (Cancer, Scorpio, Pisces)
        - Air signs (Gemini, Libra, Aquarius) harmonize with other Air signs and Fire signs (Aries, Leo, Sagittarius)
        - Water signs (Cancer, Scorpio, Pisces) harmonize with other Water signs and Earth signs (Taurus, Virgo, Capricorn)
    * IMPORTANT: If the sign is Libra, ALWAYS include Aquarius in best matches. If the sign is Aquarius, ALWAYS include Libra in best matches.
5. Inspirational Quote:
    * Allowed Philosophers Only:
        * Use quotes exclusively from one of these thinkers:
            * Allan Watts, Richard Feynman, Albert Einstein, Friedrich Nietzsche, Lao Tzu, Socrates, Plato, Aristotle, Epicurus, Marcus Aurelius, Seneca, Jiddu Krishnamurti, Dr. Joe Dispenza, or Walter Russell.
        * Do not use any quotes from philosophers outside of this list.
    * No Repetition Across Signs:
        * Ensure that within the set of 12 zodiac signs for a given day, each sign receives a quote from a different philosopher.
        * Once a philosopher has been selected for one zodiac sign, they should not be used again for any other sign on that day.
    * Relevance to Horoscope Theme:
        * Select a quote that relates to or enhances the central theme or advice of that day's horoscope.
        * The quote should feel integrated with the daily guidance and offer meaningful insight.
    * Accurate Attribution:
        * Attribute the quote with the exact name of the philosopher as provided in the allowed list.
        * For example, if using a quote from Lao Tzu, ensure it is exactly "Lao Tzu."
6. Peaceful Nighttime Thought:
    * Purpose & Tone:
        * Calming & Reflective: The message should help the reader unwind, feel at ease, and transition peacefully into sleep.
        * Tailored to the Sign: Infuse subtle references or imagery that resonate with the unique qualities of the zodiac sign (e.g., water imagery for Pisces, airy imagery for Gemini).
        * Foster Gratitude & Letting Go: Encourage gratitude for the day's positive moments and invite the reader to gently release any lingering concerns.
    * Uniqueness in Structure:
        * Vary Sentence Structure: Change up the sentence length, rhythm, and order of ideas across different signs. For one sign, you might start with a reflective question; for another, a descriptive narrative or even a brief poetic stanza.
        * Different Literary Devices: Incorporate diverse elements such as metaphors, similes, or brief anecdotal reflections that differ in presentation from one sign to the next.
    * Avoid a Template: Do not use the same introductory phrase or closing line for every sign. Each sign's message should feel organically crafted with its own unique cadence and focus.
    * Content Considerations:
        * Imagery & Metaphors: Use imagery that corresponds with both nighttime calm and the sign's archetypal energy (e.g., a starlit sky for a water sign, gentle rustling leaves for an earth sign).
        * Actionable Reflection: Include a subtle invitation to reflect—whether it's to count small blessings, observe the quiet of the night, or simply breathe deeply and let go.
        * Sign-Specific Nuances: If appropriate, include a gentle nod to the sign's strengths or challenges. For example, an Aries might receive a note on channeling their dynamic energy into quiet focus, while a Taurus might be encouraged to savor the serene pace of the night.
    * Formatting:
        * Concise & Impactful: While unique, the message should remain succinct enough to leave a lasting impression without overwhelming the reader.
        * Natural Flow: The final output should feel like a gentle whisper rather than a rigidly structured message.
    * Implementation Approach:
        * Step 1: Analyze the central theme or advice from the daily guidance for the sign.
        * Step 2: Choose imagery and phrasing that aligns with that advice and the sign's qualities.
        * Step 3: Construct a brief, varied narrative that might differ from other signs by:
            * Starting with a reflective question or a vivid descriptive sentence.
            * Employing unique metaphors tied to the sign's natural elements.
            * Concluding with an actionable or reflective thought that gently encourages restful sleep.
        * Step 4: Verify that the overall structure is not identical to that used for any other zodiac sign's nighttime thought.
    * Your tone should remain nurturing, reflective, and empowering, guiding readers gently toward self-awareness, inner reflection, and a mindful, purposeful approach to daily life.
    * Concise & Impactful: While unique, the message should remain succinct enough to leave a lasting impression without overwhelming the reader.
    * Natural Flow: The final output should feel like a gentle whisper rather than a rigidly structured message.
    * Implementation Approach:
      * Step 1: Analyze the central theme or advice from the daily guidance for the sign.
      * Step 2: Choose imagery and phrasing that aligns with that advice and the sign's qualities.
      * Step 3: Construct a brief, varied narrative that might differ from other signs by:
          * Starting with a reflective question or a vivid descriptive sentence.
          * Employing unique metaphors tied to the sign's natural elements.
          * Concluding with an actionable or reflective thought that gently encourages restful sleep.
      * Step 4: Verify that the overall structure is not identical to that used for any other zodiac sign's nighttime thought.

Format the response in JSON with the following fields:
- message: The main horoscope guidance message
- lucky_number: A lucky number for today with its symbolic meaning
- lucky_color: A lucky color for today with its symbolic meaning
- best_match: The most compatible zodiac signs for today in alphabetical order
- inspirational_quote: A philosophical quote from one of the mentioned thinkers
- quote_author: The author of the inspirational quote
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
    
    // Ensure sign is not included in its own best matches
    if (horoscopeData.best_match) {
      const bestMatches = horoscopeData.best_match.toLowerCase().split(',').map((s: string) => s.trim());
      const filteredMatches = bestMatches.filter((match: string) => match !== sign.toLowerCase());
      horoscopeData.best_match = filteredMatches.join(', ');
    }
    
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

/**
 * Batch generate horoscopes for all signs for a specific local date
 * This optimizes API usage by generating all signs at once when a cache miss occurs
 * @param localDate - The user's local date in YYYY-MM-DD format
 * @param type - The type of horoscope (daily, weekly, monthly)
 * @returns Object with results and any errors
 */
async function batchGenerateHoroscopes(localDate: string, type: string = 'daily') {
  console.log(`Batch generating horoscopes for all signs for local date: ${localDate}`);
  
  const results: Record<string, any> = {};
  const errors: Record<string, string> = {};
  
  // Track philosopher usage to avoid repeating the same one more than twice
  const philosopherUsage: Record<string, number> = {};
  
  // Generate horoscopes sequentially to manage philosopher assignment
  for (const sign of VALID_SIGNS) {
    try {
      console.log(`Generating horoscope for ${sign} for local date ${localDate}...`);
      
      // Generate horoscope for this sign
      let horoscope = await generateHoroscope(sign, type);
      
      // Count philosopher usage
      const author = horoscope.quote_author;
      philosopherUsage[author] = (philosopherUsage[author] || 0) + 1;
      
      // If this philosopher has been used more than twice, regenerate the horoscope
      if (philosopherUsage[author] > 2) {
        console.log(`Philosopher ${author} already used twice. Regenerating horoscope for ${sign}...`);
        // Try up to 3 times to get a different philosopher
        for (let attempt = 0; attempt < 3; attempt++) {
          const newHoroscope = await generateHoroscope(sign, type);
          const newAuthor = newHoroscope.quote_author;
          
          // If this is a different philosopher who hasn't been used twice yet
          if (newAuthor !== author && (!philosopherUsage[newAuthor] || philosopherUsage[newAuthor] < 2)) {
            horoscope = newHoroscope;
            philosopherUsage[newAuthor] = (philosopherUsage[newAuthor] || 0) + 1;
            console.log(`Successfully assigned philosopher ${newAuthor} to ${sign}`);
            break;
          }
        }
      }
      
      // Generate timezone-aware cache key
      const cacheKey = horoscopeKeys.timezoneDaily(sign, localDate);
      
      // Store in Redis with timezone-aware cache key
      const storeSuccess = await safelyStoreInRedis(cacheKey, horoscope, {
        ttl: CACHE_DURATIONS.ONE_DAY
      });
      
      results[sign] = { success: storeSuccess, data: horoscope };
      console.log(`Successfully cached ${sign} horoscope for local date ${localDate}`);
    } catch (error) {
      console.error(`Error generating horoscope for ${sign}:`, error);
      errors[sign] = error instanceof Error ? error.message : 'Unknown error';
    }
  }
  
  return { results, errors, timestamp: new Date().toISOString() };
}

// Function to apply CORS headers directly
function addCorsHeaders(response: NextResponse): NextResponse {
  // Allow all origins for maximum compatibility
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cache-Control');
  response.headers.set('Access-Control-Max-Age', '86400');
  
  return response;
}

export async function GET(request: NextRequest) {
  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cache-Control',
        'Access-Control-Max-Age': '86400'
      }
    });
  }

  try {
    // Get sign and type from query parameters
    const { searchParams } = new URL(request.url);
    const sign = searchParams.get('sign')?.toLowerCase() || '';
    const type = searchParams.get('type')?.toLowerCase() || 'daily';
    
    // New parameter: timezone for timezone-aware content
    const timezone = searchParams.get('timezone') || 'UTC';
    
    // Validate sign
    if (!sign || !VALID_SIGNS.includes(sign)) {
      const errorResponse = NextResponse.json(
        { 
          success: false, 
          error: `Invalid sign. Must be one of: ${VALID_SIGNS.join(', ')}` 
        },
        { status: 400 }
      );
      
      // Apply CORS headers directly
      return addCorsHeaders(errorResponse);
    }
    
    // Validate type
    if (!VALID_TYPES.includes(type)) {
      const errorResponse = NextResponse.json(
        { 
          success: false, 
          error: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}` 
        },
        { status: 400 }
      );
      
      // Apply CORS headers directly
      return addCorsHeaders(errorResponse);
    }
    
    // Check if timezone-aware content is enabled
    const useTimezoneContent = isFeatureEnabled(FEATURE_FLAGS.USE_TIMEZONE_CONTENT, false);
    
    // Generate appropriate cache key
    let cacheKey: string;
    let localDate: string = getTodayDate();
    
    if (useTimezoneContent && type === 'daily') {
      // Calculate user's local date based on their timezone
      localDate = getLocalDateForTimezone(getSafeTimezone(timezone));
      cacheKey = horoscopeKeys.timezoneDaily(sign, localDate);
      console.log(`Using timezone-aware cache key with timezone ${timezone} and local date ${localDate}`);
    } else {
      // Use original UTC-based cache key
      cacheKey = horoscopeKeys.daily(sign, getTodayDate());
    }
    
    // Use Redis caching if enabled
    const isCachingEnabled = isFeatureEnabled(FEATURE_FLAGS.USE_REDIS_CACHE, true);
    
    let horoscope;
    let wasCached = false;
    let generatedBatch = false;
    
    if (isCachingEnabled) {
      // Check if data exists in cache first
      const cachedData = await getCachedData(cacheKey);
      
      if (cachedData) {
        // Cache hit - return cached data
        horoscope = cachedData;
        wasCached = true;
        console.log(`Cache hit for ${sign} with local date ${localDate}`);
      } else {
        // Cache miss - need to generate content
        console.log(`Cache miss for ${sign} with local date ${localDate}`);
        
        if (useTimezoneContent && type === 'daily') {
          // Generate horoscopes for ALL signs at once for this local date
          console.log(`Generating batch horoscopes for all signs for local date ${localDate}`);
          
          const batchResult = await batchGenerateHoroscopes(localDate, type);
          generatedBatch = true;
          
          // Get the requested sign's data from the batch results
          if (batchResult.results[sign] && batchResult.results[sign].data) {
            horoscope = batchResult.results[sign].data;
            console.log(`Retrieved ${sign} data from batch generation`);
          } else {
            // Fallback: generate just this sign if batch generation failed for it
            console.log(`Batch generation failed for ${sign}, generating individually`);
            horoscope = await generateHoroscope(sign, type);
            
            // Cache the individual result
            await safelyStoreInRedis(cacheKey, horoscope, { ttl: CACHE_DURATIONS.ONE_DAY });
          }
        } else {
          // Regular non-timezone approach: generate just the requested sign
          horoscope = await generateHoroscope(sign, type);
          
          // Cache the result with the appropriate key and TTL
          const cacheTTL = type === 'daily' 
            ? CACHE_DURATIONS.ONE_DAY 
            : type === 'weekly' 
              ? CACHE_DURATIONS.ONE_WEEK 
              : CACHE_DURATIONS.ONE_WEEK;
          
          await safelyStoreInRedis(cacheKey, horoscope, { ttl: cacheTTL });
        }
      }
    } else {
      // Caching disabled, always generate fresh content
      horoscope = await generateHoroscope(sign, type);
    }
    
    // Create the success response with detailed information
    const successResponse = NextResponse.json({
      success: true,
      cached: wasCached,
      batchGenerated: generatedBatch,
      timezoneAware: useTimezoneContent,
      timezone: useTimezoneContent ? timezone : null,
      localDate: useTimezoneContent ? localDate : null,
      data: horoscope
    });
    
    // Apply CORS headers directly and return
    return addCorsHeaders(successResponse);
  } catch (error) {
    console.error('Horoscope API error:', error);
    
    // Return an error response
    const errorResponse = NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'An unexpected error occurred' 
      },
      { status: 500 }
    );
    
    // Apply CORS headers and return
    return addCorsHeaders(errorResponse);
  }
} 