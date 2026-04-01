/**
 * Single consolidated horoscope generation function.
 * All code paths (API route, cron job, refresh) import from here.
 * No other file should instantiate OpenAI or build horoscope prompts directly.
 */

import OpenAI from 'openai';
import { buildHoroscopePrompt, getPhilosopherAssignment, VALID_AUTHORS } from './horoscope-prompts';
import { VERIFIED_QUOTES } from './verified-quotes';
import { buildMonthlyPromptAddition, getMonthMeta, isValidMonthSlug } from './monthly-content';

// Valid zodiac signs
export const VALID_SIGNS = [
  'aries', 'taurus', 'gemini', 'cancer',
  'leo', 'virgo', 'libra', 'scorpio',
  'sagittarius', 'capricorn', 'aquarius', 'pisces'
] as const;

export type ZodiacSign = typeof VALID_SIGNS[number];

// Valid forecast types
export const VALID_TYPES = ['daily', 'weekly', 'monthly'] as const;

// Helper to get today's date in YYYY-MM-DD format
export const getTodayDate = () => new Date().toISOString().split('T')[0];

export interface HoroscopeData {
  sign: string;
  type: string;
  date: string;
  message: string;
  best_match: string;
  inspirational_quote: string;
  quote_author: string;
  peaceful_thought: string;
  [key: string]: unknown; // Allow additional fields from OpenAI
}

export interface GenerateHoroscopeOptions {
  /** For monthly type: the month-year slug, e.g. "april-2026" */
  month?: string;
}

/**
 * Generate a horoscope using OpenAI for the given sign and type.
 * This is the SINGLE generation function — all callers use this.
 *
 * - Uses buildHoroscopePrompt() with verified quote bank
 * - For monthly type, injects monthly prompt additions (300-500 words)
 * - Validates required fields
 * - Normalizes data types
 * - Filters self-matches from best_match
 * - Validates quote author against approved list
 */
export async function generateHoroscope(sign: string, type: string = 'daily', options: GenerateHoroscopeOptions = {}): Promise<HoroscopeData> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === 'your_openai_api_key_here') {
    throw new Error('OpenAI API key not properly configured');
  }

  const normalizedSign = sign.toLowerCase();
  if (!VALID_SIGNS.includes(normalizedSign as ZodiacSign)) {
    throw new Error(`Invalid sign: ${sign}. Must be one of: ${VALID_SIGNS.join(', ')}`);
  }

  const openai = new OpenAI({ apiKey });
  const today = getTodayDate();
  const philosopher = getPhilosopherAssignment(normalizedSign, today);
  let prompt = buildHoroscopePrompt(normalizedSign, philosopher);

  // For monthly type, inject the monthly prompt additions
  if (type === 'monthly') {
    const monthSlug = options.month;
    if (!monthSlug || !isValidMonthSlug(monthSlug)) {
      throw new Error(`Monthly generation requires a valid month slug. Got: ${monthSlug}`);
    }
    const monthMeta = getMonthMeta(monthSlug)!;
    prompt += buildMonthlyPromptAddition(normalizedSign, monthMeta);
  }

  console.log(`[horoscope-generator] Generating ${normalizedSign} (${type}) with philosopher: ${philosopher}`);

  // Monthly horoscopes require more tokens for 300-500 word messages
  const maxTokens = type === 'monthly' ? 1200 : 800;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini-2024-07-18',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    max_tokens: maxTokens,
  });

  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error('OpenAI returned empty content');
  }

  let horoscopeData: Record<string, unknown>;
  try {
    horoscopeData = JSON.parse(content);
  } catch {
    throw new Error(`OpenAI returned invalid JSON: ${content.substring(0, 200)}`);
  }

  // Validate required fields
  if (!horoscopeData.message || !horoscopeData.inspirational_quote || !horoscopeData.quote_author) {
    throw new Error(`Missing required horoscope fields. Got keys: ${Object.keys(horoscopeData).join(', ')}`);
  }

  // Validate quote author is from approved list
  const quoteAuthor = String(horoscopeData.quote_author);
  if (!VALID_AUTHORS.some(author => quoteAuthor.toLowerCase().includes(author.toLowerCase()))) {
    console.warn(`[horoscope-generator] Invalid quote author: ${quoteAuthor}. Overriding with assigned: ${philosopher}`);
    horoscopeData.quote_author = philosopher;
  }

  // Validate the quote is from our verified bank when possible
  const authorQuotes = VERIFIED_QUOTES[philosopher];
  if (authorQuotes && authorQuotes.length > 0) {
    const quote = String(horoscopeData.inspirational_quote);
    const isVerified = authorQuotes.some(vq =>
      vq.text.toLowerCase() === quote.toLowerCase() ||
      quote.toLowerCase().includes(vq.text.toLowerCase().substring(0, 30))
    );
    if (!isVerified) {
      console.warn(`[horoscope-generator] Quote not from verified bank, replacing: "${quote}"`);
      // Pick the first available quote from the bank as fallback
      const dayNum = Math.floor(new Date().getTime() / (1000 * 60 * 60 * 24));
      horoscopeData.inspirational_quote = authorQuotes[dayNum % authorQuotes.length].text;
    }
  }

  // Ensure sign is not in its own best matches
  if (horoscopeData.best_match) {
    const matchStr = String(horoscopeData.best_match);
    const matches = matchStr.toLowerCase().split(',').map((s: string) => s.trim());
    horoscopeData.best_match = matches
      .filter((match: string) => match !== normalizedSign)
      .join(', ');
  }

  // Normalize data types — ensure lucky_number and lucky_color are strings if present
  if (typeof horoscopeData.lucky_number === 'object' && horoscopeData.lucky_number !== null) {
    const ln = horoscopeData.lucky_number as Record<string, unknown>;
    horoscopeData.lucky_number = String(ln.number || ln.value || '7');
  }
  if (typeof horoscopeData.lucky_color === 'object' && horoscopeData.lucky_color !== null) {
    const lc = horoscopeData.lucky_color as Record<string, unknown>;
    horoscopeData.lucky_color = String(lc.color || lc.value || 'Indigo');
  }

  return {
    sign: normalizedSign,
    type,
    date: today,
    ...horoscopeData,
  } as HoroscopeData;
}
