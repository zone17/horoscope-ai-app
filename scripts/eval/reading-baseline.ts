#!/usr/bin/env npx tsx
/**
 * Reading baseline eval — PR B.5
 *
 * Generates daily readings across 12 signs × 3 representative philosophers ×
 * 4 model conditions, then scores each via reading:judge. Produces machine-
 * readable JSON and a human-facing summary in docs/evals/, then makes a
 * data-grounded recommendation for which model PR C should adopt.
 *
 * Models compared:
 *   - openai/gpt-4o-mini       (current production incumbent)
 *   - anthropic/claude-haiku-4.5
 *   - anthropic/claude-sonnet-4.6
 *   - anthropic/claude-opus-4.7  (ceiling check)
 *
 * Philosophers chosen to span voice registers:
 *   - Seneca         (Stoic, deep public-domain corpus, 1st c. AD Latin via translation)
 *   - Alan Watts     (Eastern wisdom, mid-20th c., spoken-word transcripts)
 *   - Naval Ravikant (Contemporary, podcast/Twitter idiom)
 *
 * Usage:
 *   npx tsx scripts/eval/reading-baseline.ts                  # full run (144 readings)
 *   npx tsx scripts/eval/reading-baseline.ts --limit 4        # smoke: 4 readings only
 *   npx tsx scripts/eval/reading-baseline.ts --signs aries    # filter to specific signs
 *
 * Requires env: AI_GATEWAY_API_KEY (and OPENAI_API_KEY only if you also want
 * to compare the legacy SDK path, which this script does NOT — all four
 * candidates route through the AI Gateway for apples-to-apples comparison).
 *
 * Estimated cost: ~$1 worst-case (mostly Opus + Sonnet generation tokens).
 */

import { config } from 'dotenv';
// Load .env.local first (developer's working file). Then .env.eval as an
// override for keys you don't want to keep in .env.local (e.g., values
// pulled fresh from `vercel env pull .env.eval --environment=development`
// for AI_GATEWAY_API_KEY without overwriting your local overrides).
config({ path: '.env.local' });
config({ path: '.env.eval', override: true });

import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { generateObject, MODELS } from '../../src/tools/ai/provider';
import { buildReadingPrompt } from '../../src/tools/reading/generate';
import { judgeReading, type JudgeResult } from '../../src/tools/reading/judge';
import { ReadingOutputModelSchema, type ReadingOutputModel } from '../../src/tools/reading/types';
import { VALID_SIGNS, type ValidSign } from '../../src/tools/zodiac/sign-profile';

// ─── Config ─────────────────────────────────────────────────────────────

const EVAL_DATE = '2026-04-25';
const PHILOSOPHERS = ['Seneca', 'Alan Watts', 'Naval Ravikant'] as const;

// Model conditions compared in this eval. The three Anthropic candidates are
// referenced through the MODELS chokepoint per HANDOFF §12 Pitfall #14 — if
// MODELS.haiku ever rotates to a newer ID, this eval automatically tracks
// the rotation instead of silently measuring the old version. The incumbent
// gpt-4o-mini is intentionally a string literal because it is NOT in MODELS:
// the chokepoint deliberately excludes the legacy provider, so this is the
// one place the literal is the source of truth (it is the contrast arm).
const MODEL_CONDITIONS = [
  { id: 'openai/gpt-4o-mini', label: 'gpt-4o-mini (incumbent)' },
  { id: MODELS.haiku, label: 'Haiku 4.5' },
  { id: MODELS.sonnet, label: 'Sonnet 4.6' },
  { id: MODELS.opus, label: 'Opus 4.7' },
] as const;

const OUTPUT_DIR = join(process.cwd(), 'docs/evals');
const CHECKPOINT_PATH = join(OUTPUT_DIR, `${EVAL_DATE}-baseline.checkpoint.json`);
const RESULTS_PATH = join(OUTPUT_DIR, `${EVAL_DATE}-baseline.json`);
const SUMMARY_PATH = join(OUTPUT_DIR, `${EVAL_DATE}-baseline.md`);

// ─── Args ───────────────────────────────────────────────────────────────

interface CliArgs {
  limit?: number;
  signs?: ValidSign[];
  resume: boolean;
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  const out: CliArgs = { resume: true };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--limit') out.limit = Number(args[++i]);
    else if (args[i] === '--signs') {
      const list = args[++i].split(',').map(s => s.trim().toLowerCase()) as ValidSign[];
      const invalid = list.filter(s => !(VALID_SIGNS as readonly string[]).includes(s));
      if (invalid.length > 0) {
        console.error(`[eval] Invalid signs: ${invalid.join(', ')}`);
        process.exit(1);
      }
      out.signs = list;
    } else if (args[i] === '--no-resume') out.resume = false;
  }
  return out;
}

// ─── Result shape ───────────────────────────────────────────────────────

interface EvalRow {
  sign: ValidSign;
  philosopher: string;
  modelId: string;
  modelLabel: string;
  parsedReading: ReadingOutputModel | null;
  generationError: string | null;
  judge: JudgeResult | null;
  judgeError: string | null;
  durationMs: number;
}

// ─── Run a single (sign, philosopher, model) cell ──────────────────────

async function runOneCell(
  sign: ValidSign,
  philosopher: string,
  model: { id: string; label: string },
): Promise<EvalRow> {
  const t0 = Date.now();
  const row: EvalRow = {
    sign, philosopher,
    modelId: model.id, modelLabel: model.label,
    parsedReading: null, generationError: null,
    judge: null, judgeError: null, durationMs: 0,
  };

  try {
    const prompt = buildReadingPrompt({ sign, philosopher, date: EVAL_DATE });
    // generateObject + ReadingOutputModelSchema is the production transport
    // (PR C). Using the canonical schema keeps the eval and the production
    // verb on the same JSON-mode mechanism — apples-to-apples across all
    // four models, single source of truth for the shape, no drift.
    const { object } = await generateObject({
      model: model.id,
      schema: ReadingOutputModelSchema,
      prompt,
      maxOutputTokens: 800,
    });
    row.parsedReading = object;

    try {
      row.judge = await judgeReading({
        reading: {
          message: object.message,
          inspirationalQuote: object.inspirationalQuote,
          quoteAuthor: object.quoteAuthor,
          peacefulThought: object.peacefulThought,
        },
        sign,
        philosopher,
      });
    } catch (e) {
      row.judgeError = (e as Error).message;
    }
  } catch (e) {
    row.generationError = `Generation failed: ${(e as Error).message}`;
  }

  row.durationMs = Date.now() - t0;
  return row;
}

// ─── Aggregation for the summary doc ───────────────────────────────────

interface ModelStats {
  label: string;
  count: number;
  generationFailures: number;
  judgeFailures: number;
  meanScores: { voiceAuthenticity: number; antiBarnum: number; antiTemplate: number; quoteFidelity: number; overall: number };
  worstSignByOverall: { sign: ValidSign; score: number } | null;
}

function emptyStats(label: string): ModelStats {
  return {
    label, count: 0, generationFailures: 0, judgeFailures: 0,
    meanScores: { voiceAuthenticity: 0, antiBarnum: 0, antiTemplate: 0, quoteFidelity: 0, overall: 0 },
    worstSignByOverall: null,
  };
}

function aggregate(rows: EvalRow[]): {
  byModel: Record<string, ModelStats>;
  bySignByModel: Record<string, Record<ValidSign, number | null>>;
  byPhilosopherByModel: Record<string, Record<string, number | null>>;
} {
  const byModel: Record<string, ModelStats> = {};
  const bySignByModel: Record<string, Record<ValidSign, number | null>> = {};
  const byPhilosopherByModel: Record<string, Record<string, number | null>> = {};

  for (const cond of MODEL_CONDITIONS) {
    byModel[cond.id] = emptyStats(cond.label);
    bySignByModel[cond.id] = Object.fromEntries(VALID_SIGNS.map(s => [s, null])) as Record<ValidSign, number | null>;
    byPhilosopherByModel[cond.id] = Object.fromEntries(PHILOSOPHERS.map(p => [p, null])) as Record<string, number | null>;
  }

  // Group rows for averaging
  const sumByModel: Record<string, { v: number; b: number; t: number; q: number; o: number; n: number }> = {};
  const signOverallByModel: Record<string, Record<ValidSign, number[]>> = {};
  const phlOverallByModel: Record<string, Record<string, number[]>> = {};
  for (const cond of MODEL_CONDITIONS) {
    sumByModel[cond.id] = { v: 0, b: 0, t: 0, q: 0, o: 0, n: 0 };
    signOverallByModel[cond.id] = Object.fromEntries(VALID_SIGNS.map(s => [s, []])) as Record<ValidSign, number[]>;
    phlOverallByModel[cond.id] = Object.fromEntries(PHILOSOPHERS.map(p => [p, []])) as Record<string, number[]>;
  }

  for (const row of rows) {
    const stats = byModel[row.modelId];
    if (!stats) continue;
    stats.count++;
    if (row.generationError) stats.generationFailures++;
    if (row.judgeError) stats.judgeFailures++;
    if (row.judge) {
      const s = row.judge.scores;
      const sum = sumByModel[row.modelId];
      sum.v += s.voiceAuthenticity;
      sum.b += s.antiBarnum;
      sum.t += s.antiTemplate;
      sum.q += s.quoteFidelity;
      sum.o += s.overall;
      sum.n++;
      signOverallByModel[row.modelId][row.sign].push(s.overall);
      phlOverallByModel[row.modelId][row.philosopher].push(s.overall);
    }
  }

  for (const cond of MODEL_CONDITIONS) {
    const sum = sumByModel[cond.id];
    if (sum.n > 0) {
      byModel[cond.id].meanScores = {
        voiceAuthenticity: sum.v / sum.n,
        antiBarnum: sum.b / sum.n,
        antiTemplate: sum.t / sum.n,
        quoteFidelity: sum.q / sum.n,
        overall: sum.o / sum.n,
      };
    }
    let worst: { sign: ValidSign; score: number } | null = null;
    for (const sign of VALID_SIGNS) {
      const arr = signOverallByModel[cond.id][sign];
      if (arr.length === 0) { bySignByModel[cond.id][sign] = null; continue; }
      const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
      bySignByModel[cond.id][sign] = mean;
      if (worst === null || mean < worst.score) worst = { sign, score: mean };
    }
    byModel[cond.id].worstSignByOverall = worst;
    for (const phl of PHILOSOPHERS) {
      const arr = phlOverallByModel[cond.id][phl];
      byPhilosopherByModel[cond.id][phl] = arr.length === 0 ? null : arr.reduce((a, b) => a + b, 0) / arr.length;
    }
  }

  return { byModel, bySignByModel, byPhilosopherByModel };
}

// ─── Summary writer ────────────────────────────────────────────────────

function fmt(n: number | null, digits = 2): string {
  if (n === null || Number.isNaN(n)) return '—';
  return n.toFixed(digits);
}

function writeSummary(rows: EvalRow[]): string {
  const { byModel, bySignByModel, byPhilosopherByModel } = aggregate(rows);

  // Pick recommendation: highest overall mean, with worst-sign-floor as tiebreaker
  const ranked = MODEL_CONDITIONS
    .map(c => ({ cond: c, stats: byModel[c.id] }))
    .filter(x => x.stats.count > 0)
    .sort((a, b) => {
      const dOverall = b.stats.meanScores.overall - a.stats.meanScores.overall;
      if (Math.abs(dOverall) > 0.05) return dOverall;
      // Tiebreak on worst-sign floor (we care about variance across signs)
      const aFloor = a.stats.worstSignByOverall?.score ?? -Infinity;
      const bFloor = b.stats.worstSignByOverall?.score ?? -Infinity;
      return bFloor - aFloor;
    });
  const winner = ranked[0]?.cond;
  const incumbent = byModel['openai/gpt-4o-mini'];

  const lines: string[] = [];
  lines.push(`# Reading Baseline Eval — ${EVAL_DATE}`);
  lines.push('');
  lines.push('> Companion to PR B.5 (`feat/reading-auth/eval-harness-baseline`).');
  lines.push('> Plan: [`docs/plans/2026-04-25-001-reading-eval-harness-and-model-baseline-plan.md`](../plans/2026-04-25-001-reading-eval-harness-and-model-baseline-plan.md)');
  lines.push('');
  lines.push(`Generated by \`scripts/eval/reading-baseline.ts\` on ${new Date().toISOString()}.`);
  lines.push(`Total rows: ${rows.length} (${PHILOSOPHERS.length} philosophers × ${MODEL_CONDITIONS.length} models × ${rows.length / (PHILOSOPHERS.length * MODEL_CONDITIONS.length)} signs).`);
  lines.push('');

  lines.push('## Per-model means (1-5)');
  lines.push('');
  lines.push('| Model | Voice | Anti-Barnum | Anti-Template | Quote Fidelity | Overall | Gen fail | Judge fail | n |');
  lines.push('|---|---|---|---|---|---|---|---|---|');
  for (const cond of MODEL_CONDITIONS) {
    const s = byModel[cond.id];
    lines.push(`| ${s.label} | ${fmt(s.meanScores.voiceAuthenticity)} | ${fmt(s.meanScores.antiBarnum)} | ${fmt(s.meanScores.antiTemplate)} | ${fmt(s.meanScores.quoteFidelity)} | **${fmt(s.meanScores.overall)}** | ${s.generationFailures} | ${s.judgeFailures} | ${s.count} |`);
  }
  lines.push('');

  lines.push('## Per-sign × per-model overall (1-5)');
  lines.push('');
  lines.push(`| Sign | ${MODEL_CONDITIONS.map(c => c.label).join(' | ')} |`);
  lines.push(`|---|${MODEL_CONDITIONS.map(() => '---').join('|')}|`);
  for (const sign of VALID_SIGNS) {
    const cells = MODEL_CONDITIONS.map(c => fmt(bySignByModel[c.id][sign]));
    lines.push(`| ${sign} | ${cells.join(' | ')} |`);
  }
  lines.push('');

  lines.push('## Per-philosopher × per-model overall (1-5)');
  lines.push('');
  lines.push(`| Philosopher | ${MODEL_CONDITIONS.map(c => c.label).join(' | ')} |`);
  lines.push(`|---|${MODEL_CONDITIONS.map(() => '---').join('|')}|`);
  for (const phl of PHILOSOPHERS) {
    const cells = MODEL_CONDITIONS.map(c => fmt(byPhilosopherByModel[c.id][phl]));
    lines.push(`| ${phl} | ${cells.join(' | ')} |`);
  }
  lines.push('');

  lines.push('## Worst-sign floor (per model)');
  lines.push('');
  lines.push('Lowest per-sign overall mean. A high average with a low floor indicates the model fails badly on specific voices (e.g., understated signs like Capricorn / Pisces / Virgo).');
  lines.push('');
  lines.push('| Model | Worst sign | Score |');
  lines.push('|---|---|---|');
  for (const cond of MODEL_CONDITIONS) {
    const w = byModel[cond.id].worstSignByOverall;
    lines.push(`| ${cond.label} | ${w?.sign ?? '—'} | ${fmt(w?.score ?? null)} |`);
  }
  lines.push('');

  lines.push('## Recommendation');
  lines.push('');
  if (winner && incumbent && incumbent.count > 0) {
    const w = byModel[winner.id];
    const delta = w.meanScores.overall - incumbent.meanScores.overall;
    lines.push(`**PR C should adopt \`${winner.id}\` (${winner.label}).**`);
    lines.push('');
    lines.push(`- Overall mean: **${fmt(w.meanScores.overall)}** vs incumbent (\`gpt-4o-mini\`) **${fmt(incumbent.meanScores.overall)}** — delta **${delta >= 0 ? '+' : ''}${fmt(delta)}**.`);
    lines.push(`- Worst-sign floor: ${w.worstSignByOverall ? `${w.worstSignByOverall.sign} @ ${fmt(w.worstSignByOverall.score)}` : '—'} vs incumbent ${incumbent.worstSignByOverall ? `${incumbent.worstSignByOverall.sign} @ ${fmt(incumbent.worstSignByOverall.score)}` : '—'}.`);
    lines.push(`- Generation failures: ${w.generationFailures}/${w.count} vs ${incumbent.generationFailures}/${incumbent.count}.`);
    lines.push('');
    lines.push(`Caveats: judge model is Haiku 4.5 (cross-family vs gpt-4o-mini and Sonnet/Opus); single date and prompt; n=${w.count} per model. Sufficient to choose, not sufficient to publish.`);
  } else {
    lines.push('_No data available to recommend._');
  }
  lines.push('');

  lines.push('## Methodology');
  lines.push('');
  lines.push(`- Date pinned to \`${EVAL_DATE}\` to keep the format-template assignment constant across rows.`);
  lines.push('- All four models routed through Vercel AI Gateway via `generateObject` + a Zod schema mirroring `ReadingOutput`. This is the same JSON-mode mechanism PR C will adopt for `reading:generate`, so the eval is apples-to-apples and pre-validates that all four models comply with the schema.');
  lines.push('- `reading:judge` (Haiku 4.5, temperature 0.2) scores each reading on five axes against the project\'s codified criteria (sign-profile voice + avoidPatterns, banned words, astrology-template tropes, Barnum patterns, quote register).');
  lines.push('- Validators in `reading:generate` (quote-bank fallback, self-match filter) are bypassed — the eval judges raw model output, not post-call cleanup.');
  lines.push('- Raw rows committed at `docs/evals/' + EVAL_DATE + '-baseline.json`.');

  return lines.join('\n') + '\n';
}

// ─── Main ───────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs();
  if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

  const signs = (args.signs ?? VALID_SIGNS) as readonly ValidSign[];
  const allCells: Array<{ sign: ValidSign; philosopher: string; model: typeof MODEL_CONDITIONS[number] }> = [];
  for (const sign of signs) {
    for (const phl of PHILOSOPHERS) {
      for (const model of MODEL_CONDITIONS) {
        allCells.push({ sign, philosopher: phl, model });
      }
    }
  }
  const cells = args.limit ? allCells.slice(0, args.limit) : allCells;

  // Resume from checkpoint if present
  let rows: EvalRow[] = [];
  const completedKeys = new Set<string>();
  if (args.resume && existsSync(CHECKPOINT_PATH)) {
    rows = JSON.parse(readFileSync(CHECKPOINT_PATH, 'utf-8')) as EvalRow[];
    // Only treat cells with a successful judge result as completed. Failed
    // cells (gen-fail, judge-fail, schema flake) stay in `rows` for the
    // record but are eligible for retry on the next run — otherwise a
    // transient 429 burst silently becomes a permanent skip and the
    // baseline summary is built on a quietly-degraded dataset.
    let retryable = 0;
    for (const r of rows) {
      if (r.judge && !r.generationError && !r.judgeError) {
        completedKeys.add(`${r.sign}|${r.philosopher}|${r.modelId}`);
      } else {
        retryable++;
      }
    }
    console.log(`[eval] Resumed from checkpoint: ${completedKeys.size} cells complete, ${retryable} retryable failures will re-run.`);
    // Drop failed rows so the retried run can append fresh results without
    // duplicates in the final output.
    rows = rows.filter(r => r.judge && !r.generationError && !r.judgeError);
  }

  const remaining = cells.filter(c => !completedKeys.has(`${c.sign}|${c.philosopher}|${c.model.id}`));
  console.log(`[eval] Running ${remaining.length} cells (${cells.length} total, ${cells.length - remaining.length} cached).`);

  let i = 0;
  for (const cell of remaining) {
    i++;
    process.stdout.write(`[eval] ${i}/${remaining.length} ${cell.sign} / ${cell.philosopher} / ${cell.model.label} ... `);
    const row = await runOneCell(cell.sign, cell.philosopher, cell.model);
    rows.push(row);
    const status = row.generationError
      ? `gen-fail`
      : row.judgeError
        ? `judge-fail`
        : `overall=${row.judge?.scores.overall}`;
    console.log(`${status} (${row.durationMs}ms)`);
    // Checkpoint after every cell
    writeFileSync(CHECKPOINT_PATH, JSON.stringify(rows, null, 2));
  }

  // Final outputs
  writeFileSync(RESULTS_PATH, JSON.stringify(rows, null, 2));
  writeFileSync(SUMMARY_PATH, writeSummary(rows));
  console.log(`\n[eval] Wrote ${rows.length} rows.`);
  console.log(`[eval]   - ${RESULTS_PATH}`);
  console.log(`[eval]   - ${SUMMARY_PATH}`);
  console.log(`[eval]   - checkpoint: ${CHECKPOINT_PATH} (safe to delete after review)`);
}

main().catch(e => {
  console.error('[eval] Fatal:', e);
  process.exit(1);
});
