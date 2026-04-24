/**
 * ai:provider — AI SDK + Gateway entry point
 *
 * Single chokepoint for all model access in this codebase. Routes through
 * Vercel AI Gateway using plain "provider/model" strings so model rotation
 * and cross-cutting concerns (logging, retries, cost tracking) happen in
 * one place instead of sprawling across consumers.
 *
 * Env: AI_GATEWAY_API_KEY (production deploys use VERCEL_OIDC_TOKEN automatically)
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
 * Canonical model IDs used across the codebase.
 * Rotate model choices here; consumers reference aliases.
 */
export const MODELS = {
  haiku: 'anthropic/claude-haiku-4.5',
  sonnet: 'anthropic/claude-sonnet-4.6',
  opus: 'anthropic/claude-opus-4.7',
} as const;

export type ModelAlias = keyof typeof MODELS;
export type ModelId = (typeof MODELS)[ModelAlias];
