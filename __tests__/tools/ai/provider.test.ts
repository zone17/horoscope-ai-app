/**
 * @jest-environment node
 */

import { MODELS, generateText, generateObject, streamText } from '@/tools/ai/provider';
import type { ModelAlias, ModelId } from '@/tools/ai/provider';

describe('ai:provider', () => {
  describe('MODELS', () => {
    it('exports haiku/sonnet/opus aliases pointing at gateway model IDs', () => {
      expect(MODELS.haiku).toBe('anthropic/claude-haiku-4.5');
      expect(MODELS.sonnet).toBe('anthropic/claude-sonnet-4.6');
      expect(MODELS.opus).toBe('anthropic/claude-opus-4.7');
    });

    it('uses the anthropic/ gateway prefix for all entries', () => {
      for (const id of Object.values(MODELS)) {
        expect(id).toMatch(/^anthropic\//);
      }
    });

    it('is marked const so model IDs are literal types', () => {
      const alias: ModelAlias = 'haiku';
      const id: ModelId = MODELS[alias];
      expect(typeof id).toBe('string');
    });
  });

  describe('ai SDK re-exports', () => {
    it('re-exports generateText', () => {
      expect(typeof generateText).toBe('function');
    });

    it('re-exports generateObject', () => {
      expect(typeof generateObject).toBe('function');
    });

    it('re-exports streamText', () => {
      expect(typeof streamText).toBe('function');
    });
  });
});
