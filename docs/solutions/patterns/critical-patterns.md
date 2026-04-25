# Critical Patterns (P1)

> Canonical index of P1-class patterns extracted from compound docs. Each entry is a recurring failure mode worth knowing before writing code in a covered area.
>
> Update this file via the cross-reference step of `/workflows:compound` (per [`CLAUDE.md`](~/.claude/CLAUDE.md)). Add NEW P1 patterns when a compound doc surfaces one; refine existing entries when a later compound expands the guidance.

## Index

| # | Pattern | Source | When it bites |
|---|---|---|---|
| 1 | LLM-as-judge prompt-injection (4-vector hardening) | [`design-patterns/llm-as-judge-prompt-injection-hardening-20260425.md`](../design-patterns/llm-as-judge-prompt-injection-hardening-20260425.md) | Any verb where input prose is itself model-generated (judge, critic, scorer, RAG-with-judge). Naive delimiters are escapable; failure mode is silent quality collapse, not a stack trace. |

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
