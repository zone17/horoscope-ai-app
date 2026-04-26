---
title: Production-hardening pattern for AI SDK generateObject verbs
date: 2026-04-26
category: design-patterns
module: ai/reading
problem_type: design_pattern
component: service_object
severity: high
applies_when:
  - "Building any verb that uses generateObject from the Vercel AI SDK in a production code path"
  - "The verb is on a critical path (cron generation, request fulfillment) where silent skips become user-visible 500s"
  - "Post-call business validators can produce empty/degraded output (self-filters, allowlist overrides, range filters)"
  - "Schema and TypeScript interface for the same shape exist in parallel and must stay aligned"
related_components:
  - tooling
  - testing_framework
tags:
  - ai-sdk
  - generate-object
  - zod
  - retry
  - dialect-drift
  - schema-validation
  - production-hardening
  - defensive-composition
---

# Production-hardening pattern for AI SDK generateObject verbs

> **Source PR**: [#65 — `feat(reading): PR C / Phase 1c — Sonnet 4.6 + generateObject + canonical Zod schema`](https://github.com/zone17/horoscope-ai-app/pull/65), merged as `d735e2a` on 2026-04-26.
> **Reference implementation**: [`src/tools/reading/generate.ts`](../../../src/tools/reading/generate.ts), tests at [`__tests__/tools/reading/generate.test.ts`](../../../__tests__/tools/reading/generate.test.ts), schema at [`src/tools/reading/types.ts`](../../../src/tools/reading/types.ts).

## Context

`generateObject` from the Vercel AI SDK is the canonical way to get structured output from an LLM through the AI Gateway. It enforces a Zod schema at the SDK level and throws `NoObjectGeneratedError` (or `AI_TypeValidationError`) when the model produces output that doesn't conform.

The naive production wiring is one call, no retry, no fallback. That's where it bites:

- The AI SDK does **not** auto-retry on schema rejection. One flaky call = one production error.
- Cron loops that sequentially generate for many entities will silently skip ones that fail and report `success: true` with a partial count. The skipped entity has no cache, so on-demand traffic re-hits the same failing call all day.
- The model may emit snake_case keys despite a camelCase schema (dialect drift, especially around model rotations or after prompt changes). Schema rejects → throw → cron skips.
- Post-call business validators (self-filters, allowlist overrides, range filters) can produce empty output even when the model output passes the schema. The schema's `.min(1)` checks the raw input, not the post-filter result.
- Without a compile-time link between the Zod schema and the parallel TypeScript interface, a rename on either side silently desyncs them.

The pattern below emerged from PR #65's two review rounds (a P0 retry gap, a 3-reviewer-corroborated empty-fallback bug, a confirmed documentation lie about chokepoint coverage, and a missing compile-time invariant). Apply it to any future `generateObject`-based verb on a production path.

## Guidance

Five-point hardening pattern:

### 1. Single retry with a deliberately different transport

When the first `generateObject` call throws, retry once via `generateText` + manual `JSON.parse` + a normaliser + `Schema.parse`. The retry is **not** the same call repeated — it's a different transport mode that bypasses the SDK's tool-call structured-output enforcement (which is often what tripped the first call). It also gives you a place to handle dialect drift defensively.

```typescript
async function generateAndValidateOnce(prompt: string) {
  const { object } = await generateObject({
    model: MODELS.sonnet,
    schema: ReadingOutputModelSchema,
    prompt,
    maxOutputTokens: 800,
  });
  return object;
}

async function generateAndValidateRetry(prompt: string) {
  const { generateText } = await import('@/tools/ai/provider');
  const { text } = await generateText({
    model: MODELS.sonnet,
    prompt: `${prompt}\n\nReturn ONLY a JSON object — no markdown fences, no commentary.`,
    maxOutputTokens: 800,
  });
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
  const raw = JSON.parse(cleaned) as Record<string, unknown>;
  return ReadingOutputModelSchema.parse(normaliseModelKeys(raw));
}

// In the verb:
let object: SchemaT;
try {
  object = await generateAndValidateOnce(prompt);
} catch (firstError) {
  console.warn(`[verb] First attempt failed (${(firstError as Error).message}). Retrying via raw-text + manual schema parse.`);
  object = await generateAndValidateRetry(prompt);
}
```

**Bounded at 1 retry total.** Both fail → propagate the error so the caller (cron, route handler) decides whether to surface 500, fall back to stale cache, or skip the entity. Don't re-retry inside the verb — that hides operational signal and burns cost.

### 2. Pre-parse dialect normaliser

Map known dialect variants (typically snake_case ↔ camelCase) before Zod parses. This eliminates an entire class of schema-rejection failures with a 5-line function:

```typescript
function normaliseModelKeys(raw: Record<string, unknown>): Record<string, unknown> {
  const map: Record<string, string> = {
    best_match: 'bestMatch',
    inspirational_quote: 'inspirationalQuote',
    quote_author: 'quoteAuthor',
    peaceful_thought: 'peacefulThought',
  };
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(raw)) {
    out[map[k] ?? k] = v;
  }
  return out;
}
```

Used in the retry path. If you trust the first call's tool-call enforcement to handle camelCase reliably, the normaliser is only invoked on the rare retry — but when it IS invoked, it makes that retry succeed instead of throw a second time.

### 3. Deterministic fallbacks for post-call validators that can empty out

Schemas validate the model's raw output. Business validators (self-match filter, allowlist override, range filter) operate after the schema and can produce empty output that the schema can never catch:

```typescript
// Bad: schema enforces .min(1), but post-filter can still empty it.
const matches = object.bestMatch.toLowerCase().split(',').map(s => s.trim());
const bestMatch = matches.filter(m => m !== userSign).join(', ');
// → if model returned only userSign, bestMatch === ''
//   → cached for 24h
//   → frontend renders blank "Best matches: " row
```

Pattern: when a validator can yield empty/degraded output, fall back to a deterministic default + warn:

```typescript
const ELEMENT_FALLBACK_MATCHES: Record<string, string> = {
  aries: 'leo, sagittarius, gemini',
  // ... (canonical defaults for every sign)
};

const matches = object.bestMatch.toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
const filtered = matches.filter(m => m !== normalizedSign);
let bestMatch = filtered.join(', ');
if (bestMatch === '') {
  console.warn(`[verb] bestMatch empty after self-filter (model returned: "${object.bestMatch}"). Falling back to element-based default.`);
  bestMatch = ELEMENT_FALLBACK_MATCHES[normalizedSign] ?? '';
}
```

The defaults are part of the verb's contract — they encode the same business rules the prompt asks the model to follow. Generating them in code (rather than retrying the model with a stricter prompt) is faster, deterministic, and free.

### 4. Compile-time link between Zod schema and TS interface

When a Zod schema and a TypeScript interface describe the same shape, they will silently desync without enforcement. Use a type-level structural assertion:

```typescript
// In types.ts:
export const ReadingOutputModelSchema = z.object({
  message: z.string().min(1),
  bestMatch: z.string().min(1),
  // ...
});

export type ReadingOutputModel = z.infer<typeof ReadingOutputModelSchema>;

export interface ReadingOutput {
  sign: string;        // injected by the verb, not in the schema
  date: string;        // injected by the verb
  philosopher: string; // injected by the verb
  message: string;
  bestMatch: string;
  // ...
}

/**
 * Compile-time invariant: ReadingOutputModel must match ReadingOutput
 * minus the verb-injected fields. Renaming either side breaks compilation.
 */
type _AssertModelMatchesReadingOutput = ReadingOutputModel extends Omit<ReadingOutput, 'sign' | 'date' | 'philosopher'>
  ? Omit<ReadingOutput, 'sign' | 'date' | 'philosopher'> extends ReadingOutputModel
    ? true
    : false
  : false;
const _MODEL_MATCHES_READING_OUTPUT: _AssertModelMatchesReadingOutput = true;
void _MODEL_MATCHES_READING_OUTPUT;
```

Bidirectional structural compatibility, evaluated at module load. If `ReadingOutput.bestMatch` becomes `bestMatch: string[]` while the schema stays `bestMatch: z.string()`, the assignment fails to compile.

### 5. Soft observability for fuzzy constraints, not Zod refinement

Some constraints are aspirational (e.g., "message should be 40-80 words"). Don't enforce them as Zod refinements — strict refinement risks flaky throws on otherwise-acceptable model output and degrades UX without improving quality. Instead:

- Keep the constraint in the prompt as an instruction.
- Add a post-call telemetry warn when the constraint is missed.
- Tighten to a Zod refinement later only if compliance data supports it.

```typescript
const trimmed = object.message.trim();
const wordCount = trimmed === '' ? 0 : trimmed.split(/\s+/).length;
if (wordCount < 40 || wordCount > 80) {
  console.warn(`[verb] message word count out of target range: ${wordCount} (target 40-80)`);
}
```

> **Watch out**: `''.split(/\s+/).length === 1`, not 0. Always check empty-after-trim explicitly before calling `.split` for word counts.

## Why This Matters

Production blast radius without this pattern (real failure modes from PR #65 review):

- **Sonnet returns one schema-rejection on a sign.** No retry → cron skips → no Redis cache → on-demand 500s for 24h. The cron itself logs `success: true, generated: 11, errors: [...]` so HTTP-status monitoring sees green.
- **Sonnet returns snake_case under JSON-mode despite the camelCase schema.** Schema rejects → same cascade as above. The dialect drift is real and version-sensitive — what works for Sonnet 4.6 today may not work for Sonnet 4.7 tomorrow.
- **Post-call validator empties bestMatch.** Schema passed (`.min(1)` on raw input), so the verb returns `{ bestMatch: '' }` and the frontend renders a blank "Best matches: " row, cached for 24h.
- **Schema↔interface desync.** A future engineer renames `bestMatch` → `compatibleSigns` on the interface. Schema still says `bestMatch`. Generation works (Zod is lax), but downstream code reading `.compatibleSigns` gets `undefined`. No compile error. Silent regression.
- **Strict Zod refinement on word count.** Prompt asks for 40-80 words; model emits 39. Zod throws. Generation fails. User sees an error. The model's output was *fine* — strict enforcement was the bug.

The combined cost of getting any one of these wrong is hours-to-days of degraded user experience with no exception to alert on. The combined cost of all five hardening points is ~80 lines of TypeScript.

## When to Apply

Apply the full five-point pattern whenever:

- A verb uses `generateObject` and is on a production path (cron, request handlers, durable workers).
- The verb has post-call validators that mutate or filter the model output before returning.
- A parallel TypeScript interface exists for the same shape.

The pattern is **less critical** when:

- The verb is operator-only / one-shot (e.g., a script, a backfill).
- All callers handle thrown errors gracefully and there is no SLA on success.

When in doubt, apply at least points 1 (retry), 3 (validator fallbacks), and 4 (compile-time link). Points 2 (normaliser) and 5 (telemetry) are cheap to add and only matter on edge cases — but those edge cases compound.

## Examples

### Example 1 — Production reference

[`src/tools/reading/generate.ts`](../../../src/tools/reading/generate.ts) — `reading:generate` verb. Routes Sonnet 4.6 through `generateObject` + canonical Zod schema with all five hardening points applied. Tests at [`__tests__/tools/reading/generate.test.ts`](../../../__tests__/tools/reading/generate.test.ts) cover the retry path (snake_case payload exercises normaliser), bestMatch fallback (model returns only the user's own sign), word-count telemetry (fires/doesn't-fire), schema referential identity, and both-attempts-fail propagation.

### Example 2 — Hypothetical companion

A `code:generate-from-spec` verb that takes a feature spec and returns structured TypeScript. Same threat model applies:
- generateObject with a `GeneratedCodeSchema` (camelCase fields like `imports`, `exports`, `body`, `tests`).
- Retry path with `generateText` + normaliser handles snake_case dialect drift.
- Post-call validators reject imports outside an allowlist; fall back to a "no-imports" stub if filtering empties the list.
- Compile-time invariant ties `GeneratedCodeSchema` to `GeneratedCodeOutput` interface.
- Soft telemetry on body line count (target 50-200), not a Zod refine.

## Pitfalls

### Don't retry inside `generateAndValidateRetry`

Bound the retry to one attempt total. Retrying inside the retry helper hides operational signal (the caller can't distinguish "first call flaky" from "model fundamentally rejecting") and burns cost without bounded blast radius. If both attempts fail, propagate — let the cron / route handler decide.

### Don't put the retry path through `generateObject` again

The whole point of the different-transport retry is to escape the SDK-side strictness that may have caused the first failure. If the retry uses `generateObject` too, you've just doubled the cost of the same failure. Use `generateText` + manual `Schema.parse` so the retry has a structurally different code path.

### Don't auto-add fallbacks the user might want to see

The element-based bestMatch fallback is appropriate because it's **deterministic** and **encodes business rules the prompt already asks the model to follow**. Don't generalize this to "always have a fallback for every field" — fallbacks for things the model is supposed to think about (the message itself, the quote selection) would mask quality regressions and make the system look better than it is. Use fallbacks only for structural / categorical fields that have a deterministic right answer.

### Don't skip the compile-time invariant

It's three lines of TypeScript. Future engineers WILL rename a field one side and not the other. The cost of compile-time enforcement is zero; the cost of finding out via a production bug is hours.

## Round-by-Round Discovery Log

This pattern took two review rounds on PR #65 to harden:

| Round | Vector caught | Origin |
|---|---|---|
| 1 | No retry on schema flake → 24h production outage cascade | Adversarial review constructed the cron-skip-then-cache-miss scenario |
| 1 | Empty bestMatch after self-filter | 3 reviewers (correctness, adversarial, testing) all flagged independently |
| 1 | camelCase vs snake_case dialect drift | Adversarial review (P1, conf 50 — empirically uncertain but combined with no-retry = real risk) |
| 1 | Schema↔interface compile-time silent drift | Kieran-typescript review |
| 1 | Word-count whitespace edge case | Correctness review (`''.split(/\s+/).length === 1`) |
| 1 | Test fixture silently fired the warn on every passing test | Testing review (the fixture was ~30 words; warn was firing but invisible) |

**Meta-lesson**: production-grade `generateObject` is not the same as "wire it up and ship." The five hardening points are the minimum cost; future implementations should skip discovery and apply them up front.

## Related

- **Sibling AI-SDK pattern**: [`design-patterns/llm-as-judge-prompt-injection-hardening-20260425.md`](./llm-as-judge-prompt-injection-hardening-20260425.md) — for verbs that grade model output (judge/critic/scorer). Shares the "trusted ≠ untrusted" discipline; prompt-injection hardening is the parallel concern when the input prose is itself model-generated.
- **Source plans**: [`docs/plans/2026-04-24-001-reading-authenticity-and-ai-sdk-migration-plan.md`](../../plans/2026-04-24-001-reading-authenticity-and-ai-sdk-migration-plan.md) (Phase 1c).
- **Baseline data driving Sonnet 4.6 selection**: [`docs/evals/2026-04-25-baseline.md`](../../evals/2026-04-25-baseline.md).

## Spin-off candidates (separate compound docs to write later)

- **Cron + cache + LLM fallback contract** — the upstream concern: when `generateReading` (or any LLM-backed verb) throws, what should the cron do? What should the route handler do? Today the cron silently skips and the route returns 500; both are defensible but the contract should be explicit. Belongs in `architecture-patterns/`.
- **Telemetry-warns-as-todos** — the soft word-count signal is a `console.warn` that may or may not be aggregated. The pattern of "log it now, wire it up properly later" needs an institutional forcing function (calendar reminder, DECISIONS.md entry, or a sweep script that promotes warns to structured events). Belongs in `workflow-issues/`.
