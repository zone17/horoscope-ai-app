# Critical Patterns (P1)

> Canonical index of P1-class patterns extracted from compound docs. Each entry is a recurring failure mode worth knowing before writing code in a covered area.
>
> Update this file via the cross-reference step of `/workflows:compound` (per [`CLAUDE.md`](~/.claude/CLAUDE.md)). Add NEW P1 patterns when a compound doc surfaces one; refine existing entries when a later compound expands the guidance.

## Index

| # | Pattern | Source | When it bites |
|---|---|---|---|
| 1 | LLM-as-judge prompt-injection (4-vector hardening) | [`design-patterns/llm-as-judge-prompt-injection-hardening-20260425.md`](../design-patterns/llm-as-judge-prompt-injection-hardening-20260425.md) | Any verb where input prose is itself model-generated (judge, critic, scorer, RAG-with-judge). Naive delimiters are escapable; failure mode is silent quality collapse, not a stack trace. |
| 2 | generateObject production hardening (5-point pattern) | [`design-patterns/generateobject-production-hardening-20260426.md`](../design-patterns/generateobject-production-hardening-20260426.md) | Any verb using `generateObject` on a production path. Naive wiring (one call, no retry, no fallbacks) cascades into 24h-of-500s outages because the AI SDK doesn't auto-retry, cron silently skips failures, and post-call validators can empty out without the schema noticing. |
| 3 | Critique-loop hardening (4-point: BEST-of-N + symmetric defense + recency-bias placement) | [`design-patterns/critique-loop-best-of-n-hardening-20260426.md`](../design-patterns/critique-loop-best-of-n-hardening-20260426.md) | Any composer that wraps generate + judge in a bounded `generate → judge → regenerate` loop. Without the 4 points, the loop systematically degrades quality on the cells it was supposed to improve (oscillating regenerations ship the worst attempt; judge-output → next-prompt is an injection chain; critique mid-prompt displaces contract attention). |

---

## 1. LLM-as-judge prompt-injection (4-vector hardening)

**Category**: ai-safety / design-pattern
**Recurrence**: discovered across 3 review rounds on a single PR (#63). All 4 vectors should be assumed present until disproven by tests.

### When to use

When you are about to write a verb that calls an LLM to grade, score, critique, or classify the output of another LLM. Critique loops, agent-as-judge evals, automated red-team scoring, RAG answer scorers — all qualify.

### The 4 attack vectors (regression-test all of them)

1. **Bare-delimiter escape**: upstream content contains the closing delimiter (`"""`, etc.) → escapes the data block.
2. **Attribute injection**: untrusted content interpolated into XML attribute values (`attributed-to="${x}"`) → `"` closes the attribute and opens an instruction.
3. **Markdown-heading injection**: `\n## NEW INSTRUCTIONS\n` inside the wrapper → judge anchors on the heading as a section.
4. **Header regression**: a fix routes untrusted content into a markdown heading OUTSIDE the protected wrapper → reopens the attack with a new doorway. Especially common when introducing a sanitized alias variable but missing one interpolation site.

### Hardening pattern (apply ALL seven points up front)

1. Tag wrapper around untrusted content (`<reading-message>`, etc.).
2. Two-tier sanitizer: untrusted content gets full strip + cap + newline collapse + markdown strip; trusted caller-supplied identity gets only length cap + structural-char strip.
3. "INSTRUCTION INTEGRITY" prologue immediately after system framing.
4. "END OF DATA" epilogue after wrapper, before scoring criteria.
5. No untrusted content in XML attribute values — use a labeled inline line above the wrapper.
6. Section headers outside the wrapper use ONLY trusted values (never `${untrusted || trusted}`).
7. Per-field truncation caps.

### Architectural rule

The verb stays atomic (one model call, one structured return). The critique loop (generate → judge → revise → re-judge) is **composition at the call site**, NOT folded into the verb. Folding it in turns the verb into a workflow.

### Reference code

[`src/tools/reading/judge.ts`](../../../src/tools/reading/judge.ts) — production reference implementation. Tests covering all 4 vectors at [`__tests__/tools/reading/judge.test.ts`](../../../__tests__/tools/reading/judge.test.ts).

### Detection rule

Code review of any new verb that imports `generateObject` / `generateText` AND interpolates a field that could come from an LLM should require:
- A sanitizer applied to every interpolated untrusted field
- A regression test asserting at least the 4 vectors above are blocked
- An "INSTRUCTION INTEGRITY" prologue OR equivalent in the prompt
- The verb does not also implement a critique loop internally

---

## 2. generateObject production hardening (5-point pattern)

**Category**: ai-safety / production-hardening
**Recurrence**: discovered across 2 review rounds on PR #65 (Phase 1c). All 5 points should be applied up front to any new `generateObject`-backed verb on a production path.

### When to use

Whenever a verb uses `generateObject` from the Vercel AI SDK AND is on a production path (cron, request handlers, durable workers). Less critical for one-shot operator scripts.

### The 5 hardening points (apply ALL up front)

1. **Single retry with a deliberately different transport.** First attempt: `generateObject`. On throw: retry once via `generateText` + manual `JSON.parse` + key normaliser + `Schema.parse`. Different transport mode bypasses the SDK's tool-call structured-output enforcement (often what tripped the first call) AND gives you a place to handle dialect drift.
2. **Pre-parse dialect normaliser.** 5-line function that maps known dialect variants (snake_case ↔ camelCase typically) before Zod parses. Eliminates a whole class of `NoObjectGeneratedError` on retry.
3. **Deterministic fallbacks for post-call validators that can empty out.** Schemas validate raw model output. Self-filters / allowlist overrides / range filters can produce empty output the schema never sees. Fall back to a canonical default + warn-log.
4. **Compile-time link between Zod schema and TS interface.** Type-level structural assertion (`type _Assert ... ; const _check: _Assert = true;`). Renaming a field on either side then breaks compilation.
5. **Soft observability for fuzzy constraints, not Zod refinement.** Don't make aspirational rules (e.g., word-count targets) into Zod refines — strict refinement risks flaky throws on otherwise-acceptable output. Use prompt instruction + post-call telemetry warn instead.

### Architectural rule

Verb stays atomic (single function, one retry, returns or throws). Cron / route handler / agent runtime decides what to do on throw — surface 500, fall back to stale cache, skip the entity. Don't bury the retry behavior inside an unbounded loop or a try-catch that masks failure from upstream.

### Reference code

[`src/tools/reading/generate.ts`](../../../src/tools/reading/generate.ts) — production reference. Tests covering all 5 points at [`__tests__/tools/reading/generate.test.ts`](../../../__tests__/tools/reading/generate.test.ts) (10 tests).

### Detection rule

Code review of any new verb that imports `generateObject` from `@/tools/ai/provider` and is reachable from a production route or cron should require:
- A try/catch around the first `generateObject` call with a single fallback retry through `generateText`
- A `normaliseModelKeys` (or equivalent) helper for dialect drift
- Post-call validators that can empty/degrade output have explicit fallback branches with warn-logs
- A type-level `_Assert*` invariant linking the schema to any parallel TS interface
- Telemetry warns (not Zod refines) for soft constraints

---

## 3. Critique-loop hardening (4-point: BEST-of-N + symmetric defense + recency-bias placement)

**Category**: ai-safety / composition-pattern
**Recurrence**: 4 P2 findings on PR #67 (3-reviewer corroboration on the BEST-of-N issue alone). All 4 points should be applied up front to any new critique-loop composer.

### When to use

Whenever you build a composer wrapping a generator verb + judge verb in a bounded `generate → judge → if below threshold, regenerate with feedback → re-judge` loop. Especially when the composer is on a production path (cron, route handler, durable worker) and the loop has a max-rounds budget that can be exhausted.

### The 4 hardening points (apply ALL up front)

1. **BEST-of-N tracking, not LAST attempt.** Regenerations are not monotonically better — the model may follow critique imperfectly and regress an axis it had right. Track `best` across iterations via a composite quality score; surface `best` on budget exhaustion. Surface LAST only on early-return success.
2. **Symmetric defense-in-depth: sanitize judge OUTPUT.** The judge's `violations[]` and `rationale` are model-generated and flow into the next regeneration prompt. Apply the same sanitizer as the judge's input-side sanitizer to those strings before re-injection. Filter empty post-sanitization strings out of lists.
3. **Sanitize the public injection surface created by the optional `feedback` parameter.** Whenever the generator verb gains a `feedback?: string` parameter to support critique loops, that field becomes part of the verb's public contract. Sanitize at the prompt builder, not at the composer — the trust boundary belongs to the receiving verb.
4. **Critique block at the END of the prompt, not embedded mid-template.** Recency bias favors instruction-following at the end of the prompt. A critique block before the contract section pushes contract requirements further from decoding and trades quality dimensions instead of improving overall.

### Architectural rule

Composer is a single function with a bounded loop. Both underlying verbs stay atomic. The composer doesn't add retry on top of the verb's own retry (each verb owns its own retry semantics — see [generateObject production hardening](../design-patterns/generateobject-production-hardening-20260426.md) entry #1).

### Reference code

[`src/tools/reading/generate-with-critique.ts`](../../../src/tools/reading/generate-with-critique.ts) — production reference (the only critique-loop composer in the repo today). Tests covering all 4 points at [`__tests__/tools/reading/generate-with-critique.test.ts`](../../../__tests__/tools/reading/generate-with-critique.test.ts) (12 tests).

### Detection rule

Code review of any new composer that imports both a generator verb and a judge verb (or any LLM-as-evaluator) and contains a loop should require:
- A `best`-tracking variable updated each iteration via a composite-quality function (NOT just returning the last loop variable on exhaustion)
- A sanitizer applied to every judge-output string before re-injection (mirror the judge's input sanitizer)
- The generator verb's `feedback`-equivalent parameter is sanitized inside its prompt builder
- The critique/feedback block in the prompt appears AFTER the contract / field-list / schema-binding section
- A regression test using N **distinct** quality levels with known ordering (not N identical samples) to actually exercise the BEST-of-N contract
