/**
 * @jest-environment node
 *
 * Contract tests for reading:generate-with-critique (Phase 1e composer).
 *
 * Mocks the two underlying verbs (`reading:generate` and `reading:judge`)
 * so we test the composition logic — threshold gating, feedback construction,
 * round budget — without making real model calls. The verbs themselves have
 * their own tests; this file proves the loop wires them correctly.
 */

import {
  generateReadingWithCritique,
  buildFeedbackFromJudge,
} from '@/tools/reading/generate-with-critique';
import type { ReadingOutput } from '@/tools/reading/types';
import type { JudgeResult } from '@/tools/reading/judge';

const READING_FIXTURE: ReadingOutput = {
  sign: 'aries',
  date: '2026-04-26',
  philosopher: 'Marcus Aurelius',
  message: 'A test reading message of sufficient length to pass schema and human review for a first-attempt fixture.',
  bestMatch: 'leo, sagittarius, gemini',
  inspirationalQuote: 'You have power over your mind — not outside events.',
  quoteAuthor: 'Marcus Aurelius',
  peacefulThought: 'Tonight, let the day settle.',
};

const PASSING_JUDGE: JudgeResult = {
  scores: { voiceAuthenticity: 4, antiBarnum: 4, antiTemplate: 5, quoteFidelity: 5, overall: 4 },
  violations: [],
  rationale: 'Clean reading, in-voice, anti-template solid.',
};

const FAILING_JUDGE: JudgeResult = {
  scores: { voiceAuthenticity: 3, antiBarnum: 2, antiTemplate: 5, quoteFidelity: 4, overall: 3 },
  violations: [
    'Sentence 2 is a generic Barnum statement that could fit any reader.',
    'Voice does not match Aries — too mild and equivocating.',
  ],
  rationale: 'Reading is competent but Barnum-leaning and voice-flat.',
};

const mockGenerateReading = jest.fn();
const mockJudgeReading = jest.fn();

jest.mock('@/tools/reading/generate', () => ({
  ...jest.requireActual('@/tools/reading/generate'),
  generateReading: (...args: unknown[]) => mockGenerateReading(...args),
}));

jest.mock('@/tools/reading/judge', () => ({
  ...jest.requireActual('@/tools/reading/judge'),
  judgeReading: (...args: unknown[]) => mockJudgeReading(...args),
}));

describe('reading:generate-with-critique', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    (console.log as jest.Mock).mockRestore?.();
    (console.warn as jest.Mock).mockRestore?.();
  });

  it('returns the first attempt when scores pass threshold (rounds = 0, no feedback passed)', async () => {
    mockGenerateReading.mockResolvedValueOnce(READING_FIXTURE);
    mockJudgeReading.mockResolvedValueOnce(PASSING_JUDGE);

    const result = await generateReadingWithCritique({
      sign: 'aries',
      philosopher: 'Marcus Aurelius',
      date: '2026-04-26',
    });

    expect(result.rounds).toBe(0);
    expect(result.thresholdMissedAfterMaxRounds).toBe(false);
    expect(result.reading).toEqual(READING_FIXTURE);
    expect(result.judge).toEqual(PASSING_JUDGE);
    expect(mockGenerateReading).toHaveBeenCalledTimes(1);
    expect(mockJudgeReading).toHaveBeenCalledTimes(1);
    // Critically: no feedback content on first attempt (undefined is fine —
    // the prompt builder treats undefined the same as absent, and the wrapper
    // sets the field explicitly to make the contract obvious).
    expect(mockGenerateReading.mock.calls[0][0].feedback).toBeUndefined();
  });

  it('regenerates with feedback when judge fails, accepts on second attempt', async () => {
    mockGenerateReading
      .mockResolvedValueOnce({ ...READING_FIXTURE, message: 'first (Barnum-y)' })
      .mockResolvedValueOnce({ ...READING_FIXTURE, message: 'second (recovered)' });
    mockJudgeReading
      .mockResolvedValueOnce(FAILING_JUDGE)
      .mockResolvedValueOnce(PASSING_JUDGE);

    const result = await generateReadingWithCritique({
      sign: 'aries',
      philosopher: 'Marcus Aurelius',
      date: '2026-04-26',
    });

    expect(result.rounds).toBe(1);
    expect(result.thresholdMissedAfterMaxRounds).toBe(false);
    expect(result.reading.message).toBe('second (recovered)');
    expect(result.judge).toEqual(PASSING_JUDGE);
    expect(mockGenerateReading).toHaveBeenCalledTimes(2);
    expect(mockJudgeReading).toHaveBeenCalledTimes(2);

    // Second generate call must include the feedback derived from the first
    // judge result. The wrapper's whole job is wiring this through.
    const secondCall = mockGenerateReading.mock.calls[1][0];
    expect(secondCall.feedback).toBeDefined();
    expect(secondCall.feedback).toContain('antiBarnum=2/5');
    expect(secondCall.feedback).toContain('voiceAuthenticity=3/5');
    expect(secondCall.feedback).toContain('Sentence 2 is a generic Barnum statement');
  });

  it('caps at MAX_CRITIQUE_ROUNDS (2) and surfaces the last attempt with thresholdMissedAfterMaxRounds=true', async () => {
    // All three attempts fail — the composer should bound at 2 critique
    // rounds (3 total generate+judge cycles) and return the last one.
    mockGenerateReading
      .mockResolvedValueOnce({ ...READING_FIXTURE, message: 'attempt 0' })
      .mockResolvedValueOnce({ ...READING_FIXTURE, message: 'attempt 1' })
      .mockResolvedValueOnce({ ...READING_FIXTURE, message: 'attempt 2' });
    mockJudgeReading
      .mockResolvedValueOnce(FAILING_JUDGE)
      .mockResolvedValueOnce(FAILING_JUDGE)
      .mockResolvedValueOnce(FAILING_JUDGE);

    const result = await generateReadingWithCritique({
      sign: 'aries',
      philosopher: 'Marcus Aurelius',
      date: '2026-04-26',
    });

    expect(result.rounds).toBe(2);
    expect(result.thresholdMissedAfterMaxRounds).toBe(true);
    expect(result.reading.message).toBe('attempt 2');
    expect(mockGenerateReading).toHaveBeenCalledTimes(3);
    expect(mockJudgeReading).toHaveBeenCalledTimes(3);
  });

  it('does NOT regenerate on antiTemplate failure — that axis is excluded from the threshold per Phase 1e plan amendment', async () => {
    // Sonnet hit antiTemplate=5 across all baseline cells. Critiquing on
    // that axis is wasted compute. Construct a judge that fails antiTemplate
    // but passes the load-bearing axes — no regeneration should fire.
    const antiTemplateOnlyFailure: JudgeResult = {
      scores: { voiceAuthenticity: 4, antiBarnum: 4, antiTemplate: 2, quoteFidelity: 4, overall: 4 },
      violations: ['Used the word "tapestry" twice'],
      rationale: 'Anti-template alone — voice and substance are fine.',
    };
    mockGenerateReading.mockResolvedValueOnce(READING_FIXTURE);
    mockJudgeReading.mockResolvedValueOnce(antiTemplateOnlyFailure);

    const result = await generateReadingWithCritique({
      sign: 'aries',
      philosopher: 'Marcus Aurelius',
      date: '2026-04-26',
    });

    expect(result.rounds).toBe(0);
    expect(mockGenerateReading).toHaveBeenCalledTimes(1);
  });

  it('builds feedback from judge violations, scores, and rationale', () => {
    const feedback = buildFeedbackFromJudge(FAILING_JUDGE);
    // Failing axes are surfaced with score values for the model to act on.
    expect(feedback).toContain('antiBarnum=2/5');
    expect(feedback).toContain('voiceAuthenticity=3/5');
    expect(feedback).toContain('overall=3/5');
    // Specific violations are included verbatim.
    expect(feedback).toContain('Sentence 2 is a generic Barnum statement');
    // Judge's rationale is included.
    expect(feedback).toContain('Reading is competent but Barnum-leaning');
  });

  it('builds minimal feedback when judge passes but caller forces regeneration (defensive shape)', () => {
    const feedback = buildFeedbackFromJudge(PASSING_JUDGE);
    // No failing axes → string explains the threshold was tripped (which
    // would be a caller bug since shouldRegenerate would have returned false,
    // but the formatter must not crash).
    expect(feedback).toContain('threshold tripped');
    // Empty violations array → that section is omitted, not rendered as 'undefined'.
    expect(feedback).not.toMatch(/undefined/);
  });

  it('propagates errors from generateReading without retry (the verb itself owns retry)', async () => {
    mockGenerateReading.mockRejectedValueOnce(new Error('Both generate attempts failed'));
    await expect(
      generateReadingWithCritique({ sign: 'aries', philosopher: 'Marcus Aurelius', date: '2026-04-26' }),
    ).rejects.toThrow(/Both generate attempts failed/);
    // The composer must NOT add its own retry on top of the verb's internal
    // retry — that would be a workflow-disguised-as-composition.
    expect(mockGenerateReading).toHaveBeenCalledTimes(1);
  });

  it('propagates errors from judgeReading and does not silently accept the unverified reading', async () => {
    mockGenerateReading.mockResolvedValueOnce(READING_FIXTURE);
    mockJudgeReading.mockRejectedValueOnce(new Error('Judge unavailable'));
    await expect(
      generateReadingWithCritique({ sign: 'aries', philosopher: 'Marcus Aurelius', date: '2026-04-26' }),
    ).rejects.toThrow(/Judge unavailable/);
  });
});
