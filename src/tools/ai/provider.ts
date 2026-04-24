/**
 * ai/provider — AI SDK + Gateway namespace (scaffolding, not a verb)
 *
 * Single chokepoint for all model access in this codebase. Routes through
 * Vercel AI Gateway using plain "provider/model" strings so model rotation
 * and cross-cutting concerns (logging, retries, cost tracking) happen in
 * one place instead of sprawling across consumers. Consumers import the
 * primitives from here; no one else imports from `ai` directly.
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
