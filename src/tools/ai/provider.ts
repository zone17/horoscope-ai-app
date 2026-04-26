/**
 * ai/provider — AI SDK + Gateway namespace (scaffolding, not a verb)
 *
 * The chokepoint for model access in this codebase. Routes through Vercel
 * AI Gateway using plain "provider/model" strings so model rotation and
 * cross-cutting concerns (logging, retries, cost tracking) happen in one
 * place instead of sprawling across consumers. New code imports the
 * primitives from here; no new consumer imports from `ai` directly.
 *
 * **Known gap (tracked, not closed)**: `src/utils/horoscope-generator.ts`
 * still uses the OpenAI SDK directly for monthly-page generation —
 * predates this chokepoint and is on the migration backlog. Until that
 * lands, `OPENAI_API_KEY` must remain in Vercel env (see HANDOFF §9).
 * Removing it before `horoscope-generator.ts` migrates will break
 * monthly pages silently.
 *
 * Env: AI_GATEWAY_API_KEY for local dev; Vercel-deployed envs authenticate
 * via VERCEL_OIDC_TOKEN automatically when AI_GATEWAY_API_KEY is unset.
 *
 * Usage:
 *   import { generateText, generateObject, MODELS } from '@/tools/ai/provider';
 *
 *   const { text } = await generateText({
 *     model: MODELS.haiku,
 *     prompt: '...',
 *   });
 */

export { generateText, generateObject, streamText } from 'ai';

/**
 * Canonical gateway model IDs. Rotating these is a deliberate, reviewed act —
 * downstream prompt quality is version-sensitive, especially for voice
 * consistency in the philosophy engine's readings. Update alias targets here;
 * never hardcode IDs in consumers.
 */
export const MODELS = {
  haiku: 'anthropic/claude-haiku-4.5',
  sonnet: 'anthropic/claude-sonnet-4.6',
  opus: 'anthropic/claude-opus-4.7',
} as const;

export type ModelAlias = keyof typeof MODELS;
export type ModelId = (typeof MODELS)[ModelAlias];
