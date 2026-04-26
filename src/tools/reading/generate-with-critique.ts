/**
 * reading:generate-with-critique — Composition verb (Phase 1e)
 *
 * Composes `reading:generate` and `reading:judge` at the call site to form
 * the self-critique loop the parent plan called for. Crucially, this verb
 * does NOT extend either of the underlying verbs — it just sequences them.
 * Per the architectural rule documented in the parent plan amendment in
 * PR #63: "the critique loop lives at the call site, NOT folded into
 * `reading:generate`. Folding it in turns the verb into a workflow."
 *
 * This file is the proof of that rule. Both `reading:generate` and
 * `reading:judge` remain atomic; this thin composer is what gets called
 * by cron when we want the higher-quality path.
 *
 * Cost shape per invocation (worst case, 2 critique rounds):
 *   3 generations (Sonnet) + 3 judge calls (Haiku) ≈ 6 model calls.
 *   At ~$0.011 (Sonnet) + ~$0.004 (Haiku) per call ≈ $0.045 worst-case.
 *   Realistic case: most readings pass on round 0; ~10-20% need 1 critique;
 *   <2% need both rounds. Annual cron incremental cost: ~$80-120.
 *
 * Latency shape per invocation (worst case): ~30-50s. Suitable for cron
 * (no per-request timeout pressure). NOT used by on-demand /api/horoscope —
 * that path stays on bare `reading:generate` to keep p95 well under
 * the 30s function timeout.
 *
 * Threshold rationale (from PR B.5 baseline `docs/evals/2026-04-25-baseline.md`):
 *   - antiBarnum was the only axis where no Sonnet cell scored a 5 (mean 3.94).
 *     This is the load-bearing wedge — critique focuses here.
 *   - voiceAuthenticity occasionally bottoms to 3 on understated signs
 *     (sagittarius, gemini). Worth catching as a secondary trigger.
 *   - antiTemplate was 5.00 across all 36 Sonnet cells in the baseline.
 *     Critiquing that axis is wasted compute (parent plan amended to
 *     drop it from Phase 1e scope).
 *   - overall ≤ 3 catches any holistic failure regardless of axis.
 *
 * Input:  GenerateWithCritiqueInput
 * Output: GenerateWithCritiqueResult
 */

import { generateReading, type GenerateReadingInput } from '@/tools/reading/generate';
import { judgeReading, type JudgeResult } from '@/tools/reading/judge';
import type { ReadingOutput } from '@/tools/reading/types';

// ─── Types ──────────────────────────────────────────────────────────────

export interface GenerateWithCritiqueInput {
  sign: string;
  philosopher: string;
  date?: string;
}

export interface GenerateWithCritiqueResult {
  /** The final accepted reading (last attempt). */
  reading: ReadingOutput;
  /** The judge's evaluation of the final reading. */
  judge: JudgeResult;
  /**
   * Number of critique rounds used (0 = first attempt accepted, 1 = one
   * regeneration, 2 = two regenerations). Bounded at MAX_CRITIQUE_ROUNDS.
   */
  rounds: number;
  /**
   * True when the final reading still scored below threshold after the
   * round budget was exhausted — the caller may want to log/alert but
   * still surface the reading rather than fail closed.
   */
  thresholdMissedAfterMaxRounds: boolean;
}

// ─── Configuration ──────────────────────────────────────────────────────

/**
 * Maximum critique rounds beyond the initial generation. Set to 2 — enough
 * to recover from a bad first attempt and a marginal second attempt without
 * unbounded blast radius on cost or latency.
 */
const MAX_CRITIQUE_ROUNDS = 2;

/**
 * Score floor below which a regeneration is triggered. Mirrors the
 * thresholds documented in the parent plan amendment (PR #63):
 *   - overall ≤ 3 → holistic failure
 *   - antiBarnum ≤ 3 → load-bearing wedge per baseline data
 *   - voiceAuthenticity ≤ 3 → understated-voice tail cases
 *
 * Anti-template is intentionally absent — the baseline showed Sonnet at
 * 5.00 across all 36 cells, so critiquing that axis would burn compute
 * without recovering quality.
 */
function shouldRegenerate(judge: JudgeResult): boolean {
  const s = judge.scores;
  return s.overall <= 3 || s.antiBarnum <= 3 || s.voiceAuthenticity <= 3;
}

// ─── Feedback construction ──────────────────────────────────────────────

/**
 * Translate a judge result into a prompt-ready feedback block. Includes
 * the failing axis scores AND the judge's specific violations + rationale
 * — the model needs the WHY, not just the WHAT, to actually fix the issues.
 *
 * Exported for tests.
 */
export function buildFeedbackFromJudge(judge: JudgeResult): string {
  const s = judge.scores;
  const failingAxes: string[] = [];
  if (s.overall <= 3) failingAxes.push(`overall=${s.overall}/5`);
  if (s.antiBarnum <= 3) failingAxes.push(`antiBarnum=${s.antiBarnum}/5 (too many vague universal statements that could fit any reader)`);
  if (s.voiceAuthenticity <= 3) failingAxes.push(`voiceAuthenticity=${s.voiceAuthenticity}/5 (the sign-specific voice is too generic)`);

  const violations = judge.violations.length > 0
    ? `Specific violations the judge flagged:\n${judge.violations.map(v => `  - ${v}`).join('\n')}`
    : '';
  const rationale = judge.rationale
    ? `Judge's overall read: ${judge.rationale}`
    : '';

  return [
    `Failing axes: ${failingAxes.join(', ') || '(threshold tripped — see scores)'}`,
    violations,
    rationale,
  ].filter(Boolean).join('\n\n');
}

// ─── Composer ───────────────────────────────────────────────────────────

export async function generateReadingWithCritique(
  input: GenerateWithCritiqueInput,
): Promise<GenerateWithCritiqueResult> {
  let reading: ReadingOutput;
  let judge: JudgeResult;
  let rounds = 0;
  let feedback: string | undefined;

  // Round 0: initial attempt. Subsequent iterations regenerate with the
  // judge's feedback until either the threshold is met or we hit the round
  // budget. Each iteration is exactly 1 generation + 1 judge — bounded by
  // (1 + MAX_CRITIQUE_ROUNDS) total of each.
  while (true) {
    const generateInput: GenerateReadingInput = {
      sign: input.sign,
      philosopher: input.philosopher,
      date: input.date,
      feedback,
    };

    reading = await generateReading(generateInput);
    judge = await judgeReading({
      reading: {
        message: reading.message,
        inspirationalQuote: reading.inspirationalQuote,
        quoteAuthor: reading.quoteAuthor,
        peacefulThought: reading.peacefulThought,
      },
      sign: input.sign,
      philosopher: input.philosopher,
    });

    if (!shouldRegenerate(judge)) {
      console.log(`[reading:generate-with-critique] ${input.sign}/${input.philosopher} accepted at round ${rounds} (overall=${judge.scores.overall}, antiBarnum=${judge.scores.antiBarnum}, voice=${judge.scores.voiceAuthenticity})`);
      return { reading, judge, rounds, thresholdMissedAfterMaxRounds: false };
    }

    if (rounds >= MAX_CRITIQUE_ROUNDS) {
      console.warn(`[reading:generate-with-critique] ${input.sign}/${input.philosopher} still below threshold after ${rounds} critique rounds (overall=${judge.scores.overall}, antiBarnum=${judge.scores.antiBarnum}, voice=${judge.scores.voiceAuthenticity}). Surfacing last attempt.`);
      return { reading, judge, rounds, thresholdMissedAfterMaxRounds: true };
    }

    // Build feedback for the next round and continue.
    feedback = buildFeedbackFromJudge(judge);
    rounds++;
    console.log(`[reading:generate-with-critique] ${input.sign}/${input.philosopher} round ${rounds - 1} below threshold (overall=${judge.scores.overall}, antiBarnum=${judge.scores.antiBarnum}, voice=${judge.scores.voiceAuthenticity}); regenerating with feedback.`);
  }
}
