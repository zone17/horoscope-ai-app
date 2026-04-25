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
