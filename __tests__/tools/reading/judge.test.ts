/**
 * @jest-environment node
 *
 * Contract tests for reading:judge.
 *
 * Goal: prove the verb (a) returns parsed JudgeResult under the schema,
 * (b) propagates malformed-output errors instead of swallowing them,
 * (c) composes the sign profile + project banned-word list into the prompt,
 * (d) is pinned to MODELS.haiku as a cost guardrail.
 *
 * The AI SDK call is mocked — this is a contract test, not a model call.
 */

import { judgeReading, buildJudgePrompt, BANNED_WORDS, ASTROLOGY_TROPES } from '@/tools/reading/judge';
import { MODELS } from '@/tools/ai/provider';

const VALID_JUDGE_RESPONSE = {
  scores: {
    voiceAuthenticity: 4,
    antiBarnum: 5,
    antiTemplate: 5,
    quoteFidelity: 4,
    overall: 4,
  },
  violations: [],
  rationale: 'Voice matches Aries register; no template tropes; quote feels stylistically aligned.',
};

const mockGenerateObject = jest.fn();

jest.mock('@/tools/ai/provider', () => ({
  ...jest.requireActual('@/tools/ai/provider'),
  generateObject: (...args: unknown[]) => mockGenerateObject(...args),
}));

const SAMPLE_INPUT = {
  reading: {
    message: 'There is a moment right before you act — a half-breath — and today that pause holds everything. Notice it. The clarity you want lives inside that gap.',
    inspirationalQuote: 'The happiness of your life depends upon the quality of your thoughts.',
    quoteAuthor: 'Marcus Aurelius',
    peacefulThought: 'Tonight, let the day settle without reviewing it. Not every hour needs a verdict.',
  },
  sign: 'aries',
  philosopher: 'Marcus Aurelius',
};

describe('reading:judge', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGenerateObject.mockResolvedValue({ object: VALID_JUDGE_RESPONSE });
  });

  it('returns the parsed JudgeResult when the model returns a schema-valid object', async () => {
    const result = await judgeReading(SAMPLE_INPUT);
    expect(result).toEqual(VALID_JUDGE_RESPONSE);
    expect(result.scores.overall).toBe(4);
    expect(result.violations).toEqual([]);
  });

  it('propagates errors when the AI SDK rejects (e.g., schema violation)', async () => {
    const schemaError = new Error('No object generated: response did not match schema');
    mockGenerateObject.mockRejectedValueOnce(schemaError);
    await expect(judgeReading(SAMPLE_INPUT)).rejects.toThrow(/No object generated/);
  });

  it('pins the model to MODELS.haiku (cost guardrail)', async () => {
    await judgeReading(SAMPLE_INPUT);
    const [[call]] = mockGenerateObject.mock.calls;
    expect(call).toEqual(expect.objectContaining({ model: MODELS.haiku }));
  });

  it('composes the sign profile (voice + avoidPatterns) into the prompt', () => {
    const prompt = buildJudgePrompt(SAMPLE_INPUT);
    // Aries voice keyword from sign-profile.ts
    expect(prompt).toMatch(/bold, direct coach/i);
    // Aries-specific avoidPattern from sign-profile.ts
    expect(prompt).toMatch(/fiery phoenix/i);
    // Sign element shows up in the criteria block
    expect(prompt).toMatch(/Fire/);
  });

  it('embeds the project banned-word list and astrology-template tropes verbatim', () => {
    const prompt = buildJudgePrompt(SAMPLE_INPUT);
    // Sample a banned word and a trope to confirm composition (not a snapshot
    // — the lists are exported and tested as constants; this just proves the
    // prompt builder uses them)
    expect(prompt).toContain(BANNED_WORDS[0]); // 'tapestry'
    expect(prompt).toContain(ASTROLOGY_TROPES[0]); // 'as the new moon rises'
  });
});
