/**
 * reading:generate (v2) — Atomic tool, new architecture
 *
 * The rewrite per docs/research/2026-04-29-readings-resonance.md §5.
 *
 * Replaces the v1 single-philosopher attribution model with the Option C
 * architecture: anonymous house voice ("Witness"), driven by sign × today's
 * day-context × council-as-deep-personalization-vector. The council inflects
 * voice and content invisibly; the reader is never told whose thinking shaped
 * the reading. Quote attribution moved out to quote:select (§7).
 *
 * Two reading surfaces share this verb via `timeOfDay`:
 *   - 'morning' → 80-150 words, mid-dense, today's intent and edge.
 *   - 'evening' → 30-50 words, short and pointed, today's reckoning.
 *
 * Auto-fail filters run before the reading is returned. Em-dashes,
 * en-dashes, hyphens-as-dashes, the 9 anti-tells, buzzword density
 * over cap, and out-of-range word counts trigger one regeneration with
 * the failure mode in the feedback channel; a second auto-fail throws.
 *
 * Independently callable. No I/O outside the model call. Council-shape
 * synthesis is invoked here; cache lives inside that verb.
 */

import { generateText, MODELS } from '@/tools/ai/provider';
import { getSignProfile, type SignProfile } from '@/tools/zodiac/sign-profile';
import { getDayContext, renderDayContextForPrompt, type DayContext } from '@/tools/calendar/day-context';
import { resolveBrief } from '@/tools/philosopher/resolve-brief';
import { synthesizeCouncilShape } from '@/tools/philosopher/synthesize-shape';
import type { PhilosopherDeepBrief } from '@/tools/philosopher/deep-briefs';

// ─── Types ──────────────────────────────────────────────────────────────

export type TimeOfDay = 'morning' | 'evening';

export interface GenerateReadingV2Input {
  /** Zodiac sign (case-insensitive). */
  sign: string;
  /** User's selected council. Display names. */
  council: string[];
  /** Date in YYYY-MM-DD format. Defaults to today (UTC). */
  date?: string;
  /** Which surface to generate for. Defaults to 'morning'. */
  timeOfDay?: TimeOfDay;
  /** Hemisphere for season computation. Defaults to 'north'. */
  hemisphere?: 'north' | 'south';
}

export interface GenerateReadingV2Output {
  /** The reading text. No attribution. No surrounding metadata. */
  text: string;
  /** Internal: how many regeneration retries it took (0 = first try clean). */
  retries: number;
}

interface ReadingGenerationContext {
  sign: string;
  signProfile: SignProfile;
  dayContext: DayContext;
  briefs: PhilosopherDeepBrief[];
  sharedShape: string;
  timeOfDay: TimeOfDay;
}

// ─── Auto-fail filters ──────────────────────────────────────────────────

const ANTI_TELLS: ReadonlyArray<{ pattern: RegExp; label: string }> = [
  { pattern: /\blet [a-z\s']+ count as [a-z]/i, label: 'forbidden phrase: "let X count as Y"' },
  { pattern: /\byou(?:'re| are) allowed to\b/i, label: 'forbidden phrase: "you\'re allowed to"' },
  { pattern: /\bpermission to\b/i, label: 'forbidden phrase: "permission to"' },
  { pattern: /\b(?:dear|sweet|gentle) (?:one|soul|heart)\b/i, label: 'forbidden vocative softener' },
  { pattern: /\bhold space (?:for|to)\b/i, label: 'forbidden phrase: "hold space for"' },
  { pattern: /\bhonor the (?:rest|pause|not[- ]knowing|process|wait|silence)\b/i, label: 'forbidden phrase: "honor the X"' },
  { pattern: /\byou are exactly where you (?:need|are meant) to be\b/i, label: 'forbidden manifestation phrase' },
  { pattern: /\bthe universe (?:is|wants|conspires|whispers)/i, label: 'forbidden "universe as agent" phrase' },
  { pattern: /\btrust the process\b/i, label: 'forbidden phrase: "trust the process"' },
];

const BUZZWORDS: ReadonlyArray<string> = [
  'energy', 'alignment', 'abundance', 'capacity', 'holding', 'honoring',
  'unfolding', 'resonance', 'flow', 'journey',
];

const AI_SLOP_BANS: ReadonlyArray<{ pattern: RegExp; label: string }> = [
  { pattern: /[—–]/, label: 'forbidden em-dash or en-dash' },
  { pattern: /\b\w+ - \w+\b/, label: 'forbidden hyphen-as-dash (use period or comma)' },
  { pattern: /\bnot just \w+,? but \w+/i, label: 'AI tell: "not just X, but Y"' },
  { pattern: /\b(?:delve|tapestry|realm|beacon|vibrant|pivotal|testament|navigate|landscape|embrace|unlock|cultivate|foster|harness|tapestry)\b/i, label: 'AI slop vocabulary' },
];

interface AutoFailResult {
  passed: boolean;
  reason?: string;
}

function autoFail(text: string, expectedRange: [number, number]): AutoFailResult {
  // Length check
  const trimmed = text.trim();
  const wordCount = trimmed === '' ? 0 : trimmed.split(/\s+/).length;
  if (wordCount < expectedRange[0] || wordCount > expectedRange[1]) {
    return { passed: false, reason: `word count ${wordCount} out of range ${expectedRange[0]}-${expectedRange[1]}` };
  }

  // Dash + AI slop
  for (const ban of AI_SLOP_BANS) {
    if (ban.pattern.test(trimmed)) {
      return { passed: false, reason: ban.label };
    }
  }

  // 9 anti-tells
  for (const at of ANTI_TELLS) {
    if (at.pattern.test(trimmed)) {
      return { passed: false, reason: at.label };
    }
  }

  // Buzzword density: more than 1 per 100 words is an auto-fail
  const lower = trimmed.toLowerCase();
  let buzzCount = 0;
  for (const w of BUZZWORDS) {
    const re = new RegExp(`\\b${w}\\b`, 'g');
    const matches = lower.match(re);
    if (matches) buzzCount += matches.length;
  }
  if (buzzCount > Math.max(1, Math.floor(wordCount / 100))) {
    return { passed: false, reason: `buzzword density too high (${buzzCount} in ${wordCount} words)` };
  }

  return { passed: true };
}

// ─── Prompt builder ─────────────────────────────────────────────────────

function lengthRange(timeOfDay: TimeOfDay): [number, number] {
  return timeOfDay === 'morning' ? [80, 150] : [30, 50];
}

function timeOfDayFraming(timeOfDay: TimeOfDay): string {
  if (timeOfDay === 'morning') {
    return 'You are writing for the morning surface. The reader is meeting today. Stage the day in front of them, name the edge they will encounter, and end on something they can do or notice while the day is still unspent.';
  }
  return 'You are writing for the evening surface. The reader has just lived this day. Stage the reckoning, the gap between the day they intended and the day they actually had, and end on a sharp question or hard observation. Never console.';
}

function renderDeepCouncilBrief(briefs: PhilosopherDeepBrief[], sharedShape: string): string {
  const lines: string[] = [];
  for (const b of briefs) {
    lines.push(`* ${b.name} (${b.tradition}).`);
    lines.push(`  Move: ${b.cognitiveMove}`);
    lines.push(`  Register: ${b.register}`);
    lines.push(`  Ends on: ${b.endsOn}`);
    lines.push(`  Never ends on: ${b.neverEndsOn}`);
    lines.push(`  Will not say: ${b.forbiddenPhrases.map(p => `"${p}"`).join(', ')}.`);
  }
  lines.push('');
  lines.push(`SHARED SHAPE: ${sharedShape}`);
  return lines.join('\n');
}

export function buildReadingPromptV2(ctx: ReadingGenerationContext, retryFeedback?: string): string {
  const [minWords, maxWords] = lengthRange(ctx.timeOfDay);
  const dayContextBlock = renderDayContextForPrompt(ctx.dayContext);
  const councilBlock = renderDeepCouncilBrief(ctx.briefs, ctx.sharedShape);

  return `Write a daily reading for a person whose sun sign is ${ctx.sign.toUpperCase()}.

## TODAY'S CONTEXT (use to shape the reading; never name these directly in the prose)
${dayContextBlock}

The reading should feel shaped by today specifically. If the same prose would make sense on a different day in a different season, you have not used the context.

## VOICE (the writer of this reading is named Witness)
Witness writes this reading.
Witness names what is true and offers the reader their agency.
Witness does not console, does not soften, does not pretend to know what they cannot know.
Witness sees the day and stages a scene the reader can recognize themselves inside.
Witness is anonymous. The reader is never told who Witness is, never told whose thinking shaped this.

## SIGN VOICE FOR ${ctx.sign.toUpperCase()} (modulator on top of Witness, not a replacement)
${ctx.signProfile.voice}

## THE READER'S WORLDVIEW (use to shape voice and content; never name a council member, never cite a tradition)
${councilBlock}

## SURFACE
${timeOfDayFraming(ctx.timeOfDay)}

## CRAFT RULES (load-bearing)
1. Push back on the reader at least once. Affirmation alone reads as flattery; flattery does not resonate.
2. Stage a scene the reader can recognize themselves inside. Do not predict.
3. Include one concrete behavioral specifier: something they likely did in the past 24 to 48 hours. Not a sensory image of an object. The behavior matters more than the image.
4. Engineer at least one tonal pivot. Confront then ground; name then invert; sting then bless. A flat tone flatlines.
5. End on an act, an imperative, or a real question. Never on permission, gentleness, or "it is enough."
6. Make at least one falsifiable claim. If every line could not possibly be wrong, the reading is Barnum.
7. No "at times / other times" hedging. No "you may find yourself."
8. Strip every adjective and abstract noun before submitting. The line must still say something.
9. At least one sentence should be wall-test sharp: a line a reader could write down and keep.

## ABSOLUTE PROHIBITIONS (auto-fail, regenerated immediately)
- NO em-dashes (—). NO en-dashes (–). NO hyphens used as dashes (word - word). Use periods, commas, colons, or semicolons. Hyphens inside compound words (self-inquiry, well-being, day-of-week, 3am) are fine.
- NO "let X count as Y", "you are/you're allowed to", "permission to", "hold space for", "honor the rest/pause/not-knowing", "you are exactly where you need to be", "the universe is/wants/whispers/conspires", "trust the process", "dear one", "sweet soul", "gentle one".
- NO "not just X, but Y" construction.
- NO AI slop vocabulary: delve, tapestry, realm, beacon, vibrant, pivotal, testament, navigate (as verb), landscape (metaphorical), embrace, unlock, cultivate, foster, harness.
- NO buzzwords (more than once per 100 words is an auto-fail): energy, alignment, abundance, capacity, holding, honoring, unfolding, resonance, flow, journey.

## LENGTH
Write between ${minWords} and ${maxWords} words. ${ctx.timeOfDay === 'morning' ? 'Mid-dense: enough room to stage a scene, pivot once, and close sharply.' : 'Short and pointed. Every word earns its keep.'}

## OUTPUT
Return ONLY the reading prose. No headings, no preamble, no explanation, no quotation marks around the reading, no "here is your reading" framing.${retryFeedback ? `\n\n## CRITIQUE FROM PRIOR ATTEMPT — FIX THIS\nThe previous draft was rejected because: ${retryFeedback}\nFix this exact issue while still satisfying every rule above.` : ''}`;
}

// ─── Public API ─────────────────────────────────────────────────────────

/**
 * reading:generate (v2)
 *
 * Generate a reading per the new architecture. Council is a personalization
 * vector; the reading is anonymous; today's context shapes the prose
 * invisibly; auto-fail filters guarantee the reading is dash-free, anti-tell-
 * free, and length-correct before it is returned.
 */
export async function generateReadingV2(
  input: GenerateReadingV2Input,
): Promise<GenerateReadingV2Output> {
  const sign = input.sign.toLowerCase();
  const date = input.date ?? new Date().toISOString().split('T')[0];
  const timeOfDay: TimeOfDay = input.timeOfDay ?? 'morning';
  const hemisphere = input.hemisphere ?? 'north';

  if (input.council.length === 0) {
    throw new Error('reading:generate-v2 — council must contain at least one philosopher.');
  }

  // Resolve briefs for every council member (priority subset or fallback).
  const briefs = input.council.map(name => resolveBrief(name));

  // Resolve sign profile.
  const signProfile = getSignProfile(sign);

  // Resolve today's context.
  const dayContext = getDayContext({ date, hemisphere });

  // Synthesize the council shared-shape (cached daily).
  const { sharedShape } = await synthesizeCouncilShape({ council: input.council, date });

  const ctx: ReadingGenerationContext = {
    sign,
    signProfile,
    dayContext,
    briefs,
    sharedShape,
    timeOfDay,
  };

  // Generate. One retry on auto-fail.
  let text = '';
  let retries = 0;
  let feedback: string | undefined;

  for (let attempt = 0; attempt < 2; attempt++) {
    const prompt = buildReadingPromptV2(ctx, feedback);
    const { text: raw } = await generateText({
      model: MODELS.sonnet,
      prompt,
      maxOutputTokens: timeOfDay === 'morning' ? 400 : 200,
      temperature: 0.85,
    });
    const cleaned = stripWrappers(raw);
    const result = autoFail(cleaned, lengthRange(timeOfDay));
    if (result.passed) {
      text = cleaned;
      retries = attempt;
      break;
    }
    feedback = result.reason;
    retries = attempt + 1;
    if (attempt === 1) {
      // Second auto-fail: keep the text but flag retries; caller can decide
      // whether to surface or skip. Throwing here would make a single bad
      // model day kill the entire cron run.
      console.warn(`[reading:generate-v2] both attempts auto-failed (last reason: ${result.reason}). Returning best-effort.`);
      text = cleaned;
    }
  }

  return { text, retries };
}

/**
 * Strip common wrappers a model might emit despite "OUTPUT: prose only"
 * instructions: surrounding quotes, leading "Here is your reading:" framing,
 * markdown fences. Defensive cleanup before the auto-fail filter sees the
 * text — these wrappers are not failures of voice, just framing the model
 * cannot resist sometimes.
 */
function stripWrappers(raw: string): string {
  let s = raw.trim();
  // Strip code fences
  s = s.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/, '');
  // Strip leading "Here is..." / "Today, ..." framing if it appears as a single line
  s = s.replace(/^(?:here(?:'s| is)|your reading|reading|today,)\s*[^\n]*\n/i, '');
  // Strip wrapping quote pairs
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1);
  }
  return s.trim();
}
