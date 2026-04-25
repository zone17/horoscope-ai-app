/**
 * reading:judge — Atomic tool
 *
 * Scores a generated reading against the project's authenticity criteria:
 * voice authenticity (per sign profile), anti-Barnum, anti-template,
 * quote fidelity (catches plausible-sounding fabrications the bank-validator
 * silently masks), and an overall holistic score.
 *
 * Pure verb: one model call via the AI SDK + Gateway, no I/O beyond that.
 * Composable: callers compose this with reading:generate to build critique
 * loops (Phase 1e). Does NOT mutate or feed back into the reading itself.
 *
 * Model is pinned to MODELS.haiku — cost guardrail. The judge is invoked at
 * baseline-eval scale (144x) and at runtime in critique loops; Haiku keeps
 * both paths cheap. Cross-family bias against gpt-4o-mini and Sonnet/Opus
 * is acknowledged in the baseline summary (judge ≠ candidate).
 *
 * Input:  JudgeReadingInput
 * Output: JudgeResult
 */

import { z } from 'zod';
import { generateObject, MODELS } from '@/tools/ai/provider';
import { getSignProfile } from '@/tools/zodiac/sign-profile';
import type { ReadingOutput } from '@/tools/reading/types';

// ─── Types ──────────────────────────────────────────────────────────────

export interface JudgeReadingInput {
  /** The reading to evaluate. Subset of ReadingOutput is acceptable. */
  reading: Pick<
    ReadingOutput,
    'message' | 'inspirationalQuote' | 'quoteAuthor' | 'peacefulThought'
  >;
  /** Zodiac sign the reading was written for (case-insensitive). */
  sign: string;
  /** Philosopher whose register the reading should reflect. */
  philosopher: string;
}

const JudgeResultSchema = z.object({
  scores: z.object({
    voiceAuthenticity: z.number().int().min(1).max(5),
    antiBarnum: z.number().int().min(1).max(5),
    antiTemplate: z.number().int().min(1).max(5),
    quoteFidelity: z.number().int().min(1).max(5),
    overall: z.number().int().min(1).max(5),
  }),
  violations: z.array(z.string()),
  rationale: z.string(),
});

export type JudgeResult = z.infer<typeof JudgeResultSchema>;

// ─── Criteria (encoded once, used across baseline + future critique loop) ──

/**
 * Banned words and phrases from docs/PROJECT_CONTEXT.md §4 ("Global Banned
 * Words/Phrases"). Centralised here so the judge prompt and any future
 * lint pass share one source of truth.
 */
export const BANNED_WORDS = [
  'tapestry', 'canvas', 'journey', 'embrace', 'navigate', 'celestial',
  'radiant', 'vibrant', 'manifest', 'align', 'alignment', 'resonate',
  'ignite', 'illuminate', 'nurture', 'unfold',
] as const;

export const BANNED_PHRASES = [
  'Dear ', 'As ', 'the cosmos has aligned', 'the universe whispers',
] as const;

/**
 * Astrology-template tropes from docs/HANDOFF.md §12 Pitfall #15. The
 * anti-template moat lives or dies by catching these.
 */
export const ASTROLOGY_TROPES = [
  'as the new moon rises', 'the cosmos whispers', 'set your intentions',
  'under this celestial alignment', 'the universe is asking',
  'cosmic energy', 'celestial dance',
] as const;

// ─── Prompt builder ─────────────────────────────────────────────────────

/**
 * Exported for tests and for future composition (e.g., showing the judge's
 * criteria in an MCP App or admin surface).
 */
export function buildJudgePrompt(input: JudgeReadingInput): string {
  const normalizedSign = input.sign.toLowerCase();
  const profile = getSignProfile(normalizedSign);

  return `You are a critical evaluator for a philosophy-engine product whose moat is anti-template, philosopher-grounded, voice-authentic prose. Score the reading below on five axes. Be honest — high scores must be earned, not given.

## THE READING (for ${normalizedSign.toUpperCase()}, in the register of ${input.philosopher})

Message:
"""
${input.reading.message}
"""

Inspirational quote (attributed to ${input.reading.quoteAuthor}):
"${input.reading.inspirationalQuote}"

Peaceful thought:
"${input.reading.peacefulThought}"

## SCORING CRITERIA (each axis 1-5; 5 = excellent, 1 = fails the moat)

### voiceAuthenticity (1-5)
Does the message match this sign's documented voice?
Sign: ${normalizedSign.toUpperCase()} (${profile.element})
Voice: ${profile.voice}
Avoid: ${profile.avoidPatterns}

5 = the voice is unmistakable; could not have been written for another sign without rewriting.
3 = recognisable but generic; could be lightly retargeted to a sibling sign.
1 = sign-agnostic; the sign name is the only thing tying it to this profile.

### antiBarnum (1-5)
Could this reading apply to anyone, on any day?
Barnum patterns to flag: vague universal statements ("you sometimes feel"), unfalsifiable claims ("deep down you know"), emotional generalities that fit anyone.

5 = specific, concrete, would not fit a randomly-chosen reader.
3 = mostly specific with one or two universal sentences.
1 = a horoscope cliché; would land for any reader on any day.

### antiTemplate (1-5)
Free of horoscope-template clichés?
Banned words (presence is a strong negative signal): ${BANNED_WORDS.join(', ')}.
Banned phrases: ${BANNED_PHRASES.join(', ')}.
Astrology-template tropes (presence is a strong negative signal): ${ASTROLOGY_TROPES.join(', ')}.

5 = no banned words, no astrology-template language anywhere.
3 = one or two banned words used naturally; no template tropes.
1 = template tropes present, multiple banned words, reads as horoscope-by-numbers.

### quoteFidelity (1-5)
Does the inspirational quote feel like something ${input.philosopher} would actually say in their register and vocabulary?
This catches plausible-sounding fabrications. Score on register match — even verified quotes can feel mismatched if the surrounding reading flattens them.

5 = unmistakably ${input.philosopher}'s voice and concerns.
3 = could be them, could be a generic wisdom-philosopher quote.
1 = stylistically wrong for ${input.philosopher}; sounds AI-generated or generic.

### overall (1-5)
Holistic judgement: would you ship this to a paying user as a philosophy-grounded daily reading? 5 = yes, gladly. 1 = no, this damages the product.

## OUTPUT
Return JSON matching the schema. Populate \`violations\` with specific phrase-level findings (the exact offending words or sentences, not abstract critiques). Keep \`rationale\` to 1-3 sentences explaining the dominant scoring drivers.`;
}

// ─── Judge ──────────────────────────────────────────────────────────────

export async function judgeReading(input: JudgeReadingInput): Promise<JudgeResult> {
  const prompt = buildJudgePrompt(input);

  const { object } = await generateObject({
    model: MODELS.haiku,
    schema: JudgeResultSchema,
    prompt,
    // Temperature low — we want consistent scoring across the same input.
    // Not zero — full determinism on a critique task tends to anchor on the
    // first few tokens and miss nuanced violations.
    temperature: 0.2,
    maxOutputTokens: 800,
  });

  return object;
}
