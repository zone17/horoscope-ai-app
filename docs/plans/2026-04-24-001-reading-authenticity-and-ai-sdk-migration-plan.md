# Plan: Reading Authenticity + AI SDK Migration

> **Date**: 2026-04-24
> **Status**: Approved, ready to execute
> **Scope**: Rework the reading generation pipeline to produce authentic, philosopher-grounded readings. Migrate all model access to Vercel AI SDK via AI Gateway. Add daily-rhythm astronomical inputs.

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

**PR A — AI SDK + AI Gateway wiring**
- Install `ai`, `@ai-sdk/gateway` (or plain `"provider/model"` strings via gateway)
- Add `AI_GATEWAY_API_KEY` env var (Vercel env sync)
- New file: `src/tools/ai/provider.ts` — thin wrapper that exposes `generateText`, `generateObject`, `streamText` for the rest of the codebase
- Smoke test: a minimal `generateText` call verifies the gateway path end-to-end
- No behavior change yet; no migration of existing code

**PR B — Port `reading:generate` to AI SDK (parity run)**
- Behind feature flag `FEATURE_FLAG_USE_AI_SDK` (default off)
- When flag is on, route through `src/tools/ai/provider.ts`
- Still targeting `gpt-4o-mini` for exact parity — this PR proves the abstraction works without changing output
- A/B diff 12 signs × 3 philosophers; outputs must match token-for-token within rounding

**PR C — Swap to Sonnet 4.6 + `generateObject` + Zod schema**
- Flip the model to `anthropic/claude-haiku-4-5` for first pass (cost-sensitive), or `anthropic/claude-sonnet-4-6` if quality delta justifies
- Replace free-form JSON parsing with `generateObject` + Zod schema defining `ReadingOutput`
- Schema enforces: `message` (40–80 words), `bestMatch` (comma-separated sign list), `inspirationalQuote`, `quoteAuthor`, `peacefulThought`
- Side-by-side quality eval: generate 12 signs × 3 philosophers on both old (gpt-4o-mini) and new (Sonnet 4.6) paths; manual authenticity review
- Roll forward or iterate based on eval

**PR D — Corpus retrieval infrastructure (all 54, deep for ~15–20)**
- New package: `@horoscope/corpus` OR extend `@horoscope/shared` with corpus utilities
- Data shape: per-philosopher semantic chunks with source metadata (work title, section/chapter, page/timestamp, URL where available)
- Retrieval verb: `philosopher:retrieve-passages({ philosopher, theme, k: 5 }) → { passages: [{text, source, citation}] }`
- Graceful degradation: if corpus is empty/thin for a philosopher, verb returns empty array; `reading:generate` falls back to current voice + quote-bank path for that philosopher
- Ship mechanism with deep corpus for ~15–20 PD philosophers (Stoics, Classical, older Eastern Wisdom, older Science & Wonder); backfill others in follow-up PRs
- `reading:generate` prompt assembly gains a "grounded passages" section when corpus returns results

**PR E — Self-critique pass**
- Second AI SDK call: given a generated reading, evaluate against:
  - Current `avoidPatterns` per sign
  - Forbidden-phrase list (tapestry, celestial, embrace, navigate, etc.)
  - Barnum-pattern detection (vague statements that could apply to any sign)
  - Astrology-template patterns ("as the new moon rises", "the cosmos whispers")
  - Quote verification (any quoted text in `inspirationalQuote` must match `quote-bank` or retrieved corpus)
- If critique fails, regenerate with specific feedback injected into the prompt
- Cap at 2 critique rounds to bound latency/cost
- Use Haiku 4.5 for critique (cheap, fast)

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
