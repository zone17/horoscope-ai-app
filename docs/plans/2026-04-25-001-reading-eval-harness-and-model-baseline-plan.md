# Plan: Reading Eval Harness + Model Baseline (PR B.5)

> **Date**: 2026-04-25
> **Status**: Drafted
> **Parent initiative**: [`2026-04-24-001-reading-authenticity-and-ai-sdk-migration-plan.md`](./2026-04-24-001-reading-authenticity-and-ai-sdk-migration-plan.md)
> **Inserts before**: PR C (flag flip + model swap + `generateObject` + Zod)
> **Branch**: `feat/reading-auth/eval-harness-baseline`

## 1. Why this PR exists (and why it goes before PR C)

The parent plan calls for an A/B eval to choose between Haiku 4.5 and Sonnet 4.6 for `reading:generate`. That eval was scoped as a one-off local script — fine for picking a model, but a missed compounding opportunity. It also anchored on a 2025-era cost frame (Haiku-or-Sonnet); in April 2026 the right comparison set is wider, including the current incumbent (`gpt-4o-mini`, which landed as a default-of-convenience in PR #29 and was never re-justified) and the top of the Anthropic line (`Opus 4.7`, cheap enough for the 12-readings-per-day cron path that anything less leaves prose quality on the table without us knowing).

The same evaluation logic will be needed three more times in this initiative:
- **Phase 1c**: justify the model swap with measured authenticity scores (not vibes).
- **Phase 1d**: prove that corpus-grounded readings outperform the current voice + quote-bank path (otherwise the corpus work is faith-based).
- **Phase 1e**: the self-critique pass *is* a per-reading judge call gated on score thresholds.

If we build the judge as an **atomic verb** now (`reading:judge`) and a thin **eval harness** that composes it, we get baseline measurements for PR C *and* the load-bearing infrastructure for PRs D and E in one stroke. PR E becomes "wire `reading:judge` into `reading:generate` as a critique loop" — a much smaller scope.

## 2. Goals

1. Ship `reading:judge` as a reusable atomic verb that scores any reading against the project's authenticity criteria — including a **quote-fidelity** axis (does the inspirational quote feel authentic to the philosopher's actual register?), which is where small models fail invisibly because the bank-validator silently masks fabricated quotes.
2. Produce a baseline measurement file: 12 signs × 3 representative philosophers × **4 model conditions** (current `gpt-4o-mini`, candidate `claude-haiku-4.5`, candidate `claude-sonnet-4.6`, ceiling check `claude-opus-4.7`) = **144 readings, scored**.
3. Pick the model for PR C from the baseline data with the decision rationale committed alongside. Including Opus tells us whether Sonnet leaves prose quality on the table; without that data we'd re-run this eval in three months.
4. Surface **per-sign performance**, not just per-model means — small models often win on average while losing badly on understated voices (Capricorn, Pisces, Virgo). That asymmetry must be visible in the summary.
5. Establish the eval directory (`docs/evals/`) as the durable location for measurement artifacts going forward.

## 3. Non-goals

- **Don't flip `FEATURE_FLAG_USE_AI_SDK` in production.** This PR makes no production behavior change.
- **Don't wire `reading:judge` into the request path.** That's Phase 1e. Here it ships as a verb that's only called by the eval script and tests.
- **Don't tackle the corpus question.** The judge should not depend on corpus presence; it scores raw output against criteria.
- **Don't generalize the harness** to multi-prompt / multi-model matrix configuration. One pinned prompt, one pinned set of philosophers, three pinned models, fixed today's date. YAGNI on framework-ifying.
- **Don't add zod as a direct dependency** unless the type-only transitive import doesn't work — PR C will add it explicitly when `generateObject` lands in `reading:generate`.

## 4. Architecture (verbs not workflows)

### New verb: `reading:judge`

```
src/tools/reading/judge.ts

judgeReading({ reading, sign, philosopher }) → JudgeResult

JudgeResult {
  scores: {
    voiceAuthenticity: 1-5      // matches the sign profile's voice + avoidPatterns
    antiBarnum: 1-5             // would this only fit this sign on this day?
    antiTemplate: 1-5           // free of horoscope-template clichés
    quoteFidelity: 1-5          // quote feels like the philosopher's actual register
                                // (catches plausible-sounding fabrications that the
                                // bank-validator silently masks via fallback)
    overall: 1-5                // holistic
  }
  violations: string[]          // specific phrase-level findings
  rationale: string             // 1-3 sentences explaining the scores
}
```

- Pure verb (no I/O beyond the model call). Deterministic-ish: temperature pinned low; same input → similar output.
- Uses `generateObject` from `@/tools/ai/provider` with a Zod schema.
- Model: `MODELS.haiku` — cheap, fast, well-suited for structured critique. Cost at 108 judgments × ~600 tokens out ≈ negligible.
- The judge prompt encodes the project's banned-word list, sign-specific avoidPatterns, Barnum-pattern definitions, and astrology-template tropes. This codifies the "anti-template moat" criteria from the parent plan in machine-readable form.

### Eval script: `scripts/eval/reading-baseline.ts`

```
scripts/eval/reading-baseline.ts

For each (sign in VALID_SIGNS, philosopher in [Seneca, Alan Watts, Naval Ravikant], model in [gpt-4o-mini, haiku, sonnet, opus]):
  prompt = buildReadingPrompt({ sign, philosopher, date: '2026-04-25' })
  reading = generateText({ model, prompt })            // raw call; bypasses validators (we judge prose)
  parsed = JSON.parse(reading.text)
  judge = judgeReading({ reading: parsed, sign, philosopher })
  collect into results[]

Write results to:
  docs/evals/2026-04-25-baseline.json    (raw machine-readable, all 144 entries)
  docs/evals/2026-04-25-baseline.md      (human summary: per-model means, per-sign matrix,
                                          per-philosopher breakdown, deltas, decision)
```

- 3 chosen philosophers span the spectrum: **Seneca** (Stoic, deep public-domain corpus), **Alan Watts** (Eastern, mid-20th-c., partial PD), **Naval Ravikant** (contemporary, Twitter/podcast voice). This stresses the model on three quite different voices.
- Date pinned to today (`2026-04-25`) so all rows share format-template assignment, isolating model-quality variance from format variance.
- Script is run manually (`npx tsx scripts/eval/reading-baseline.ts`) and outputs are committed to the repo. No cron, no CI integration — this is one-shot infrastructure for a decision.

### Composition

- `reading:judge` reads `getSignProfile().avoidPatterns` from `@/tools/zodiac/sign-profile` — composes existing data, doesn't duplicate.
- Eval script imports `buildReadingPrompt` (already exported from `reading:generate`) — composes the prompt builder without going through the production `generateReading` validators (those are correctness/safety, not quality).
- Baseline data itself becomes a reusable fixture for future phases (PR D corpus eval can compare against it).

## 5. Files

```
ADDED:
  docs/plans/2026-04-25-001-...-plan.md        (this file)
  src/tools/reading/judge.ts                   (the verb)
  __tests__/tools/reading/judge.test.ts        (mocked AI SDK; ~5 tests)
  scripts/eval/reading-baseline.ts             (the harness)
  docs/evals/2026-04-25-baseline.json          (raw data, after run)
  docs/evals/2026-04-25-baseline.md            (human summary, after run)
  docs/evals/README.md                         (one-pager: what this dir is for)

MODIFIED:
  docs/plans/2026-04-24-001-...-plan.md        (insert PR B.5 row in progress tracker)
  docs/HANDOFF.md                              (mention judge verb + baseline data)
```

No production code changes. `reading:generate` is untouched.

## 6. Tests

- `__tests__/tools/reading/judge.test.ts` (`@jest-environment node`, AI SDK pattern):
  1. Returns parsed `JudgeResult` matching the Zod schema when the model returns valid structured output.
  2. Throws (or surfaces a clear error) when the model returns malformed output (relies on `generateObject`'s built-in retry/throw behavior; we test that we propagate it).
  3. Composes the sign profile's `avoidPatterns` into the judge prompt (snapshot or string-contains assertion).
  4. Composes the global banned-word list into the judge prompt.
  5. Pins the model to `MODELS.haiku` (cost guardrail — assert the model arg).

The eval script itself is not unit-tested — it's a one-shot operator script. Smoke-tested by running it once.

## 7. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Judge bias toward the model that wrote the reading | Use a *different* judge model (Haiku) than any candidate it scores. Sonnet is in the candidate set; Haiku judges. gpt-4o-mini is in the candidate set; Haiku judges. Cross-family judging reduces in-family bias but doesn't eliminate it — flag this caveat in the baseline `.md` summary. |
| Single-day, single-prompt eval is shallow | Acknowledged. This is a baseline, not a pre-registered trial. PR C's confidence is "Sonnet beats Haiku by X on these criteria for this prompt" — sufficient to choose, not sufficient to publish. |
| Cost overrun | 144 readings + 144 judgments × ~600 tokens each ≈ 175K tokens. ~$1 worst-case (mostly Opus). Negligible. |
| `generateObject` Zod schema drift between AI SDK versions | Pin behavior in a unit test. If the schema fails, the judge fails closed (no false-positive scores leaking into the baseline). |
| Naval / Watts produce structurally weaker readings on `gpt-4o-mini` than Seneca, biasing the model comparison | Report results per-philosopher AND per-model. The summary `.md` shows the matrix. |
| Eval data committed to the repo grows unboundedly over time | Convention: one summary per major decision point, stored under `docs/evals/{date}-{slug}.{json,md}`. Old runs stay for historical comparison. |

## 8. Success criteria

This PR ships when:
- `reading:judge` is implemented, tested (5 passing tests), and exports a clean `JudgeResult` shape.
- `npx tsx scripts/eval/reading-baseline.ts` runs end-to-end, writes both output files.
- `docs/evals/2026-04-25-baseline.md` includes a per-model mean-score table, a per-sign × per-model matrix (12 × 4), a per-philosopher breakdown, and a recommendation: **"PR C should use {gpt-4o-mini | Haiku 4.5 | Sonnet 4.6 | Opus 4.7} because {data-grounded reason citing both averages and worst-case sign performance}"**.
- Parent plan's progress tracker is updated with PR B.5 row.
- `HANDOFF.md` mentions the new verb and where baseline data lives.

## 9. Out of scope (deferred to subsequent PRs)

- **Composing** `reading:judge` with `reading:generate` as a critique-and-regenerate loop **at the call site** (cron route, agent runtime, or test harness) → Phase 1e. **Not** a fold-in to `reading:generate` itself — that would make `reading:generate` a workflow. The two verbs stay independent; callers compose them when they want critique. This wording shift in the parent plan is being made in the same PR as this one.
- Exposing `reading:judge` as an MCP tool → trivial after this lands; bundle with PR D or E.
- Building a more rigorous A/B eval framework (multiple seeds, statistical tests) → only if PR C's baseline shows ambiguous results.
- Per-philosopher voice profiles to feed into the judge → Phase 1d corpus work supersedes this.

## 10. Estimated effort

- Plan doc (this): done.
- `reading:judge` verb + tests: ~60–90 min.
- Eval harness script: ~30–45 min.
- Run + write baseline summary + decision: ~30 min (including waiting on 108 sequential model calls).
- Parent plan + HANDOFF updates: ~15 min.
- Multi-persona review + remediation + merge: ~60 min.

**Total: ~3.5–4.5 hours of focused work for a one-PR change that unblocks PR C and de-risks PRs D and E.**
