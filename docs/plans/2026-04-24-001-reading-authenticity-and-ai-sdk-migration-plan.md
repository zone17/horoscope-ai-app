# Plan: Reading Authenticity + AI SDK Migration

> **Date**: 2026-04-24
> **Status**: In progress — Phase 1a and 1b shipped; Phase 1c is next
> **Scope**: Rework the reading generation pipeline to produce authentic, philosopher-grounded readings. Migrate all model access to Vercel AI SDK via AI Gateway. Add daily-rhythm astronomical inputs.

## Progress tracker

| Phase | Status | PR | Notes |
|---|---|---|---|
| 1a — AI SDK + Gateway wiring | ✅ Shipped | #60 → `3835d33` | `src/tools/ai/provider.ts` is the single chokepoint; MODELS constants verified against live Gateway |
| 1b — `reading:generate` parity port | ✅ Shipped | #61 → `70332da` | Behind `FEATURE_FLAG_USE_AI_SDK` (default off); production still on legacy |
| 1b.5 — `reading:judge` verb + 4-model baseline eval | ✅ Shipped | #63 → `f2b91ad` | Ships the judge verb that PR D and E reuse; baseline at `docs/evals/2026-04-25-baseline.md` picked Sonnet 4.6 over Opus 4.7 on cost parity at indistinguishable quality. Compound: [`docs/solutions/design-patterns/llm-as-judge-prompt-injection-hardening-20260425.md`](../solutions/design-patterns/llm-as-judge-prompt-injection-hardening-20260425.md) |
| **1c — Adopt Sonnet 4.6 + `generateObject` + canonical Zod** | **✅ Shipped** | #65 (this PR) | `ReadingOutputModelSchema` in `src/tools/reading/types.ts` is the canonical runtime schema. Inlined in `reading:generate`; `callModelForReading` helper, `FEATURE_FLAG_USE_AI_SDK`, and direct OpenAI SDK import all deleted. Eval script imports the canonical schema (closes PR B.5's acknowledged duplication). Word-count target stays soft (telemetry, not Zod refinement) to avoid flaky throws. |
| 1d — Corpus retrieval infrastructure | 🔜 After 1c | — | Blocked on open question: living-philosopher corpus posture |
| 1e — Self-critique pass (composition, not fold-in) | 🔜 After 1d | — | **`reading:generate` + `reading:judge` composed at the call site** (cron route, agent runtime). NOT a workflow folded into `reading:generate`. Anti-cliché, anti-Barnum, anti-astrology-template criteria already encoded in the judge verb shipped in 1b.5 |
| 2a — `astronomy:moon-phase` verb | 🔜 After Phase 1 | — | Facts in, texturally out |
| 2b — `calendar:seasonal-marker` verb | 🔜 After Phase 1 | — | 8 hardcoded dates/year |
| 2c — `astronomy:moon-sign` verb | 🔜 After Phase 2a | — | Lands last so writing foundation can carry nuance |

---

## 1. Why

Today's `reading:generate` uses gpt-4o-mini with a prompt-assembled voice profile + a verified-quote bank. Output quality is good but not distinctive. The product's positioning — *"not predictions; philosophy that meets you where you are"* — promises readings that feel like the philosopher's actual thinking, not a generic AI rendering.

The single biggest lever for that (per research synthesis in `docs/solutions/[TBD]/reading-authenticity-research-20260424.md` — see References) is **grounding readings in the philosopher's actual writings**, not just their name. A Seneca reading should compose from actual Seneca passages; a Watts reading should compose from actual Watts transcripts. The model becomes the compositional engine; the corpus carries the truth.

Secondary lever: upgrade the writing itself (Sonnet 4.6, structured output, self-critique). Tertiary lever: daily rhythm inputs (moon phase, seasonal markers, moon sign) that make each reading feel anchored in *today* without feeling templated.

## 2. Goals

1. Readings feel grounded in each council member's actual intellectual framework and voice — not impressionistic.
2. Any direct quote in the output is real and attributed (preserve current `VALID_AUTHORS` + `quote-bank` constraints; tighten so the model cannot fabricate).
3. All model access routes through a single abstraction (Vercel AI SDK + AI Gateway).
4. Each reading composes across the user's full 5-philosopher council — lead philosopher colors the day's flavor; other four texture the reading.
5. Inputs expand (moon phase, seasonal markers, moon sign) without introducing horoscope-template clichés.

## 3. Non-goals / decisions already made

- **No mood/intention tap.** A daily check-in is formulaic by design and conflicts with the anti-template moat. Personalization comes from council composition + daily inputs + writing quality, not from reducing the user's state to buckets.
- **No rising sign, no natal chart inputs in this plan.** Deferred — major onboarding redesign, different scope.
- **No tarot card of the day, no planetary day of week, no biorhythms.** Weak evidence and/or conflicts with positioning.
- **No premium/mentor product infrastructure.** Conversational state, per-user philosopher memory, and streaming mentor sessions are future-state. Everything here serves the daily reading.
- **Reading voice is "in the style of" non-attributed third-person synthesis.** The reading does not claim any philosopher literally said anything. Only the daily card's quote field carries attributed verbatim text.
- **Reading body does not quote.** Quotes live on the daily card as a separate field, sourced from one council member per day (rotated).
- **Corpus covers all 54 philosophers, not 3–5.** Graceful degradation by depth: public-domain thinkers get deep corpora first; gaps fall back to current voice + quote-bank behavior.

## 4. Phased execution

Each stage is its own PR with its own review.

### Phase 1 — Writing Foundation

**PR A — AI SDK + AI Gateway wiring** ✅ **Shipped as PR #60 (`3835d33`)**
- Installed `ai@^6.0.168`; routing through AI Gateway using plain `"provider/model"` strings (no explicit `@ai-sdk/gateway` dep needed).
- `AI_GATEWAY_API_KEY` configured in Vercel env for the API project (production, preview, development). Local dev uses the same var in `.env.local`; Vercel-deployed envs can also use `VERCEL_OIDC_TOKEN` auto-provisioned.
- `src/tools/ai/provider.ts` re-exports `generateText` / `generateObject` / `streamText` + exposes `MODELS` constant (`haiku` → `anthropic/claude-haiku-4.5`, `sonnet` → `anthropic/claude-sonnet-4.6`, `opus` → `anthropic/claude-opus-4.7`). All three IDs verified against the live Gateway's `/v1/models` endpoint.
- 6 contract tests using `@jest-environment node` (AI SDK needs Web Streams APIs not in jsdom).
- `jest.setup.js` guarded to let node-env tests opt out of DOM setup.
- No behavior change.

**PR B — Port `reading:generate` to AI SDK (parity run)** ✅ **Shipped as PR #61 (`70332da`)**
- Feature flag `FEATURE_FLAG_USE_AI_SDK` added to `src/utils/feature-flags.ts`. Default off.
- `callModelForReading(prompt)` internal helper branches on the flag:
  - Off: legacy OpenAI SDK direct, `gpt-4o-mini-2024-07-18`, `response_format: json_object`, `max_tokens: 800`.
  - On: `generateText` via `@/tools/ai/provider`, model `openai/gpt-4o-mini` (via Gateway), `maxOutputTokens: 800`. No JSON-mode enforcement (see below).
- 6 parity tests covering transport selection + output-shape equivalence under both paths.
- **Known deferred divergence**: `providerOptions.openai.responseFormat` is NOT a documented AI SDK OpenAI chat provider option — setting it was silently no-op. Review caught this. AI SDK path currently relies on the prompt's "Respond ONLY with valid JSON." instruction alone for JSON output. PR C replaces `generateText` with `generateObject` + Zod schema, which is the canonical AI SDK JSON enforcement mechanism. The flag stays default-off until PR C lands to avoid this divergence leaking to users.

**PR C — Swap to Sonnet 4.6 (or Haiku 4.5) + `generateObject` + Zod schema** 🔜 **Next**
- **A/B eval first** — before the PR lands, write a local script that generates 12 signs × 3 philosophers on both Haiku 4.5 and Sonnet 4.6 with the current prompt. Blind-score for voice authenticity, anti-template adherence, Barnum-resistance. Cost delta at 13M tokens/year is ~$100-150 — voice quality wins if the delta is material.
- Flip the model by updating `callModelForReading` to call `generateObject` with the chosen `MODELS.*` alias. Always route through `MODELS` from `@/tools/ai/provider` — never hardcode gateway IDs in consumers.
- Replace `generateText` + free-form JSON parsing with `generateObject` + Zod schema defining `ReadingOutput`. **This closes the deferred JSON-mode divergence from PR B.** Schema enforces:
  - `message`: string, ≥40 words, ≤80 words
  - `bestMatch`: string (comma-separated sign list, normalized downstream)
  - `inspirationalQuote`: string (validated against `quote-bank` in downstream logic)
  - `quoteAuthor`: string (validated against `VALID_AUTHORS`)
  - `peacefulThought`: string (1-2 sentences)
- Delete the legacy OpenAI SDK branch from `callModelForReading`; inline the AI SDK call back into `generateReading` (per `TODO(PR C)` comment). Remove `FEATURE_FLAG_USE_AI_SDK` from `feature-flags.ts` and `HANDOFF.md` env table. Remove `OPENAI_API_KEY` from Vercel env at the end of rollout (if fully retired).
- Flip `FEATURE_FLAG_USE_AI_SDK=true` in Vercel preview env first; validate via preview deploy. Then production. Or ship the PR with the flag code deleted entirely since the divergence is closed.
- Update tests: the 6 parity tests in `__tests__/tools/reading/generate.test.ts` collapse into single-path tests for the new canonical transport.

**PR D — Corpus retrieval infrastructure (all 54, deep for ~15–20)**
- New package: `@horoscope/corpus` OR extend `@horoscope/shared` with corpus utilities
- Data shape: per-philosopher semantic chunks with source metadata (work title, section/chapter, page/timestamp, URL where available)
- Retrieval verb: `philosopher:retrieve-passages({ philosopher, theme, k: 5 }) → { passages: [{text, source, citation}] }`
- Graceful degradation: if corpus is empty/thin for a philosopher, verb returns empty array; `reading:generate` falls back to current voice + quote-bank path for that philosopher
- Ship mechanism with deep corpus for ~15–20 PD philosophers (Stoics, Classical, older Eastern Wisdom, older Science & Wonder); backfill others in follow-up PRs
- `reading:generate` prompt assembly gains a "grounded passages" section when corpus returns results

**PR E — Self-critique pass (composition, NOT fold-in)**

The critique loop lives in the **caller** (cron route, agent runtime, future `daily-publisher` agent), not inside `reading:generate`. `reading:generate` and `reading:judge` (shipped in PR B.5) stay as independent atomic verbs; PR E is the composition that wires them. Folding the loop into `reading:generate` would make it a workflow — exactly what the architecture principles forbid.

- `reading:judge` already exists (shipped PR B.5), already evaluates against the project's full criteria set (sign-specific `avoidPatterns`, global banned-word list, Barnum patterns, astrology-template patterns, quote fidelity).
- **Scope-narrowing finding from the PR B.5 baseline**: at Anthropic-grade models, **anti-template scored a perfect 5.00 on every reading (107/107)**. Anti-template critique is wasted compute. Phase 1e should regenerate-on-fail only when **antiBarnum < threshold** (the one axis where no model scored a 5 — current floor 3.94-4.00) and possibly when **voiceAuthenticity drops to 3 or below** on understated signs. Drop the anti-template critique pass entirely. See [`docs/evals/2026-04-25-baseline.md`](../evals/2026-04-25-baseline.md) §"Editorial reading of the data" #2.
- PR E adds the composition: caller invokes `reading:generate` → `reading:judge` → if antiBarnum (or voice) below threshold, regenerate with feedback injected into the prompt → re-judge.
- Cap at 2 critique rounds to bound latency/cost; threshold tuned from PR B.5 baseline scores (suggested initial threshold: regenerate if antiBarnum ≤ 3 OR voiceAuthenticity ≤ 3).
- Quote verification continues to happen in `reading:generate`'s validators (correctness/safety); the judge's quote-fidelity score is a separate prose-quality signal.
- Where the composition lives: most likely a thin verb-shaped wrapper like `reading:generate-with-critique` that the cron route can call instead of bare `reading:generate`. The wrapper itself is composition — single function, no business logic, just the loop. Daily-publisher agent definition gains it as an additional tool.

### Phase 2 — Daily Rhythm Inputs

**PR F — `astronomy:moon-phase` verb + integration**
- New file: `src/tools/astronomy/moon-phase.ts`
- `moonPhase({ date }) → { phase: 'new' | 'waxing-crescent' | ... , illumination: number, phaseName: string }`
- Pure function — uses astronomical calculation (no API call), deterministic
- Feed astronomical facts into prompt; model uses them texturally or not at all
- Explicit prompt guardrails against "new moon intention / full moon release" tropes

**PR G — `calendar:seasonal-marker` verb + integration**
- New file: `src/tools/calendar/seasonal-marker.ts`
- 8 hardcoded dates per year (solstice × 2, equinox × 2, cross-quarters × 4)
- Returns `{ marker: 'spring-equinox' | ... | null, isSpecialDay: boolean }`
- When set, gives the reading's framing additional depth without requiring template language

**PR H — `astronomy:moon-sign` verb + integration**
- New file: `src/tools/astronomy/moon-sign.ts`
- `moonSign({ date }) → { sign, degree }` — pure astronomical calculation
- Adds 2.5-day flavor variation across all readings
- Lands after Phase 1 is proven so the writing foundation can carry the nuance

## 5. Architecture principles (enforce every PR)

- **Verbs not workflows.** Each astronomy/calendar input is its own atomic verb. `reading:generate` accepts their outputs as optional inputs and composes them in prompt assembly. No "daily context assembler" abstraction.
- **Atomic tools.** Each new verb is single-purpose, pure, deterministic. No side effects. No hidden state.
- **Composability.** Corpus retrieval composes with existing `philosopher:registry`, `quote-bank`, `sign-profile`. Astronomy verbs compose with `reading:generate`. Shared types live in `@horoscope/shared`.
- **Emergent capability.** Any agent (daily-publisher, social-poster, future mentor runtime) can compose these verbs to achieve goals — not just the current API route.

## 6. Open questions (must resolve before the relevant PR)

### Living-philosopher corpus posture — blocks PR D

For Naval, Chopra, Sadhguru, Tolle, Pema Chodron, Dyer, Watts (late-career), etc., we need a stance:

- **(a)** Index freely under fair-use-for-transformative-use (commentary/educational context). Aggressive posture; defensible for short-quotation but risky at scale.
- **(b)** Index only freely-shared material (public podcasts, tweets, Wikiquote, publicly licensed talks). Narrow but safe.
- **(c)** Skip corpus for living philosophers entirely; they stay on current voice + quote-bank path. Users who pick living-philosopher-heavy councils get pre-Phase-1 quality for those voices.

**Lean**: (b) — (a)'s risk isn't worth it pre-scale; (c) means the living tier gets weaker readings forever.

**Must be answered before PR D ships.**

### Haiku vs. Sonnet for reading generation — informs PR C

Haiku 4.5: ~2–3× cost of gpt-4o-mini, fast, good quality. Sonnet 4.6: ~7–10× cost, stronger voice consistency and multi-constraint handling.

Both are cheap at 13M tokens/year. The question is whether the authenticity delta justifies Sonnet. Decide from the PR B→C eval (generate same readings on both, compare blind).

## 7. Known risks

- **Astrology-template clichés.** Moon phase / seasonal markers / moon sign all risk tropey output. Self-critique pass is the primary guardrail; prompt engineering is secondary. Worth testing output specifically on these patterns in Phase 2.
- **Writing quality regression from Sonnet swap.** If Sonnet's "voice" differs meaningfully from gpt-4o-mini on a sign, users might notice. Mitigate by keeping feature flag live during rollout; instant revert path.
- **Corpus acquisition effort.** Deep corpora for 15–20 PD philosophers is non-trivial text-wrangling. Budget carefully; don't let it block PR D infrastructure from landing.
- **Latency creep.** AI SDK migration + self-critique pass + corpus retrieval each add latency. Cron-driven generation is latency-tolerant; user-facing calls less so. Monitor p95 on `/api/horoscope`.
- **Cache key explosion.** Moon phase / moon sign change daily; seasonal markers only shift on 8 days/year. Existing cache key already includes date, so daily rhythm inputs are naturally handled. No new cache concerns.

## 8. Success criteria

Phase 1 complete when:
- All model access routes through AI SDK + Gateway
- `reading:generate` uses Sonnet 4.6 (or Haiku 4.5 if eval justifies) with Zod-enforced schema
- Corpus retrieval infrastructure covers all 54 philosophers with deep data for ≥15
- Self-critique pass catches ≥90% of forbidden patterns in synthetic eval
- Blind side-by-side eval: majority of 12 signs × 3 philosophers readings judged "feels more authentic" on new path

Phase 2 complete when:
- Moon phase, seasonal markers, moon sign each compose into `reading:generate` as optional inputs
- Each verb has atomic-tool tests matching `__tests__/tools/` patterns
- Outputs on moon-phase-anchored days (new/full moon) avoid trope language in blind eval

## 9. References

- Research synthesis: web research on horoscope/reflection app personalization inputs (2026-04-24). Top findings: writing quality > input richness; rising sign is #1 industry upgrade but requires birth time; moon sign of the day is universal; mood tap works in journaling apps but not here.
- Previous architecture decisions: `docs/HANDOFF.md` (agent-native tool architecture, verbs-not-workflows mandate)
- Related PRs: #48 (agent-native migration), #55 (shared package), #58 (first MCP App validates pattern)
- Memory: `workspace_build_lockstep.md`, `mcp_app_registry_duplication.md`
