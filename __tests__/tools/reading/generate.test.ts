/**
 * @jest-environment node
 *
 * Phase 1b parity tests for reading:generate.
 *
 * Goal: prove the USE_AI_SDK feature flag correctly toggles between the legacy
 * OpenAI SDK path and the new Vercel AI SDK + Gateway path, while leaving all
 * parsing / validation / output shape identical. Both paths are mocked — this
 * is a transport-level contract test, not an end-to-end model call.
 */

import { generateReading } from '@/tools/reading/generate';

const VALID_RESPONSE_JSON = JSON.stringify({
  message: 'A clean, grounded reading of 40+ words describing Aries energy for today. Steady, purposeful, unshowy. A nudge toward something small and doable that nonetheless matters.',
  best_match: 'gemini, leo, sagittarius',
  inspirational_quote: 'The happiness of your life depends upon the quality of your thoughts.',
  quote_author: 'Marcus Aurelius',
  peaceful_thought: 'Tonight, let the day settle without reviewing it. Not every hour needs a verdict.',
});

const mockGenerateText = jest.fn();
const mockOpenAIChatCompletionsCreate = jest.fn();

jest.mock('@/tools/ai/provider', () => ({
  ...jest.requireActual('@/tools/ai/provider'),
  generateText: (...args: unknown[]) => mockGenerateText(...args),
}));

jest.mock('openai', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      chat: { completions: { create: (...args: unknown[]) => mockOpenAIChatCompletionsCreate(...args) } },
    })),
  };
});

describe('reading:generate — Phase 1b parity', () => {
  const originalOpenAIKey = process.env.OPENAI_API_KEY;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.OPENAI_API_KEY = 'test-key-not-placeholder';
    mockGenerateText.mockResolvedValue({ text: VALID_RESPONSE_JSON });
    mockOpenAIChatCompletionsCreate.mockResolvedValue({
      choices: [{ message: { content: VALID_RESPONSE_JSON } }],
    });
  });

  afterEach(() => {
    delete process.env.FEATURE_FLAG_USE_AI_SDK;
    if (originalOpenAIKey === undefined) {
      delete process.env.OPENAI_API_KEY;
    } else {
      process.env.OPENAI_API_KEY = originalOpenAIKey;
    }
  });

  describe('legacy path (USE_AI_SDK off / unset)', () => {
    it('calls OpenAI SDK, not AI SDK', async () => {
      delete process.env.FEATURE_FLAG_USE_AI_SDK;
      await generateReading({ sign: 'aries', philosopher: 'Marcus Aurelius', date: '2026-04-24' });
      expect(mockOpenAIChatCompletionsCreate).toHaveBeenCalledTimes(1);
      expect(mockGenerateText).not.toHaveBeenCalled();
    });

    it('uses gpt-4o-mini-2024-07-18 with response_format json_object and max_tokens 800', async () => {
      delete process.env.FEATURE_FLAG_USE_AI_SDK;
      await generateReading({ sign: 'aries', philosopher: 'Marcus Aurelius', date: '2026-04-24' });
      expect(mockOpenAIChatCompletionsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4o-mini-2024-07-18',
          response_format: { type: 'json_object' },
          max_tokens: 800,
        }),
      );
    });
  });

  describe('AI SDK path (USE_AI_SDK on)', () => {
    it('calls AI SDK generateText, not OpenAI SDK', async () => {
      process.env.FEATURE_FLAG_USE_AI_SDK = 'true';
      await generateReading({ sign: 'aries', philosopher: 'Marcus Aurelius', date: '2026-04-24' });
      expect(mockGenerateText).toHaveBeenCalledTimes(1);
      expect(mockOpenAIChatCompletionsCreate).not.toHaveBeenCalled();
    });

    it('targets openai/gpt-4o-mini via gateway with maxOutputTokens 800', async () => {
      // Hard JSON-mode enforcement is intentionally NOT asserted here: the AI
      // SDK OpenAI chat provider does not expose `response_format` via
      // `providerOptions`. Canonical JSON enforcement lands in PR C via
      // `generateObject` + Zod, which replaces this call entirely. The flag
      // defaults off so this divergence has no production blast radius.
      process.env.FEATURE_FLAG_USE_AI_SDK = 'true';
      await generateReading({ sign: 'aries', philosopher: 'Marcus Aurelius', date: '2026-04-24' });
      const [[call]] = mockGenerateText.mock.calls;
      expect(call).toEqual(
        expect.objectContaining({ model: 'openai/gpt-4o-mini', maxOutputTokens: 800 }),
      );
      expect(call).not.toHaveProperty('providerOptions');
    });
  });

  describe('parity — output shape is identical regardless of path', () => {
    const expected = {
      sign: 'aries',
      date: '2026-04-24',
      philosopher: 'Marcus Aurelius',
      quoteAuthor: 'Marcus Aurelius',
      inspirationalQuote: 'The happiness of your life depends upon the quality of your thoughts.',
      bestMatch: 'gemini, leo, sagittarius',
    };

    it('legacy path returns normalized ReadingOutput', async () => {
      delete process.env.FEATURE_FLAG_USE_AI_SDK;
      const result = await generateReading({ sign: 'aries', philosopher: 'Marcus Aurelius', date: '2026-04-24' });
      expect(result).toMatchObject(expected);
      expect(result.message.length).toBeGreaterThan(0);
    });

    it('AI SDK path returns normalized ReadingOutput with the same shape', async () => {
      process.env.FEATURE_FLAG_USE_AI_SDK = 'true';
      const result = await generateReading({ sign: 'aries', philosopher: 'Marcus Aurelius', date: '2026-04-24' });
      expect(result).toMatchObject(expected);
      expect(result.message.length).toBeGreaterThan(0);
    });
  });
});
