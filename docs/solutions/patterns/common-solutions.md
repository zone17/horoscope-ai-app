# Common Solutions (P2 / P3)

> Canonical index of recurring P2-and-below patterns extracted from compound docs. Less load-bearing than [`critical-patterns.md`](./critical-patterns.md), but worth a glance when working in a covered area.
>
> Update via `/workflows:compound` cross-reference step (per [`CLAUDE.md`](~/.claude/CLAUDE.md)).

## Index

| # | Pattern | Source | Severity | Recurrence |
|---|---|---|---|---|
| 1 | Refactor regression — sanitized alias not propagated to every interpolation site | [`design-patterns/llm-as-judge-prompt-injection-hardening-20260425.md`](../design-patterns/llm-as-judge-prompt-injection-hardening-20260425.md) | P2 | 1 (PR #63 round 2) |
| 2 | Cross-family LLM-as-judge bias | [`design-patterns/llm-as-judge-prompt-injection-hardening-20260425.md`](../design-patterns/llm-as-judge-prompt-injection-hardening-20260425.md) | P2 | 1 (PR #63 baseline eval) |
| 3 | Re-baseline eval after material prompt changes | [`design-patterns/llm-as-judge-prompt-injection-hardening-20260425.md`](../design-patterns/llm-as-judge-prompt-injection-hardening-20260425.md) | P2 | 1 (PR #63 v1→v2 recommendation flip) |
| 4 | Bounded review-loop budget exception (self-introduced regressions don't count) | [`design-patterns/llm-as-judge-prompt-injection-hardening-20260425.md`](../design-patterns/llm-as-judge-prompt-injection-hardening-20260425.md) | P2 (process) | 1 (PR #63 round 3) |
| 5 | Word-count whitespace edge case — `''.split(/\s+/).length === 1` | [`design-patterns/generateobject-production-hardening-20260426.md`](../design-patterns/generateobject-production-hardening-20260426.md) | P3 | 1 (PR #65) |
| 6 | Test fixture silently fires telemetry warn on every passing test | [`design-patterns/generateobject-production-hardening-20260426.md`](../design-patterns/generateobject-production-hardening-20260426.md) | P3 | 1 (PR #65) |
| 7 | Schema shape introspection in tests is Zod-version-coupled | [`design-patterns/generateobject-production-hardening-20260426.md`](../design-patterns/generateobject-production-hardening-20260426.md) | P3 | 1 (PR #65) |
| 8 | Chokepoint comment is a lie when a legacy direct-import remains | [`design-patterns/generateobject-production-hardening-20260426.md`](../design-patterns/generateobject-production-hardening-20260426.md) | P2 (docs truth) | 1 (PR #65) |

---

## 1. Refactor regression — sanitized alias not propagated to every interpolation site

**Symptom**: Round-2 review of PR #63 found that round-1 introduced `const philosopher = sanitizeForPrompt(input.philosopher, 200)` but a separate edit in the same commit changed a section header from `${input.philosopher}` to `${quoteAuthor || input.philosopher}` — routing attacker-controlled content into a markdown heading OUTSIDE the protected wrapper. Criteria block correctly used the sanitized alias; header didn't.

**Rule**: When you introduce a sanitized alias of an input variable, audit every interpolation site of the original. If some sites genuinely need the unsanitized form, leave a comment at each explaining why. Add a regression-guard test that asserts the trusted value (not an alternative) appears in any header that could mix trusted/untrusted sources.

**Code marker**: `${untrusted || trusted}` in a prompt template is almost always wrong — the trusted value should be the only one that lands in headings outside any data wrapper.

---

## 2. Cross-family LLM-as-judge bias

**Symptom**: PR #63 baseline used Haiku 4.5 to judge gpt-4o-mini, Haiku 4.5, Sonnet 4.6, and Opus 4.7. Haiku-judging-Haiku is the most bias-prone combination. The eval acknowledged the caveat in the summary.

**Rule**: Pin the judge to a model family that is NOT in the candidate set when possible. If unavoidable (cost, availability, schema-flake constraints), document the caveat and avoid drawing strong conclusions from in-family head-to-heads. Cross-family results are the load-bearing signal.

---

## 3. Re-baseline eval after material prompt changes

**Symptom**: PR #63 baseline ran twice in the same PR. v1 (initial prompt) recommended Opus 4.7. v2 (after sanitization hardening + tag wrapping + integrity prologue/epilogue) recommended Sonnet 4.6. Same data, same models, same scoring criteria — different prompt, different recommendation. The hardened prompt compressed the per-axis 5-count gap that was v1's primary differentiator.

**Rule**: Eval data is scoped to a specific prompt version, not to model rankings in the abstract. After any material prompt change (sanitization, instruction rewording, criteria adjustment), re-run the eval before relying on the recommendation. Note the prompt-version → eval-version coupling in eval summaries so future readers don't conflate them.

---

## 4. Bounded review-loop budget exception (self-introduced regressions don't count)

**Symptom**: [`CLAUDE.md`](~/.claude/CLAUDE.md) caps review→remediate at `max_rounds=2`. PR #63 went to round 3 because round 2's fix introduced a regression that made the prompt strictly worse on its primary attack surface.

**Rule**: Fixing one's own bug from a prior round does NOT count against the loop budget. The rule's purpose is to prevent infinite churn on disagreements with reviewers, not to forbid necessary corrections of regressions you introduced. Be explicit in the commit message when invoking this exception ("round X here is justified because round X-1 introduced a regression — fixing one's own bug doesn't count against the loop budget").

---

## 5. Word-count whitespace edge case — `''.split(/\s+/).length === 1`

**Symptom**: Telemetry intended to count words in model output reports `1` for whitespace-only or empty-after-trim strings. Skews any future analysis based on the metric.

**Rule**: Always check empty-after-trim explicitly before calling `.split` for word counts.

```typescript
const trimmed = value.trim();
const wordCount = trimmed === '' ? 0 : trimmed.split(/\s+/).length;
```

The native JS behavior of `''.split(/\s+/)` returning `['']` (length 1) is unintuitive but documented. Any value-counting code that doesn't pre-check empty produces noise that looks like signal.

---

## 6. Test fixture silently fires telemetry warn on every passing test

**Symptom**: A new telemetry warn (e.g., `console.warn` for word-count out of range) was added but the existing test fixture happened to trip it. Every passing test silently emits the warn. Removing the warn in a future refactor would not be caught by any test, and the telemetry is effectively unobserved.

**Rule**: When adding telemetry to a verb, install a `jest.spyOn(console, 'warn')` in `beforeEach` and add at least two tests:
- One that asserts the warn fires when expected (with `expect.stringMatching(...)`)
- One that asserts the warn does NOT fire when the input is in the happy-path range

Also: review existing test fixtures to confirm they're inside the happy-path range. A fixture that trips the new warn is a fixture that was wrong and needs updating.

---

## 7. Schema shape introspection in tests is Zod-version-coupled

**Symptom**: Tests verify a Zod schema by reaching into its internals — typically `(call.schema as { shape: Record<string, unknown> }).shape` to enumerate keys. Works on Zod 3 but is fragile across version bumps and doesn't actually verify the canonical schema is being used (any schema with the same keys would pass).

**Rule**: Test schema usage by referential identity, not shape introspection.

```typescript
import { ReadingOutputModelSchema } from '@/tools/reading/types';

expect(call.schema).toBe(ReadingOutputModelSchema); // identity, not shape
```

The identity check is stronger (catches a regression where someone inlined a schema with the right keys but different `.min()` / `.refine()` constraints) AND independent of Zod's internal layout.

---

## 8. Chokepoint comment is a lie when a legacy direct-import remains

**Symptom**: A module's header doc claims "single chokepoint for all model access" / "single source of truth for X" / etc., but a legacy direct-import (e.g., `import OpenAI from 'openai'` in another file) exists and was never migrated. The comment becomes load-bearing documentation that is silently wrong, and a future engineer acting on it (e.g., removing the underlying env var) breaks the legacy path.

**Rule**: When you write a "single chokepoint" or "single source of truth" claim in a comment, audit it the same day. If a legacy direct-import survives, EITHER:
- Migrate it now (preferred), OR
- Update the comment to call out the gap explicitly with a cross-reference (e.g., "Known gap: `path/to/legacy.ts` still uses X directly; on migration backlog. Until that lands, env var Y must remain set.")

Comments that say "single X" are aspirational unless the codebase enforces it.
