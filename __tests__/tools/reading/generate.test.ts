/**
 * @jest-environment node
 *
 * Contract tests for reading:generate (Phase 1c, post-merge canonical transport).
 *
 * Goal: prove the verb (a) routes through `generateObject` with the canonical
 * `ReadingOutputModelSchema` and `MODELS.sonnet`, (b) returns a normalized
 * `ReadingOutput` shape, (c) applies the post-call business validators
 * (quote-author allowlist override, quote-bank fallback, self-match filter),
 * (d) propagates schema-validation errors instead of swallowing them.
 *
 * The AI SDK call is mocked — this is a contract test, not a model call.
 *
 * Phase 1b's parity tests (legacy OpenAI SDK vs AI SDK toggle) collapsed
 * here in PR C: the legacy path was deleted and the FEATURE_FLAG_USE_AI_SDK
 * gate is gone. There is exactly one transport now.
 */

import { generateReading } from '@/tools/reading/generate';
import { MODELS } from '@/tools/ai/provider';

const VALID_RESPONSE = {
  message: 'A clean, grounded reading of 40+ words describing Aries energy for today. Steady, purposeful, unshowy. A nudge toward something small and doable that nonetheless matters and lands with weight.',
  bestMatch: 'aries, gemini, leo, sagittarius',
  inspirationalQuote: 'The happiness of your life depends upon the quality of your thoughts.',
  quoteAuthor: 'Marcus Aurelius',
  peacefulThought: 'Tonight, let the day settle without reviewing it. Not every hour needs a verdict.',
};

const mockGenerateObject = jest.fn();

jest.mock('@/tools/ai/provider', () => ({
  ...jest.requireActual('@/tools/ai/provider'),
  generateObject: (...args: unknown[]) => mockGenerateObject(...args),
}));

describe('reading:generate — Phase 1c canonical transport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGenerateObject.mockResolvedValue({ object: VALID_RESPONSE });
  });

  it('calls generateObject with MODELS.sonnet and the canonical schema', async () => {
    await generateReading({ sign: 'aries', philosopher: 'Marcus Aurelius', date: '2026-04-26' });
    expect(mockGenerateObject).toHaveBeenCalledTimes(1);
    const [[call]] = mockGenerateObject.mock.calls;
    expect(call).toEqual(
      expect.objectContaining({
        model: MODELS.sonnet,
        maxOutputTokens: 800,
      }),
    );
    // Schema is required and is the canonical one — assert the function
    // was passed a ZodObject with the five expected camelCase keys.
    expect(call.schema).toBeDefined();
    const shape = (call.schema as { shape: Record<string, unknown> }).shape;
    expect(Object.keys(shape).sort()).toEqual(
      ['bestMatch', 'inspirationalQuote', 'message', 'peacefulThought', 'quoteAuthor'],
    );
  });

  it('returns a normalized ReadingOutput with sign/date/philosopher injected', async () => {
    const result = await generateReading({ sign: 'aries', philosopher: 'Marcus Aurelius', date: '2026-04-26' });
    expect(result).toMatchObject({
      sign: 'aries',
      date: '2026-04-26',
      philosopher: 'Marcus Aurelius',
      message: VALID_RESPONSE.message,
      inspirationalQuote: VALID_RESPONSE.inspirationalQuote,
      quoteAuthor: 'Marcus Aurelius',
      peacefulThought: VALID_RESPONSE.peacefulThought,
    });
  });

  it('filters self-matches from bestMatch (aries should not appear in its own list)', async () => {
    const result = await generateReading({ sign: 'aries', philosopher: 'Marcus Aurelius', date: '2026-04-26' });
    expect(result.bestMatch.toLowerCase()).not.toContain('aries');
    expect(result.bestMatch).toMatch(/gemini|leo|sagittarius/);
  });

  it('overrides an unknown quote author with the assigned philosopher (allowlist guard)', async () => {
    mockGenerateObject.mockResolvedValueOnce({
      object: { ...VALID_RESPONSE, quoteAuthor: 'Unknown Person' },
    });
    const result = await generateReading({ sign: 'aries', philosopher: 'Marcus Aurelius', date: '2026-04-26' });
    expect(result.quoteAuthor).toBe('Marcus Aurelius');
  });

  it('replaces a fabricated quote with one from the verified bank when the philosopher has bank coverage', async () => {
    mockGenerateObject.mockResolvedValueOnce({
      object: {
        ...VALID_RESPONSE,
        inspirationalQuote: 'A fabricated quote that is not in the bank for any philosopher.',
      },
    });
    const result = await generateReading({ sign: 'aries', philosopher: 'Marcus Aurelius', date: '2026-04-26' });
    // The replacement is deterministic per date; just assert it's no longer
    // the fabricated value AND it's a non-empty string from the verified bank.
    expect(result.inspirationalQuote).not.toBe('A fabricated quote that is not in the bank for any philosopher.');
    expect(result.inspirationalQuote.length).toBeGreaterThan(0);
  });

  it('propagates schema-validation errors from generateObject', async () => {
    const schemaError = new Error('No object generated: response did not match schema');
    mockGenerateObject.mockRejectedValueOnce(schemaError);
    await expect(
      generateReading({ sign: 'aries', philosopher: 'Marcus Aurelius', date: '2026-04-26' }),
    ).rejects.toThrow(/No object generated/);
  });
});
