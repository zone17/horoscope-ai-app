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
import { ReadingOutputModelSchema, type ReadingOutputModel } from '@/tools/reading/types';
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
  /**
   * Optional critique feedback to inject into the prompt for a regeneration.
   * Used by `reading:generate-with-critique` (Phase 1e) — when the judge
   * scores a previous attempt below threshold, the wrapper builds a feedback
   * string from the judge's violations + rationale and passes it here so the
   * model knows what to fix on the retry. Verb stays atomic; the critique
   * loop lives in the wrapper, not here.
   */
  feedback?: string;
}

export type { ReadingOutput } from '@/tools/reading/types';
import type { ReadingOutput } from '@/tools/reading/types';

// ─── Prompt Builder ─────────────────────────────────────────────────────

/**
 * Sanitize the optional `feedback` parameter before interpolating into the
 * prompt template. The feedback is exposed as part of `GenerateReadingInput`
 * for the Phase 1e critique composer, which means any caller — including
 * future callers that route external input through this verb — could pass
 * arbitrary strings here. Defense-in-depth mirrors `judge.ts:sanitizeForPrompt`:
 * strip structural escape chars, drop leading markdown headings, drop
 * horizontal rules, collapse newlines, cap length so a runaway field
 * cannot dilute the rest of the prompt.
 */
function sanitizeFeedback(value: string, maxChars = 4000): string {
  return value
    .replace(/[<>"`]/g, '')
    .replace(/^[ \t]*#{1,6}\s+/gm, '')
    .replace(/^---+$/gm, '')
    .replace(/[\r\n]+/g, ' ')
    .trim()
    .slice(0, maxChars);
}

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
5. **peacefulThought**: A 1-2 sentence nighttime wind-down thought. Not generic — make it specific to this sign's energy today. No greeting, no "dear [sign]."${input.feedback ? `\n\n## CRITIQUE FROM PRIOR ATTEMPT — FIX THESE BEFORE RETURNING\nA previous draft of this reading scored below the quality bar. The judge flagged the issues below. Address each one in this attempt; do not repeat them. The field requirements above remain authoritative — fix the critique while still satisfying every WHAT TO INCLUDE constraint.\n\n${sanitizeFeedback(input.feedback)}` : ''}`;
}

// ─── Generator ──────────────────────────────────────────────────────────

/**
 * Element-based fallback compatibility map. Used when the model produces a
 * `bestMatch` that contains only the user's own sign, leaving the post-filter
 * result empty. Mirrors the prompt's compatibility rules (Fire+Air, Earth+Water,
 * etc.) so the surfaced UI is never blank. Each fallback is the canonical
 * 3-sign list excluding the user's own sign.
 */
const ELEMENT_FALLBACK_MATCHES: Record<string, string> = {
  aries: 'leo, sagittarius, gemini',
  leo: 'aries, sagittarius, gemini',
  sagittarius: 'aries, leo, libra',
  taurus: 'virgo, capricorn, cancer',
  virgo: 'taurus, capricorn, scorpio',
  capricorn: 'taurus, virgo, pisces',
  gemini: 'libra, aquarius, leo',
  libra: 'gemini, aquarius, sagittarius',
  aquarius: 'gemini, libra, aries',
  cancer: 'scorpio, pisces, taurus',
  scorpio: 'cancer, pisces, virgo',
  pisces: 'cancer, scorpio, capricorn',
};

/**
 * Pre-parse normalisation: if the model returns snake_case keys instead of
 * camelCase (a known dialect drift especially around model rotations), map
 * them in. The schema is canonical camelCase, so we just translate before
 * Zod ever sees the payload. Defense-in-depth — the prompt + schema should
 * already produce camelCase, but a single retry-friendly normaliser eliminates
 * a whole class of NoObjectGeneratedError.
 */
function normaliseModelKeys(raw: Record<string, unknown>): Record<string, unknown> {
  const map: Record<string, string> = {
    best_match: 'bestMatch',
    inspirational_quote: 'inspirationalQuote',
    quote_author: 'quoteAuthor',
    peaceful_thought: 'peacefulThought',
  };
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(raw)) {
    out[map[k] ?? k] = v;
  }
  return out;
}

/**
 * Single-retry wrapper around `generateObject`. The Sonnet schema-rejection
 * rate is unknown at PR C merge time and the cron has no second-attempt
 * loop — so a single transient flake (NoObjectGeneratedError, AI_TypeValidationError,
 * or transport-level throttle) would skip a sign for 24h. One retry gates
 * the worst case while keeping cost bounded (≤2 calls per sign).
 *
 * On the second attempt we route through `generateText` and run the model
 * output through `normaliseModelKeys` + Zod ourselves — bypasses any
 * SDK-side strictness that may have rejected on the first call (e.g. tool-call
 * formatting). The retry is explicitly NOT a tighter retry budget; if both
 * fail, propagate the error so the caller (cron, route handler) can decide
 * to surface a 500, fall back to a stale cache, or skip the sign.
 */
async function generateAndValidateOnce(prompt: string) {
  const { object } = await generateObject({
    model: MODELS.sonnet,
    schema: ReadingOutputModelSchema,
    prompt,
    maxOutputTokens: 800,
  });
  return object;
}

async function generateAndValidateRetry(prompt: string) {
  // Retry path: ask the model for raw text, normalise snake_case → camelCase
  // defensively, then schema-parse ourselves. Same model, same prompt, but
  // a different transport mode that bypasses the structured-output enforcement
  // mode the first call may have tripped on.
  const { generateText } = await import('@/tools/ai/provider');
  const { text } = await generateText({
    model: MODELS.sonnet,
    prompt: `${prompt}\n\nReturn ONLY a JSON object — no markdown fences, no commentary.`,
    maxOutputTokens: 800,
  });
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
  const raw = JSON.parse(cleaned) as Record<string, unknown>;
  return ReadingOutputModelSchema.parse(normaliseModelKeys(raw));
}

/**
 * reading:generate
 *
 * Generate a complete reading for a sign with a specific philosopher.
 * Routes through the AI SDK + Gateway via `generateObject` with the
 * canonical `ReadingOutputModelSchema`. Model is pinned to `MODELS.sonnet`
 * (decision recorded in `docs/evals/2026-04-25-baseline.md`).
 *
 * One retry on schema/transport failure (see `generateAndValidateRetry`).
 *
 * Post-call validators (quote-author allowlist, quote-bank fallback,
 * self-match filter, element-based bestMatch fallback) operate on the
 * schema-validated object — they enforce business rules the schema can't
 * express.
 */
export async function generateReading(input: GenerateReadingInput): Promise<ReadingOutput> {
  const normalizedSign = input.sign.toLowerCase();
  const resolvedDate = input.date ?? new Date().toISOString().split('T')[0];

  const prompt = buildReadingPrompt(input);

  console.log(`[reading:generate] Generating ${normalizedSign} with philosopher: ${input.philosopher}`);

  let object: ReadingOutputModel;
  try {
    object = await generateAndValidateOnce(prompt);
  } catch (firstError) {
    console.warn(`[reading:generate] First attempt failed (${(firstError as Error).message}). Retrying via raw-text + manual schema parse.`);
    object = await generateAndValidateRetry(prompt);
  }

  // Soft word-count telemetry. The 40-80 range is a prompt-level instruction,
  // not a hard schema constraint — strict refinement risks flaky throws on
  // otherwise-acceptable output. Log when the model misses the target so
  // compliance can be tracked over time and the schema tightened later if
  // the data supports it.
  const trimmed = object.message.trim();
  const wordCount = trimmed === '' ? 0 : trimmed.split(/\s+/).length;
  if (wordCount < 40 || wordCount > 80) {
    console.warn(`[reading:generate] message word count out of target range: ${wordCount} (target 40-80)`);
  }

  // Override unknown attributions — UX guarantee that the daily card never
  // surfaces an unrecognised author.
  let quoteAuthor = object.quoteAuthor;
  if (!VALID_AUTHORS.some(author => quoteAuthor.toLowerCase().includes(author.toLowerCase()))) {
    console.warn(`[reading:generate] Invalid quote author: ${quoteAuthor}. Overriding with assigned: ${input.philosopher}`);
    quoteAuthor = input.philosopher;
  }

  // Replace fabricated quotes with a deterministic pick from the verified bank
  // when bank coverage exists for this philosopher. Date-seeded so the same
  // (philosopher, date) deterministically picks the same fallback quote.
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

  // Lowercase normalises model capitalisation drift; filter prevents the
  // sign listing itself in its own compatibility row. If the model only
  // returned the user's own sign, the filter would leave an empty string
  // — fall back to the canonical element-based compatibility list so the
  // UI never renders a blank "Best matches:" row.
  const matches = object.bestMatch.toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
  const filtered = matches.filter(match => match !== normalizedSign);
  let bestMatch = filtered.join(', ');
  if (bestMatch === '') {
    console.warn(`[reading:generate] bestMatch empty after self-filter (model returned: "${object.bestMatch}"). Falling back to element-based default.`);
    bestMatch = ELEMENT_FALLBACK_MATCHES[normalizedSign] ?? '';
  }

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
