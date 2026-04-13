/**
 * reading:generate — Atomic tool
 *
 * Composes sign profile, format template, and quote bank into a full
 * reading prompt, calls OpenAI, and returns a structured ReadingOutput.
 *
 * Independently callable: takes explicit inputs, no hidden state,
 * no cache dependency, no council selection.
 *
 * Input:  GenerateReadingInput
 * Output: ReadingOutput
 */

import OpenAI from 'openai';
import { getSignProfile, type SignProfile } from '@/tools/zodiac/sign-profile';
import { getFormatTemplate, type FormatTemplateResult } from '@/tools/reading/format-template';
import { getQuotes, type VerifiedQuote } from '@/tools/reading/quote-bank';
import { lookupPhilosopher } from '@/tools/philosopher/registry';
import { VERIFIED_QUOTES } from '@/utils/verified-quotes';
import { VALID_AUTHORS } from '@/utils/horoscope-prompts';

// ─── Types ──────────────────────────────────────────────────────────────

export interface GenerateReadingInput {
  /** Zodiac sign (case-insensitive) */
  sign: string;
  /** Assigned philosopher for this reading */
  philosopher: string;
  /** Writing format structure (optional — auto-assigned from rotation if missing) */
  format?: string;
  /** Date in YYYY-MM-DD format (defaults to today) */
  date?: string;
}

export interface ReadingOutput {
  sign: string;
  date: string;
  philosopher: string;
  message: string;
  bestMatch: string;
  inspirationalQuote: string;
  quoteAuthor: string;
  peacefulThought: string;
}

// ─── Prompt Builder ─────────────────────────────────────────────────────

/**
 * reading:build-prompt
 *
 * Build the full reading prompt from atomic tool outputs.
 * Exported separately so other tools can inspect/modify prompts
 * without triggering generation.
 */
export function buildReadingPrompt(input: GenerateReadingInput): string {
  const normalizedSign = input.sign.toLowerCase();
  const resolvedDate = input.date ?? new Date().toISOString().split('T')[0];

  // 1. Sign profile
  const profile: SignProfile = getSignProfile(normalizedSign);

  // 2. Writing format
  let writingFormat: string;
  if (input.format) {
    writingFormat = input.format;
  } else {
    const template: FormatTemplateResult = getFormatTemplate(normalizedSign, resolvedDate);
    writingFormat = template.structure;
  }

  // 3. Verified quotes
  const quotes: VerifiedQuote[] = getQuotes(input.philosopher, {
    count: 4,
    dateSeed: resolvedDate,
  });

  // 4. Build philosopher instruction + quote bank section
  let philosopherInstruction: string;
  let quoteBankSection: string;

  if (quotes.length > 0) {
    philosopherInstruction = `You MUST use one of the verified quotes below from ${input.philosopher}. Do NOT invent or recall quotes from memory.`;
    quoteBankSection = `\n## VERIFIED QUOTE BANK (pick the most relevant one)\nPhilosopher: ${input.philosopher}\n${quotes.map((q, i) => `${i + 1}. "${q.text}"`).join('\n')}\n\nYou MUST select one of these exact quotes. Do NOT modify, paraphrase, or generate a different quote.`;
  } else {
    philosopherInstruction = `Use a quote from ${input.philosopher} specifically.`;
    quoteBankSection = '';
  }

  // 5. Assemble the prompt — preserves the exact structure from buildHoroscopePrompt
  return `Write a daily horoscope for ${normalizedSign.toUpperCase()}. This is not fortune-telling — it's philosophical guidance that feels personally written for someone born under this sign.

## SOUL
Every reading comes from a place of open heart, open mind, and genuine belief in the best of humanity. You see the reader as capable, worthy, and already on their way. You meet them where they are without judgment. You ask questions instead of making declarations. You present ideas, not commandments. You acknowledge hard days but never lose faith in people. This is grounded optimism — not naive, not preachy, not performative.

## YOUR VOICE FOR ${normalizedSign.toUpperCase()}
${profile.voice}

## HARD RULES
${profile.avoidPatterns}
- NEVER use the phrase "dear [sign]" or any greeting format
- NEVER start with "Today, [sign]..."
- NEVER use "tapestry", "canvas", "journey", "embrace", "navigate", or "celestial"
- NEVER use flowery filler phrases like "the cosmos has aligned" or "the universe whispers"
- Write like a real human being, not a horoscope generator
- The reader should feel like this was written specifically for THEIR sign, not copy-pasted with the sign name swapped in
- Keep the message between 40-80 words. Quality over quantity.
- NEVER be preachy, condescending, or lecture-like
- NEVER use hollow affirmations ("you are enough", "you've got this")
- Write like a thoughtful friend, not a life coach or therapist
- The reader should feel seen, not marketed to

## WRITING FORMAT FOR TODAY
${writingFormat}
- Your opening sentence should be a direct, specific insight — not a buildup. AI search engines surface concise opening lines.

## ${profile.exampleOpener}
${quoteBankSection}

## WHAT TO INCLUDE (as JSON fields)
1. **message**: The main horoscope (40-80 words, following the voice and format above)
2. **best_match**: 3-4 compatible signs as lowercase comma-separated string (e.g., "aries, gemini, libra")
   - NEVER include ${normalizedSign} in its own matches
   - Fire (aries/leo/sagittarius) pairs with Fire + Air (gemini/libra/aquarius)
   - Earth (taurus/virgo/capricorn) pairs with Earth + Water (cancer/scorpio/pisces)
   - Air pairs with Air + Fire
   - Water pairs with Water + Earth
   ${normalizedSign === 'libra' ? '- MUST include aquarius' : ''}${normalizedSign === 'aquarius' ? '- MUST include libra' : ''}
3. **inspirational_quote**: ${philosopherInstruction} Copy the quote EXACTLY as provided — do not modify it.
4. **quote_author**: Exact name of the philosopher
5. **peaceful_thought**: A 1-2 sentence nighttime wind-down thought. Not generic — make it specific to this sign's energy today. No greeting, no "dear [sign]."

Respond ONLY with valid JSON.`;
}

// ─── Generator ──────────────────────────────────────────────────────────

/**
 * reading:generate
 *
 * Generate a complete reading for a sign with a specific philosopher.
 * Calls OpenAI, parses the response, validates the output.
 */
export async function generateReading(input: GenerateReadingInput): Promise<ReadingOutput> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === 'your_openai_api_key_here') {
    throw new Error('OpenAI API key not properly configured');
  }

  const normalizedSign = input.sign.toLowerCase();
  const resolvedDate = input.date ?? new Date().toISOString().split('T')[0];

  // Build the prompt from atomic tools
  const prompt = buildReadingPrompt(input);

  console.log(`[reading:generate] Generating ${normalizedSign} with philosopher: ${input.philosopher}`);

  const openai = new OpenAI({ apiKey });

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini-2024-07-18',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    max_tokens: 800,
  });

  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error('OpenAI returned empty content');
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error(`OpenAI returned invalid JSON: ${content.substring(0, 200)}`);
  }

  // Validate required fields
  if (!parsed.message || !parsed.inspirational_quote || !parsed.quote_author) {
    throw new Error(
      `Missing required reading fields. Got keys: ${Object.keys(parsed).join(', ')}`
    );
  }

  // Validate quote author against approved list
  const quoteAuthor = String(parsed.quote_author);
  if (!VALID_AUTHORS.some(author => quoteAuthor.toLowerCase().includes(author.toLowerCase()))) {
    console.warn(`[reading:generate] Invalid quote author: ${quoteAuthor}. Overriding with assigned: ${input.philosopher}`);
    parsed.quote_author = input.philosopher;
  }

  // Validate quote is from verified bank when available
  const authorQuotes = VERIFIED_QUOTES[input.philosopher];
  if (authorQuotes && authorQuotes.length > 0) {
    const quote = String(parsed.inspirational_quote);
    const isVerified = authorQuotes.some(vq =>
      vq.text.toLowerCase() === quote.toLowerCase() ||
      quote.toLowerCase().includes(vq.text.toLowerCase().substring(0, 30))
    );
    if (!isVerified) {
      console.warn(`[reading:generate] Quote not from verified bank, replacing: "${quote}"`);
      const dayNum = Math.floor(new Date(resolvedDate).getTime() / (1000 * 60 * 60 * 24));
      parsed.inspirational_quote = authorQuotes[dayNum % authorQuotes.length].text;
    }
  }

  // Filter self-matches from best_match
  let bestMatch = String(parsed.best_match || '');
  if (bestMatch) {
    const matches = bestMatch.toLowerCase().split(',').map(s => s.trim());
    bestMatch = matches.filter(match => match !== normalizedSign).join(', ');
  }

  return {
    sign: normalizedSign,
    date: resolvedDate,
    philosopher: input.philosopher,
    message: String(parsed.message),
    bestMatch,
    inspirationalQuote: String(parsed.inspirational_quote),
    quoteAuthor: String(parsed.quote_author),
    peacefulThought: String(parsed.peaceful_thought || ''),
  };
}
