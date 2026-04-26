/**
 * @jest-environment node
 *
 * Contract tests for reading:generate (Phase 1c, post-merge canonical transport).
 *
 * Goal: prove the verb (a) routes through `generateObject` with the canonical
 * `ReadingOutputModelSchema` (referential identity, not just key shape) and
 * `MODELS.sonnet`, (b) returns a normalized `ReadingOutput` shape, (c) applies
 * the post-call business validators (quote-author allowlist override, quote-bank
 * fallback drawing FROM the bank, self-match filter, element-based bestMatch
 * fallback), (d) propagates schema-validation errors via the retry path.
 *
 * The AI SDK call is mocked — this is a contract test, not a model call.
 *
 * Phase 1b's parity tests (legacy OpenAI SDK vs AI SDK toggle) collapsed
 * here in PR C: the legacy path was deleted and the FEATURE_FLAG_USE_AI_SDK
 * gate is gone. There is exactly one transport now (with one retry).
 */

import { generateReading } from '@/tools/reading/generate';
import { MODELS } from '@/tools/ai/provider';
import { ReadingOutputModelSchema } from '@/tools/reading/types';
import { VERIFIED_QUOTES } from '@/utils/verified-quotes';

// Roughly 50 words so the default fixture sits inside the 40-80 target and
// does not silently trip the word-count telemetry warning on every passing
// test (a regression caught in round-2 review of PR C).
const VALID_RESPONSE = {
  message: 'There is a moment right before you act, a half-breath where intent crystallises into motion, and today that pause holds everything you need to recognise. Notice it without judgement. The clarity you have been searching for lives quietly inside the gap between thought and gesture, waiting patiently to be claimed when you are ready.',
  bestMatch: 'aries, gemini, leo, sagittarius',
  inspirationalQuote: 'The happiness of your life depends upon the quality of your thoughts.',
  quoteAuthor: 'Marcus Aurelius',
  peacefulThought: 'Tonight, let the day settle without reviewing it. Not every hour needs a verdict.',
};

const mockGenerateObject = jest.fn();
const mockGenerateText = jest.fn();

jest.mock('@/tools/ai/provider', () => ({
  ...jest.requireActual('@/tools/ai/provider'),
  generateObject: (...args: unknown[]) => mockGenerateObject(...args),
  generateText: (...args: unknown[]) => mockGenerateText(...args),
}));

describe('reading:generate — Phase 1c canonical transport', () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGenerateObject.mockResolvedValue({ object: VALID_RESPONSE });
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
    (console.log as jest.Mock).mockRestore?.();
  });

  it('calls generateObject with MODELS.sonnet and the canonical schema (referential identity)', async () => {
    await generateReading({ sign: 'aries', philosopher: 'Marcus Aurelius', date: '2026-04-26' });
    expect(mockGenerateObject).toHaveBeenCalledTimes(1);
    const [[call]] = mockGenerateObject.mock.calls;
    expect(call).toEqual(
      expect.objectContaining({ model: MODELS.sonnet, maxOutputTokens: 800 }),
    );
    // Identity check — stronger than asserting the schema's shape. A future
    // regression that inlined a schema with the right keys but different
    // .min() or .refine() constraints would slip past a shape-only check.
    expect(call.schema).toBe(ReadingOutputModelSchema);
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

  it('falls back to the element-based default when bestMatch becomes empty after self-filter', async () => {
    mockGenerateObject.mockResolvedValueOnce({
      object: { ...VALID_RESPONSE, bestMatch: 'aries' },
    });
    const result = await generateReading({ sign: 'aries', philosopher: 'Marcus Aurelius', date: '2026-04-26' });
    // Aries fallback per ELEMENT_FALLBACK_MATCHES is "leo, sagittarius, gemini".
    expect(result.bestMatch).toBe('leo, sagittarius, gemini');
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('bestMatch empty after self-filter'),
    );
  });

  it('overrides an unknown quote author with the assigned philosopher (allowlist guard)', async () => {
    mockGenerateObject.mockResolvedValueOnce({
      object: { ...VALID_RESPONSE, quoteAuthor: 'Unknown Person' },
    });
    const result = await generateReading({ sign: 'aries', philosopher: 'Marcus Aurelius', date: '2026-04-26' });
    expect(result.quoteAuthor).toBe('Marcus Aurelius');
  });

  it('replaces a fabricated quote with one drawn FROM the verified bank', async () => {
    mockGenerateObject.mockResolvedValueOnce({
      object: {
        ...VALID_RESPONSE,
        inspirationalQuote: 'A fabricated quote that is not in the bank for any philosopher.',
      },
    });
    const result = await generateReading({ sign: 'aries', philosopher: 'Marcus Aurelius', date: '2026-04-26' });
    // Stronger assertion than "non-empty" — verify the replacement is
    // actually one of the verified Marcus Aurelius quotes, not a coincidence
    // or a literal default.
    const bankQuotes = VERIFIED_QUOTES['Marcus Aurelius'].map(q => q.text);
    expect(bankQuotes).toContain(result.inspirationalQuote);
  });

  it('warns when message word count is outside the 40-80 target range', async () => {
    mockGenerateObject.mockResolvedValueOnce({
      object: { ...VALID_RESPONSE, message: 'Way too short.' }, // 3 words
    });
    await generateReading({ sign: 'aries', philosopher: 'Marcus Aurelius', date: '2026-04-26' });
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringMatching(/word count out of target range: 3/),
    );
  });

  it('does not warn when message word count is inside the 40-80 target range', async () => {
    // VALID_RESPONSE.message is ~52 words (validated by the fixture comment).
    await generateReading({ sign: 'aries', philosopher: 'Marcus Aurelius', date: '2026-04-26' });
    const wordCountWarnings = warnSpy.mock.calls.filter(([msg]) =>
      typeof msg === 'string' && msg.includes('word count'),
    );
    expect(wordCountWarnings).toHaveLength(0);
  });

  it('retries via generateText + manual schema parse when the first generateObject call throws', async () => {
    const schemaError = new Error('No object generated: response did not match schema');
    mockGenerateObject.mockRejectedValueOnce(schemaError);
    // The retry path uses generateText with raw text + manual normaliseModelKeys
    // + ReadingOutputModelSchema.parse. Simulate snake_case dialect drift to
    // exercise the normaliser too.
    mockGenerateText.mockResolvedValueOnce({
      text: JSON.stringify({
        message: VALID_RESPONSE.message,
        best_match: VALID_RESPONSE.bestMatch,
        inspirational_quote: VALID_RESPONSE.inspirationalQuote,
        quote_author: VALID_RESPONSE.quoteAuthor,
        peaceful_thought: VALID_RESPONSE.peacefulThought,
      }),
    });
    const result = await generateReading({ sign: 'aries', philosopher: 'Marcus Aurelius', date: '2026-04-26' });
    expect(mockGenerateObject).toHaveBeenCalledTimes(1);
    expect(mockGenerateText).toHaveBeenCalledTimes(1);
    expect(result.message).toBe(VALID_RESPONSE.message);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('First attempt failed'),
    );
  });

  it('propagates the error if both attempts fail (no infinite retry, no silent success)', async () => {
    const schemaError = new Error('No object generated: response did not match schema');
    const retryError = new Error('Gateway throttled the retry');
    mockGenerateObject.mockRejectedValueOnce(schemaError);
    mockGenerateText.mockRejectedValueOnce(retryError);
    await expect(
      generateReading({ sign: 'aries', philosopher: 'Marcus Aurelius', date: '2026-04-26' }),
    ).rejects.toThrow(/Gateway throttled the retry/);
  });
});
