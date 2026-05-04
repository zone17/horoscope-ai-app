/**
 * council:synthesize-shape — Atomic tool
 *
 * One Haiku call that takes a user's council (with each member's deep brief)
 * and returns one sentence synthesizing what they share. Used by
 * reading:generate as the closing block of the deep council brief.
 *
 * Per docs/research/2026-04-29-readings-resonance.md §11.4 the operator
 * chose dynamic synthesis with a daily TTL cache rather than a static
 * archetype table. Each (council-composition, date) tuple is computed
 * once per day; the cache organically grows into the council-shape table
 * we would otherwise hand-write.
 *
 * Cache:
 *   key:  council-shape:v1:{sortedCouncilSlugsHash}:{date}
 *   ttl:  ~25 hours (refreshes daily; survives a slightly-late next-day call)
 *
 * Falls back to deterministic generation (no cache) when Redis is
 * unavailable — keeps local dev and CI from being blocked on cache.
 *
 * Input:  SynthesizeShapeInput
 * Output: SynthesizeShapeOutput
 */

import { createHash } from 'crypto';
import { generateText, MODELS } from '@/tools/ai/provider';
import { DEEP_BRIEFS, type PhilosopherDeepBrief } from '@/tools/philosopher/deep-briefs';

// ─── Types ──────────────────────────────────────────────────────────────

export interface SynthesizeShapeInput {
  /** Council member display names. */
  council: string[];
  /** Date in YYYY-MM-DD format. Used in the cache key so the synthesis
   *  refreshes daily even for the same council. */
  date: string;
}

export interface SynthesizeShapeOutput {
  /**
   * One sentence describing what this council shares. Used verbatim in
   * the reading prompt as the "what this council shares" line.
   */
  sharedShape: string;
  /** Whether this came from cache or was freshly synthesized. */
  cached: boolean;
}

// ─── Cache key ──────────────────────────────────────────────────────────

const CACHE_VERSION = 'v1';
const CACHE_TTL_SECONDS = 60 * 60 * 25; // 25 hours

function buildCacheKey(council: string[], date: string): string {
  const normalized = [...council]
    .map(p => p.toLowerCase().trim())
    .sort()
    .join('|');
  const digest = createHash('sha256').update(normalized).digest('hex').slice(0, 16);
  return `council-shape:${CACHE_VERSION}:${digest}:${date}`;
}

// ─── Brief lookup helpers ───────────────────────────────────────────────

/**
 * Resolve a council member display name to its deep brief, by trying
 * a name-to-slug match. Returns undefined when the philosopher is not
 * yet in the priority subset — caller's responsibility to handle.
 */
function lookupBriefByName(name: string): PhilosopherDeepBrief | undefined {
  const target = name.toLowerCase().trim();
  for (const brief of Object.values(DEEP_BRIEFS)) {
    if (brief.name.toLowerCase() === target) return brief;
    if (brief.slug.replace(/_/g, ' ') === target) return brief;
  }
  return undefined;
}

// ─── Prompt ─────────────────────────────────────────────────────────────

function buildPrompt(briefs: PhilosopherDeepBrief[], unknownNames: string[]): string {
  const lines: string[] = [
    'You are synthesizing a council of thinkers into ONE sentence that captures what they share.',
    '',
    'A user has selected the following thinkers as their philosophical council. Their collective worldview will shape a daily reading written for someone who thinks with these voices.',
    '',
    'COUNCIL:',
  ];

  for (const b of briefs) {
    lines.push(`- ${b.name} (${b.tradition}). Move: ${b.cognitiveMove}`);
  }
  for (const name of unknownNames) {
    lines.push(`- ${name} (tradition not yet detailed in the brief; treat as a council member whose presence is felt as a general philosophical inflection)`);
  }

  lines.push('');
  lines.push('YOUR TASK: Write ONE sentence (max 25 words) describing what this council shares.');
  lines.push('');
  lines.push('Format constraints:');
  lines.push('- Start with a verb of orientation (e.g. "Pushes toward", "Refuses", "Returns to", "Holds", "Insists on", "Walks into").');
  lines.push('- Name the shared cognitive direction, not a list of attributes.');
  lines.push('- End with what the reader of this council wants from a daily reading. Frame it concretely.');
  lines.push('- Plain language. No buzzwords (no "energy", "alignment", "consciousness", "vibration", "abundance", "flow").');
  lines.push('- No em-dashes. No en-dashes. Use periods, commas, colons, or semicolons.');
  lines.push('- Output ONLY the sentence. No preamble, no quotation marks, no explanation.');
  lines.push('');
  lines.push('Examples of good shared-shape sentences:');
  lines.push('"Pushes toward the present, the proportionate, the practiced. The reader wants advice that holds up at 3am."');
  lines.push('"Refuses comfort, refuses received wisdom, demands authenticity at the cost of ease. The reader wants the question that won\'t let them sleep."');
  lines.push('"Returns repeatedly to the witness, the underlying field, the unforced. The reader wants the noticing that dissolves the problem rather than solving it."');

  return lines.join('\n');
}

function deterministicFallback(briefs: PhilosopherDeepBrief[]): string {
  // Used when Redis is unavailable AND the model call fails. Cheap, never
  // empty, never as good as the real synthesis. Composes a generic line from
  // tradition tags so the prompt block is at least populated.
  const traditions = Array.from(new Set(briefs.map(b => b.tradition)));
  return `Holds a worldview shaped by ${traditions.join(', ')} traditions. The reader wants advice that respects how they already think.`;
}

// ─── Public API ─────────────────────────────────────────────────────────

/**
 * Synthesize the council shape. Cached per (sortedCouncilHash, date).
 *
 * Members not in the priority subset (DEEP_BRIEFS) are passed through to
 * the prompt as "tradition not yet detailed" so the synthesis can still
 * acknowledge them; quality of the synthesis grows as the registry expands.
 */
export async function synthesizeCouncilShape(
  input: SynthesizeShapeInput,
): Promise<SynthesizeShapeOutput> {
  const cacheKey = buildCacheKey(input.council, input.date);

  // Try cache. Defensive: import dynamically so module-load doesn't crash
  // if Redis env vars are unset (matches the pattern in cache/retrieve.ts).
  let cached: string | undefined;
  try {
    const { redis } = await import('@/utils/redis');
    const value = await redis.get<string>(cacheKey);
    if (typeof value === 'string' && value.length > 0) {
      cached = value;
    }
  } catch {
    // Redis unavailable. Fall through to fresh synthesis.
  }

  if (cached) {
    return { sharedShape: cached, cached: true };
  }

  // Build briefs list and track members not yet in the priority subset.
  const briefs: PhilosopherDeepBrief[] = [];
  const unknownNames: string[] = [];
  for (const name of input.council) {
    const brief = lookupBriefByName(name);
    if (brief) briefs.push(brief);
    else unknownNames.push(name);
  }

  if (briefs.length === 0 && unknownNames.length === 0) {
    // Empty council. Caller should not invoke us in this case, but be
    // defensive: return a neutral shared-shape so downstream prompts have
    // something to render.
    return {
      sharedShape: 'Holds a broadly contemplative worldview. The reader wants advice that earns its keep.',
      cached: false,
    };
  }

  // Synthesize via Haiku. Single call, cheap.
  let synthesized: string;
  try {
    const { text } = await generateText({
      model: MODELS.haiku,
      prompt: buildPrompt(briefs, unknownNames),
      maxOutputTokens: 120,
      temperature: 0.7,
    });
    synthesized = sanitizeSynthesis(text);
  } catch (err) {
    console.warn(`[council:synthesize-shape] generation failed; using deterministic fallback. ${(err as Error).message}`);
    synthesized = deterministicFallback(briefs);
  }

  // Best-effort cache write. Failure here is non-fatal.
  try {
    const { redis } = await import('@/utils/redis');
    await redis.set(cacheKey, synthesized, { ex: CACHE_TTL_SECONDS });
  } catch {
    // Redis unavailable. Skip cache write; next call will resynthesize.
  }

  return { sharedShape: synthesized, cached: false };
}

/**
 * Strip dashes, quote wrappers, and stray whitespace from a model
 * synthesis. Safety belt: even with the prompt's ban, a model may emit
 * an em-dash; we strip it here so the dash never reaches the prompt.
 */
function sanitizeSynthesis(raw: string): string {
  return raw
    .replace(/[—–]/g, ',') // em-dash, en-dash → comma
    .replace(/^["'`]+|["'`]+$/g, '') // strip wrapping quotes
    .replace(/\s+/g, ' ')
    .trim();
}
