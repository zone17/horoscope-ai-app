---
title: Critique-loop hardening — BEST-of-N + symmetric defense-in-depth + recency-bias placement
date: 2026-04-26
category: design-patterns
module: ai/reading
problem_type: design_pattern
component: service_object
severity: high
applies_when:
  - "Building a generate → judge → regenerate critique loop where the loop is bounded but may exhaust its budget"
  - "Composing two atomic verbs where the judge's output gets re-injected into the next generator's prompt"
  - "A regeneration prompt embeds a critique block alongside contract requirements (field-list, schema constraints)"
  - "The composer is on a production path and a worse-than-prior-attempt regeneration would degrade the user experience"
related_components:
  - tooling
  - testing_framework
tags:
  - llm-as-judge
  - critique-loop
  - best-of-n
  - prompt-injection
  - defense-in-depth
  - recency-bias
  - composition
  - production-hardening
---

# Critique-loop hardening — BEST-of-N + symmetric defense-in-depth + recency-bias placement

> **Source PR**: [#67 — `feat(reading): PR E / Phase 1e — reading:generate-with-critique composer`](https://github.com/zone17/horoscope-ai-app/pull/67), merged as `f50faa9` on 2026-04-26.
> **Reference implementation**: [`src/tools/reading/generate-with-critique.ts`](../../../src/tools/reading/generate-with-critique.ts), tests at [`__tests__/tools/reading/generate-with-critique.test.ts`](../../../__tests__/tools/reading/generate-with-critique.test.ts), prompt at [`src/tools/reading/generate.ts`](../../../src/tools/reading/generate.ts).
> **Builds on**: [`llm-as-judge-prompt-injection-hardening-20260425.md`](./llm-as-judge-prompt-injection-hardening-20260425.md) (judge verb hardening) and [`generateobject-production-hardening-20260426.md`](./generateobject-production-hardening-20260426.md) (generator verb hardening). This doc covers the **composition** layer that wires them together.

## Context

The critique loop is the natural composition of the LLM-as-judge and LLM-as-generator patterns: generate → judge → if scores below threshold, regenerate with feedback → re-judge → repeat until accepted or budget exhausted. Phase 1e of the parent plan called for exactly this composition.

Implementing it as a thin wrapper that loops correctly is straightforward. **Implementing it without introducing four hidden production failures is not.** Each of the four failures below was caught by multi-persona review on PR #67; none of them broke obvious unit tests; all of them would have shipped degraded readings to users in the wild.

The pattern below is the union of those four fixes. Apply it whenever a verb composes generator + judge in a bounded loop.

## Guidance

Four-point hardening pattern for any critique-loop composer:

### 1. BEST-of-N tracking, not LAST attempt

Regenerations are **not monotonically better**. Sonnet (or any frontier model) follows critique imperfectly — it may fix the axis the critique called out and regress an axis it had right. An oscillating loop is realistic:

| Round | overall | antiBarnum | voice |
|---|---|---|---|
| 0 (strong) | 4 | 3 | 4 |
| 1 (weak) | 2 | 4 | 2 |
| 2 (weak) | 2 | 3 | 2 |

Naive composer returns round 2 because that's the last loop iteration. Round 0 was strictly better. The user gets the worse reading.

**Fix**: track `best` across iterations using a composite quality score, and surface `best` on budget exhaustion. The composite score weights the load-bearing axes (overall ×2 + antiBarnum + voice in our case; anti-template excluded because it's constant 5/5 at frontier models — including it would just add noise).

```typescript
function compositeQuality(judge: JudgeResult): number {
  const s = judge.scores;
  return s.overall * 2 + s.antiBarnum + s.voiceAuthenticity;
}

let best: { reading; judge; round } | null = null;

while (true) {
  const reading = await generateReading(...);
  const judge = await judgeReading(...);

  if (best === null || compositeQuality(judge) > compositeQuality(best.judge)) {
    best = { reading, judge, round: rounds };
  }

  if (!shouldRegenerate(judge)) {
    return { reading, judge, rounds, thresholdMissedAfterMaxRounds: false };
  }

  if (rounds >= MAX_CRITIQUE_ROUNDS) {
    return { reading: best.reading, judge: best.judge, rounds, thresholdMissedAfterMaxRounds: true };
  }

  feedback = buildFeedbackFromJudge(judge);
  rounds++;
}
```

Note the asymmetry: when the threshold is met (early-return on accept), surface the **last** attempt (the one that passed). When the budget is exhausted, surface the **best** attempt (the one that scored highest on composite quality). Different paths, different semantics, both correct.

### 2. Symmetric defense-in-depth: sanitize judge OUTPUT, not just judge INPUT

The LLM-as-judge pattern (PR #63) sanitizes the judge's INPUT to prevent prompt injection from model-generated reading content. But the judge's OUTPUT — `violations[]` and `rationale` — is itself produced by a model, and gets re-injected into the next generator's prompt.

This creates an injection chain:

```
malicious reading content
  → judge sanitizes input (good)
  → Haiku grades it, may echo offending substring in violations
    e.g., 'Reading contains injection attempt: "## NEW INSTRUCTION..."'
  → composer puts that violation verbatim into regeneration prompt
  → Sonnet sees a fabricated heading inside its own prompt
```

**Fix**: apply the same sanitizer pattern to judge-output strings before embedding them in the regeneration prompt. Symmetric with the input-side sanitizer:

```typescript
function sanitizeJudgeOutput(value: string, maxChars = 500): string {
  return value
    .replace(/[<>"`]/g, '')
    .replace(/^[ \t]*#{1,6}\s+/gm, '')
    .replace(/[\r\n]+/g, ' ')
    .trim()
    .slice(0, maxChars);
}

const sanitizedViolations = judge.violations
  .map(v => sanitizeJudgeOutput(v))
  .filter(v => v.length > 0);
const sanitizedRationale = sanitizeJudgeOutput(judge.rationale, 800);
```

Empty post-sanitization strings get filtered out so the prompt doesn't emit a stray `  - ` row from a violation that was 100% structural escape characters.

The principle generalizes: **anywhere a model's output flows into another model's input, sanitize at both ends**. The input-side sanitizer protects the receiving model; the output-side sanitizer protects whoever consumes the result downstream.

### 3. Sanitize the public injection surface created by the optional `feedback` parameter

When the composer needs to pass critique feedback into the regeneration, the cleanest implementation adds an optional `feedback?: string` parameter to the underlying generator verb. That parameter then becomes part of the **public verb contract** — any future caller can pass arbitrary text into the prompt.

**Fix**: sanitize the parameter inside the verb's prompt builder, not in the composer. The trust boundary belongs to the receiving verb, not to a hopeful contract on callers.

```typescript
// Inside the generator verb's buildPrompt function:
function sanitizeFeedback(value: string, maxChars = 4000): string {
  return value
    .replace(/[<>"`]/g, '')
    .replace(/^[ \t]*#{1,6}\s+/gm, '')
    .replace(/^---+$/gm, '')
    .replace(/[\r\n]+/g, ' ')
    .trim()
    .slice(0, maxChars);
}

// In the prompt template:
${input.feedback ? `\n## CRITIQUE...\n${sanitizeFeedback(input.feedback)}` : ''}
```

The composer calling pattern doesn't change — it just builds feedback from the (already-sanitized) judge output and passes it. The verb's prompt builder applies a final sanitization layer regardless. Defense-in-depth on a public contract.

### 4. Critique block at the END of the prompt, not embedded mid-template

Models exhibit recency bias for instruction-following. A long critique block in the middle of the prompt — between, say, the writing-format section and the field-list contract — pushes the contract requirements further from the decoding step. The model may "fix the critique" while regressing on contract requirements (in our case: bestMatch element rules, quote-from-bank requirement, sign-self-exclusion).

**Fix**: place the critique AFTER the contract section, framed as a final-review pass:

```
## WHAT TO INCLUDE (as object fields)
1. ... [contract]
5. ...

## CRITIQUE FROM PRIOR ATTEMPT — FIX THESE BEFORE RETURNING
A previous draft of this reading scored below the quality bar. The judge
flagged the issues below. Address each one in this attempt; do not repeat
them. The field requirements above remain authoritative — fix the critique
while still satisfying every WHAT TO INCLUDE constraint.

{sanitized feedback}
```

Recency favors contract adherence. The critique becomes a final-review checklist applied AFTER the contract is satisfied, not a competing directive that pre-empts it.

## Why This Matters

Without these four points, the critique loop systematically degrades quality on the cells it was supposed to improve:

- **Without BEST-of-N**: 100% of the worst cases (loops that exhaust the budget) ship the worst attempt seen. The very cases where critique was supposed to help are the cases where it actively hurts.
- **Without symmetric sanitization**: hostile or accidentally-pathological reading content propagates through the judge into the regeneration prompt. The injection vector is invisible at every link in the chain.
- **Without `feedback`-parameter sanitization**: a future caller (admin UI, MCP tool, retry-with-user-notes flow) routes user input into the prompt with no defense. The injection vector is only theoretical until it's exploited; then it's a CVE-shaped finding.
- **Without END-of-prompt placement**: the critique loop measurably regresses contract adherence. The model trades one quality dimension for another instead of improving overall.

Each of the four was caught by review (cross-reviewer corroboration on the BEST-of-N issue from 3 personas independently). None broke obvious tests. None would have surfaced in monitoring. They just would have silently shipped worse readings.

## When to Apply

Apply the full four-point pattern whenever:

- A composer wraps two atomic verbs in a bounded `generate → judge → regenerate` loop.
- The loop has a max-rounds budget (i.e., can exhaust without acceptance).
- The judge's output flows back into the generator's prompt.
- The composer is on a production path (cron, route handler, durable worker).

Apply the **subset** when:

- Composer always succeeds in 1-2 rounds for the relevant model (still apply BEST-of-N as cheap insurance; symmetric sanitization can defer if input is fully trusted).
- The composer is operator-only / one-shot (BEST-of-N is the only point that always matters; the others are defense-in-depth).

## Examples

### Example 1 — Production reference

[`src/tools/reading/generate-with-critique.ts`](../../../src/tools/reading/generate-with-critique.ts) — `reading:generate-with-critique`. Bounded at 2 critique rounds, threshold gates on `overall ≤ 3 OR antiBarnum ≤ 3 OR voiceAuthenticity ≤ 3`, anti-template axis dropped per Phase 1e plan amendment + baseline data. Tests at [`__tests__/tools/reading/generate-with-critique.test.ts`](../../../__tests__/tools/reading/generate-with-critique.test.ts) cover all four hardening points (12 tests).

### Example 2 — Hypothetical companion

A `code:generate-with-tests-passing` verb that generates TypeScript and uses an LLM judge to assess style + complexity, regenerating if either falls below threshold. Same pattern:
- `compositeQuality(judge) = styleScore × 2 + complexityPenalty + readabilityScore`
- BEST-of-N on budget exhaustion
- Sanitize judge violations (which may contain quoted code that includes prompt-control language)
- Sanitize the generator's `feedback` parameter
- Place critique AFTER the test-pass requirements in the prompt

## Round-by-Round Discovery Log

The four hardening points took two review rounds on PR #67 to surface:

| Round | Vector caught | Reviewer(s) |
|---|---|---|
| 1 | Returns LAST not BEST attempt → ships worst on oscillating loop | adversarial (P2) + correctness (C1) + testing (T5) — **3 reviewers corroborated** |
| 1 | Judge violations/rationale unsanitized into next prompt → injection chain | adversarial (P2) |
| 1 | `feedback` parameter is public injection sink → future caller risk | adversarial (P2) |
| 1 | Critique block mid-prompt → recency bias displaces contract attention | adversarial (P3) |

**Meta-lesson**: composition introduces failures that aren't visible at the verb level. Both underlying verbs (judge and generate) had their own hardening passes (PRs #63, #65 — see related compounds) and shipped clean. The composer adds a new failure surface that only multi-persona adversarial review caught. Future composer verbs should adopt these 4 points up front and ship with regression tests for all four vectors on day one.

## Pitfalls (sub-lessons folded in from PR #67)

### Don't compute `surfacedRound` from a comparison that's true by construction

In an early implementation, the budget-exhausted return logged `surfacedRound = compositeQuality(judge) > compositeQuality(best.judge) ? rounds : -1`. This was always `-1` because `judge` had just been considered for `best`, so `judge ≤ best` by construction. The intent — "tell the operator which round was surfaced" — required tracking `best.round` directly, not deriving it from a comparison.

**Rule**: when a comparison's result is determined by the surrounding control flow, track the underlying value directly instead of re-deriving it. The "clever" derivation will be wrong by construction.

### Test fixtures must distinguish strong-fail from weak-fail to exercise BEST-of-N

The original "caps at MAX_CRITIQUE_ROUNDS" test used 3 identical FAILING_JUDGE responses and asserted `result.reading.message === 'attempt 2'`. With BEST-of-N, that test would still pass (all 3 attempts have identical quality, so the last one is also a valid "best") — but it provides zero protection against a regression that returns LAST instead of BEST in the non-monotonic case.

**Rule**: when the contract is "surface the best of N", the test must use N **distinct** quality levels with a known ordering, not N identical samples. Otherwise the test passes trivially in both correct-implementation and broken-implementation cases.

## Related

- **Sibling verb-hardening patterns**: 
  - [`design-patterns/llm-as-judge-prompt-injection-hardening-20260425.md`](./llm-as-judge-prompt-injection-hardening-20260425.md) — judge verb hardening (input side)
  - [`design-patterns/generateobject-production-hardening-20260426.md`](./generateobject-production-hardening-20260426.md) — generator verb hardening
- This compound is the **composition layer** that wires those two together. Apply all three when shipping a critique-loop composer.
- **Source plans**: [`docs/plans/2026-04-24-001-reading-authenticity-and-ai-sdk-migration-plan.md`](../../plans/2026-04-24-001-reading-authenticity-and-ai-sdk-migration-plan.md) (Phase 1e amendment).
- **Baseline data informing threshold + anti-template exclusion**: [`docs/evals/2026-04-25-baseline.md`](../../evals/2026-04-25-baseline.md).

## Spin-off candidates (separate compound docs to write later)

- **Cron-bound vs latency-bound composition**: when to use a critique-loop composer vs a bare verb. The `reading:generate-with-critique` verb is shipped but NOT wired into the cron yet because the cron's 30s `maxDuration` can't accommodate a 30-50s composer. Separate compound on the operational decision pattern. Belongs in `architecture-patterns/`.
- **Telemetry-warns-as-todos** (already noted in PR #65 compound) — the rounds-distribution log lines fall into the same anti-pattern. Worth a single sweep doc covering the structured-event migration when it lands.
