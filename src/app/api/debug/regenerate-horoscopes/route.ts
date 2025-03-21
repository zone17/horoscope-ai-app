import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { redis, CACHE_DURATIONS } from '@/utils/redis';
import { horoscopeKeys } from '@/utils/cache-keys';
import { safelyStoreInRedis } from '@/utils/redis-helpers';

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
- lucky_number: A lucky number for today with its meaning
- lucky_color: A lucky color for today with its meaning
- best_match: A comma-separated list of compatible zodiac signs
- inspirational_quote: A philosophical quote from one of the mentioned thinkers
- quote_author: The author of the inspirational quote
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
    
    // Make sure the horoscope has compatible fields with the frontend
    const formattedHoroscope = {
      sign,
      type: 'daily',
      date: getTodayDate(),
      message: horoscopeData.message,
      best_match: horoscopeData.best_match || '',
      inspirational_quote: horoscopeData.inspirational_quote || '',
      quote_author: horoscopeData.quote_author || '',
      peaceful_thought: horoscopeData.peaceful_thought || '',
      lucky_number: horoscopeData.lucky_number || '',
      lucky_color: horoscopeData.lucky_color || '',
      lucky_number_full: {
        number: horoscopeData.lucky_number,
        meaning: horoscopeData.lucky_number_meaning || ''
      },
      lucky_color_full: {
        color: horoscopeData.lucky_color,
        meaning: horoscopeData.lucky_color_meaning || ''
      }
    };
    
    return formattedHoroscope;
  } catch (error) {
    console.error('Error parsing horoscope JSON:', error);
    throw new Error('Failed to generate horoscope');
  }
}

/**
 * Generate and cache a horoscope for a specific sign, ensuring all required fields are present
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sign = searchParams.get('sign')?.toLowerCase();
    
    if (!sign || !VALID_SIGNS.includes(sign)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Invalid sign. Must be one of: ${VALID_SIGNS.join(', ')}` 
        },
        { status: 400 }
      );
    }
    
    // Generate a new horoscope
    console.log(`Regenerating horoscope for ${sign}...`);
    const horoscope = await generateDailyHoroscope(sign);
    
    // Store in Redis
    const date = getTodayDate();
    const cacheKey = horoscopeKeys.daily(sign, date);
    await safelyStoreInRedis(cacheKey, horoscope, {
      ttl: CACHE_DURATIONS.ONE_DAY
    });
    
    return NextResponse.json({
      success: true,
      sign,
      timestamp: new Date().toISOString(),
      message: `Successfully regenerated and cached horoscope for ${sign}`,
      data: horoscope
    });
  } catch (error) {
    console.error(`Error regenerating horoscope:`, error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'An error occurred' 
      },
      { status: 500 }
    );
  }
}

/**
 * Generate and cache horoscopes for all signs
 */
export async function POST(request: NextRequest) {
  try {
    const date = getTodayDate();
    const results = [];
    const errors = [];
    
    // Track philosopher usage to avoid repeating the same one more than twice
    const philosopherUsage = {};
    
    // Generate horoscopes sequentially to manage philosopher assignment
    for (const sign of VALID_SIGNS) {
      try {
        console.log(`Regenerating horoscope for ${sign}...`);
        
        // Generate horoscope for this sign
        let horoscope = await generateDailyHoroscope(sign);
        
        // Count philosopher usage
        const author = horoscope.quote_author;
        philosopherUsage[author] = (philosopherUsage[author] || 0) + 1;
        
        // If this philosopher has been used more than twice, regenerate the horoscope
        if (philosopherUsage[author] > 2) {
          console.log(`Philosopher ${author} already used twice. Regenerating horoscope for ${sign}...`);
          // Try up to 3 times to get a different philosopher
          for (let attempt = 0; attempt < 3; attempt++) {
            const newHoroscope = await generateDailyHoroscope(sign);
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
        
        // Generate cache key
        const cacheKey = horoscopeKeys.daily(sign, date);
        
        // Store in Redis using the helper function for proper serialization
        const storeSuccess = await safelyStoreInRedis(cacheKey, horoscope, {
          ttl: CACHE_DURATIONS.ONE_DAY
        });
        
        results.push({ 
          sign, 
          success: storeSuccess,
          best_match: horoscope.best_match || '',
          quote_author: horoscope.quote_author || '',
        });
      } catch (error) {
        console.error(`Error generating horoscope for ${sign}:`, error);
        errors.push({ sign, error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      date: getTodayDate(),
      results,
      errors
    });
  } catch (error) {
    console.error(`Error regenerating all horoscopes:`, error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'An error occurred' 
      },
      { status: 500 }
    );
  }
} 