/**
 * reading:generate — Atomic tool
 *
 * Composes sign profile, format template, and quote bank into a full
 * reading prompt, calls the AI SDK + Gateway via generateObject with a
 * canonical Zod schema, and returns a structured ReadingOutput.
 *
 * Independently callable: takes explicit inputs, no hidden state,
 * no cache dependency, no council selection.
 *
 * Input:  GenerateReadingInput
 * Output: ReadingOutput
 */

import { generateObject, MODELS } from '@/tools/ai/provider';
import { getSignProfile, type SignProfile } from '@/tools/zodiac/sign-profile';
import { getFormatTemplate, type FormatTemplateResult } from '@/tools/reading/format-template';
import { getQuotes, type VerifiedQuote, VALID_AUTHORS } from '@/tools/reading/quote-bank';
import { ReadingOutputModelSchema } from '@/tools/reading/types';
import { VERIFIED_QUOTES } from '@/utils/verified-quotes';

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

export type { ReadingOutput } from '@/tools/reading/types';
import type { ReadingOutput } from '@/tools/reading/types';

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

## WHAT TO INCLUDE (as object fields)
1. **message**: The main horoscope (40-80 words, following the voice and format above)
2. **bestMatch**: 3-4 compatible signs as lowercase comma-separated string (e.g., "aries, gemini, libra")
   - NEVER include ${normalizedSign} in its own matches
   - Fire (aries/leo/sagittarius) pairs with Fire + Air (gemini/libra/aquarius)
   - Earth (taurus/virgo/capricorn) pairs with Earth + Water (cancer/scorpio/pisces)
   - Air pairs with Air + Fire
   - Water pairs with Water + Earth
   ${normalizedSign === 'libra' ? '- MUST include aquarius' : ''}${normalizedSign === 'aquarius' ? '- MUST include libra' : ''}
3. **inspirationalQuote**: ${philosopherInstruction} Copy the quote EXACTLY as provided — do not modify it.
4. **quoteAuthor**: Exact name of the philosopher
5. **peacefulThought**: A 1-2 sentence nighttime wind-down thought. Not generic — make it specific to this sign's energy today. No greeting, no "dear [sign]."`;
}

// ─── Generator ──────────────────────────────────────────────────────────

/**
 * reading:generate
 *
 * Generate a complete reading for a sign with a specific philosopher.
 * Routes through the AI SDK + Gateway via `generateObject` with the
 * canonical `ReadingOutputModelSchema`. Model is pinned to `MODELS.sonnet`
 * (decision recorded in `docs/evals/2026-04-25-baseline.md`).
 *
 * Post-call validators (quote-author allowlist, quote-bank fallback,
 * self-match filter) operate on the schema-validated object — they
 * enforce business rules the schema can't express.
 */
export async function generateReading(input: GenerateReadingInput): Promise<ReadingOutput> {
  const normalizedSign = input.sign.toLowerCase();
  const resolvedDate = input.date ?? new Date().toISOString().split('T')[0];

  const prompt = buildReadingPrompt(input);

  console.log(`[reading:generate] Generating ${normalizedSign} with philosopher: ${input.philosopher}`);

  const { object } = await generateObject({
    model: MODELS.sonnet,
    schema: ReadingOutputModelSchema,
    prompt,
    maxOutputTokens: 800,
  });

  // Soft word-count telemetry. The 40-80 range is a prompt-level instruction,
  // not a hard schema constraint — strict refinement risks flaky throws on
  // otherwise-acceptable output. Log when the model misses the target so
  // compliance can be tracked over time and the schema tightened later if
  // the data supports it.
  const wordCount = object.message.trim().split(/\s+/).length;
  if (wordCount < 40 || wordCount > 80) {
    console.warn(`[reading:generate] message word count out of target range: ${wordCount} (target 40-80)`);
  }

  // Validate quote author against approved list. Non-conformant authors
  // are overridden with the assigned philosopher so the daily card never
  // surfaces an unknown attribution.
  let quoteAuthor = object.quoteAuthor;
  if (!VALID_AUTHORS.some(author => quoteAuthor.toLowerCase().includes(author.toLowerCase()))) {
    console.warn(`[reading:generate] Invalid quote author: ${quoteAuthor}. Overriding with assigned: ${input.philosopher}`);
    quoteAuthor = input.philosopher;
  }

  // Validate quote against the verified-quote bank when one exists for the
  // assigned philosopher. Unverified quotes are replaced with a deterministic
  // pick from the bank (date-seeded) — protects against fabrication.
  let inspirationalQuote = object.inspirationalQuote;
  const authorQuotes = VERIFIED_QUOTES[input.philosopher];
  if (authorQuotes && authorQuotes.length > 0) {
    const isVerified = authorQuotes.some(vq =>
      vq.text.toLowerCase() === inspirationalQuote.toLowerCase() ||
      inspirationalQuote.toLowerCase().includes(vq.text.toLowerCase().substring(0, 30))
    );
    if (!isVerified) {
      console.warn(`[reading:generate] Quote not from verified bank, replacing: "${inspirationalQuote}"`);
      const dayNum = Math.floor(new Date(resolvedDate).getTime() / (1000 * 60 * 60 * 24));
      inspirationalQuote = authorQuotes[dayNum % authorQuotes.length].text;
    }
  }

  // Filter self-matches from bestMatch — Aries shouldn't show "aries" in
  // its own compatibility list. Lowercasing also normalises minor model
  // capitalisation drift.
  const matches = object.bestMatch.toLowerCase().split(',').map(s => s.trim());
  const bestMatch = matches.filter(match => match !== normalizedSign).join(', ');

  return {
    sign: normalizedSign,
    date: resolvedDate,
    philosopher: input.philosopher,
    message: object.message,
    bestMatch,
    inspirationalQuote,
    quoteAuthor,
    peacefulThought: object.peacefulThought,
  };
}
