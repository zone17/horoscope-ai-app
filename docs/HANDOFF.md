# Handoff: Today's Horoscope — Philosophy Engine

> **Date**: 2026-04-26
> **Main at**: post-PR #67 (`f50faa9`) · **PRs shipped**: 67 total · **This sprint added**: #57, #58, #59, #60, #61, #62, #63, #64, #65, #66, #67
> **Active initiative**: Reading Authenticity + AI SDK Migration — **Phase 1 is functionally complete (1a/1b/1b.5/1c/1e shipped, 1d blocked on a strategic decision)**
> **Status**: production stable; Sonnet 4.6 generates daily readings via `generateObject` + canonical Zod schema; critique-loop composer is shipped and tested but not wired into cron yet (function-timeout fix is the gate). 159 tool tests, all green.

This is the authoritative onboarding document. Read top-to-bottom before changing anything. It assumes nothing about prior context. After reading, you should be ready to ship within an hour.

---

## 1. Status snapshot — read this first

### What ships today

- **Live**: `www.gettodayshoroscope.com` (frontend) + `api.gettodayshoroscope.com` (API). Two separate Vercel projects.
- **Product**: users pick a zodiac sign and a council of up to 5 philosophers from 54 thinkers across 9 traditions. Daily reading blends the council's frameworks with the sign's voice; one philosopher's verified quote is featured per day.
- **Generation**: Anthropic Sonnet 4.6 via Vercel AI Gateway, structured output via `generateObject` + `ReadingOutputModelSchema` (Zod, camelCase). One internal retry on schema flake (different transport: `generateText` + manual normaliser + `Schema.parse`). Post-call validators apply quote-author allowlist, quote-bank fallback, self-match filter, and an element-based bestMatch fallback if the model returns only the user's own sign.
- **Architecture**: 22 atomic tools in `src/tools/`, 3 declarative agent definitions in `src/agents/`, MCP server with 12 tools + 2 interactive MCP Apps, shared package at `packages/shared/`.

### The mandate

Readings should feel like the philosopher is actually speaking — "a mashup *in the style of*" the selected gurus, grounded in their real writings. Quotes must be real and attributed. No formulaic check-ins, no horoscope tropes, no Barnum-effect vagueness. **The moat is anti-template writing.** Sonnet 4.6 + the verified quote bank gets us most of the way; corpus-grounded prose (Phase 1d) is the remaining lever.

### What's blocked, what's next

| Item | Status | Path forward |
|---|---|---|
| **Cron uses critique-loop composer** | Shipped but not wired (timeout-blocked) | Fix the cron's 30s `maxDuration` problem (see §13 Backlog #1). Once parallelized, swap `generateReading` → `generateReadingWithCritique` in `src/app/api/cron/daily-horoscope/route.ts` (one line). |
| **Phase 1d — corpus retrieval** | Plan written; blocked on living-philosopher posture | Decide: (a) index freely under fair-use, (b) index only freely-shared material, (c) skip living philosophers entirely. **Lean is (b).** See §11 Open questions. |
| **Remove `OPENAI_API_KEY` from Vercel env** | Deferred ~1 week post-PR #65 | Verify no other consumers (especially `src/utils/horoscope-generator.ts` for monthly pages — still uses raw OpenAI SDK and IS a consumer). Migrate it OR leave the env var until that migration. |
| **Phase 2 — astronomical inputs** | After Phase 1d corpus | Moon phase, seasonal markers, moon sign as new atomic verbs. Plan in `docs/plans/2026-04-24-001-...`. |

### Plan documents (single source of truth for the initiative)

- [`docs/plans/2026-04-24-001-reading-authenticity-and-ai-sdk-migration-plan.md`](./plans/2026-04-24-001-reading-authenticity-and-ai-sdk-migration-plan.md) — parent plan, all phases
- [`docs/plans/2026-04-25-001-reading-eval-harness-and-model-baseline-plan.md`](./plans/2026-04-25-001-reading-eval-harness-and-model-baseline-plan.md) — Phase 1b.5 (eval harness)
- [`docs/evals/2026-04-25-baseline.md`](./evals/2026-04-25-baseline.md) — 144-cell 4-model eval; the data behind the Sonnet 4.6 decision

---

## 2. What this app is (and isn't)

**Positioning**: "Not predictions. Philosophy that meets you where you are."

**Not**: a generic horoscope app. Not fortune-telling. Not a journaling app. Not a mood tracker. Not an astrology-purist app.

**Is**: a Philosophy Engine. Each day's reading is generated for the user's sign, blending the intellectual frameworks of their council members with the sign's documented voice. The featured quote is drawn from a verified quote-bank. The reading body is style-matched synthesis — *not* first-person impersonation, *not* attributed paraphrase, just "in the style of" the council.

**The moat**: ChatGPT can write a horoscope. ChatGPT can write about Seneca. ChatGPT cannot remember your specific council across days and synthesize across their actual writings, rooted in verifiable sources, without sounding like a horoscope. That's what this builds toward.

**Future direction (deferred — do NOT build for this today)**: a premium "always-available mentor" tier where each council member is reachable for conversation. We do not build infrastructure for that today — no conversational state, no per-user memory, no streaming. We do build the *foundation* (corpus retrieval, AI SDK chokepoint, atomic verbs, critique loop) that would enable it later.

**Live URLs:**
| Surface | URL | Vercel project |
|---|---|---|
| Frontend | https://www.gettodayshoroscope.com | `horoscope-ai-frontend` (`prj_4Sha6rIf48CT3llWeOMMnPFqLHYS`) |
| API | https://api.gettodayshoroscope.com | `horoscope-ai-api` (`prj_rWJqgnyvBJZOIUA2R0BvpY5wzZ5E`) |
| Repo | https://github.com/zone17/horoscope-ai-app | — |
| Team | `zone17` | `team_Rzq7CDbcuKfoNn4pJFUAZztO` |

---

## 3. Architecture principles (NON-NEGOTIABLE)

These four principles govern every code review. They are enforced by multi-persona review before merge; violations are blockers, not suggestions.

### Verbs not workflows

Write atomic verbs (`reading:generate`, `philosopher:recommend`, `cache:store`). Do not write workflows ("daily-horoscope-pipeline", "reading-orchestrator"). Agents compose verbs. Do not bake composition into code — expose the verbs and let an agent (or an API route acting as an agent, or a dedicated thin composer verb like `reading:generate-with-critique`) sequence them.

The `reading:generate-with-critique` composer (PR #67) is the cleanest existing example: it wraps `reading:generate` + `reading:judge` in a bounded `generate → judge → regenerate` loop. Both underlying verbs stay atomic and unaware of each other; the composer is a single function with one responsibility (sequence them). See [critical-patterns.md #3](./solutions/patterns/critical-patterns.md) for the four hardening points any future composer should adopt.

### Atomic tools

Each verb does one thing. Pure function where possible. No hidden state. No side effects. No bundled calls. If "all philosophers in a tradition" is a need, that is `listPhilosophers().filter(p => p.tradition === X)` — composition, not a new `listByTradition` verb.

### Composability

Tools compose into other tools and into agents. Shared data has a single source of truth; consumers import from it. Duplication is a code review blocker. The canonical examples:
- `ReadingOutputModelSchema` lives in `src/tools/reading/types.ts`; `reading:generate` enforces it; the eval harness imports it (PR #65 closed the previous duplication).
- `BANNED_WORDS`/`BANNED_PHRASES`/`ASTROLOGY_TROPES` live in `src/tools/reading/judge.ts` and are the single source of truth for the anti-template moat (PR #63).

### Emergent capability

From atomic verbs, new agent behaviors emerge. The Philosopher Picker MCP App (PR #58) and the critique-loop composer (PR #67) are not workflows — they are compositions over atomic verbs. Future agents can use them or skip them; the verbs themselves don't care.

### What this means in review

A 2-persona review (correctness + maintainability) runs on every PR. A 4-to-8-persona review runs on PRs touching verbs, transports, prompts, or principled surfaces. Any finding that cites a principle violation is a blocker. "Feels clunky" is a P3; "introduces a workflow wrapper around an atomic verb" is a P1.

---

## 4. The reading pipeline (production data flow)

```
User picks sign (Aries) + council (Seneca, Alan Watts, Rumi, Feynman, Ravikant)
  ↓
/api/horoscope?sign=aries&philosophers=Seneca,Alan+Watts,Rumi,Feynman,Naval+Ravikant
  ↓
1. assignDaily({ sign, council, date })           → picks today's philosopher from
                                                      council (sign-aware rotation)
  ↓
2. retrieve({ sign, philosopher, date })          → Redis: personalized key first,
                                                      daily-key fallback. Cache hit? Return.
  ↓
3. generateReading({ sign, philosopher, date })   ← atomic verb, src/tools/reading/generate.ts
   ├─ getSignProfile(sign)                            → voice + avoidPatterns + element
   ├─ getFormatTemplate(sign, date)                   → one of 12 writing structures
   ├─ getQuotes(philosopher, dateSeed)                → 4 verified quotes from quote-bank
   ├─ buildReadingPrompt({...feedback?})              → full prompt: SOUL + voice + rules +
   │                                                     format + quote bank section + WHAT
   │                                                     TO INCLUDE; if `feedback` is set,
   │                                                     appends critique block AFTER the
   │                                                     contract section (recency-bias rule)
   ├─ generateAndValidateOnce → generateAndValidateRetry on throw
   │  ├─ ATTEMPT 1: generateObject({ MODELS.sonnet,
   │  │                              ReadingOutputModelSchema,
   │  │                              prompt, maxOutputTokens: 800 })
   │  └─ ATTEMPT 2 (only if attempt 1 throws):
   │     generateText({ MODELS.sonnet, prompt + 'JSON only', 800 })
   │       → JSON.parse → normaliseModelKeys (snake→camel) → Schema.parse
   │  Both throw → propagate. Cron / route handler decides.
   ├─ word-count telemetry warn if message outside 40-80
   ├─ validate quoteAuthor against VALID_AUTHORS (override if unknown)
   ├─ validate inspirationalQuote against VERIFIED_QUOTES (deterministic
   │   date-seeded fallback if not from bank)
   └─ filter self-matches from bestMatch; fall back to ELEMENT_FALLBACK_MATCHES
       if filter empties
  ↓
4. store({ sign, philosopher, date, council, reading }) → Redis write, 1d TTL
  ↓
5. toSnakeCase(reading) → response { success: true, cached: false, data: {...} }
```

### Critique-loop variant (NOT yet wired; available)

```
generateReadingWithCritique({ sign, philosopher, date })  ← atomic composer, src/tools/reading/generate-with-critique.ts
  Loop bounded at MAX_CRITIQUE_ROUNDS=2 (3 generations max):
    ├─ generateReading(...) [potentially with feedback]
    ├─ judgeReading(...) → 5 scores + violations + rationale
    ├─ Update best-so-far via compositeQuality(judge) = overall × 2 + antiBarnum + voice
    ├─ If !shouldRegenerate(judge): return last attempt (acceptance path)
    │   shouldRegenerate fires on: overall ≤ 3 OR antiBarnum ≤ 3 OR voiceAuthenticity ≤ 3
    │   (anti-template excluded — Sonnet hits 5/5; critiquing would be wasted compute)
    ├─ If rounds >= MAX: return BEST attempt (NOT last) with thresholdMissedAfterMaxRounds=true
    └─ Else: feedback = buildFeedbackFromJudge(judge); rounds++; continue
  Returns { reading, judge, rounds, thresholdMissedAfterMaxRounds }
```

Today the cron (`/api/cron/daily-horoscope`) calls bare `generateReading`. The composer is shipped, tested (12 tests), and ready. The migration is gated on the function-timeout fix — see §13 Backlog #1.

---

## 5. Code map

### `src/tools/` — verbs (source of truth for all business logic)

```
src/tools/
├── ai/
│   └── provider.ts              ← AI SDK + Gateway chokepoint (PR #60).
│                                  Re-exports generateText/generateObject/streamText.
│                                  Exposes MODELS { haiku, sonnet, opus } — single
│                                  source of truth for gateway model IDs. NEVER
│                                  hardcode IDs in consumers; always reference MODELS.
│                                  Header documents the known gap: horoscope-generator.ts
│                                  still uses raw OpenAI directly (monthly pages).

├── zodiac/
│   ├── sign-profile.ts          ← 12 sign personalities, voices, elements, avoidPatterns.
│   │                              Exports VALID_SIGNS (canonical) + isValidSign type guard.
│   └── sign-compatibility.ts    ← Element-based sign matching.

├── philosopher/
│   ├── registry.ts              ← 54 philosophers, 9 traditions. CANONICAL.
│   │                              Duplicated in packages/mcp-server/src/index.ts AND
│   │                              packages/mcp-server/src/app/philosopher-picker/
│   │                              philosophers.data.js (see §11 — P2 hoist tracked).
│   ├── assign-daily.ts          ← Daily philosopher rotation from council, sign-aware.
│   └── recommend.ts             ← Sign-based suggestions with buildReason().

├── reading/
│   ├── generate.ts              ← Main generation verb. Sonnet 4.6 via generateObject +
│   │                              ReadingOutputModelSchema. Single retry via
│   │                              generateText + normaliseModelKeys + manual schema parse
│   │                              on first throw. Post-call validators preserve business
│   │                              rules. Optional `feedback` parameter for critique-loop
│   │                              regenerations (sanitized in buildReadingPrompt).
│   │                              ELEMENT_FALLBACK_MATCHES handles empty bestMatch.
│   │                              Word-count telemetry warn on out-of-range messages.
│   │                              See design-patterns/generateobject-production-hardening-
│   │                              20260426.md for the 5-point pattern this verb embodies.
│   ├── judge.ts                 ← reading:judge — scores any reading on 5 axes
│   │                              (voice, anti-Barnum, anti-template, quote fidelity,
│   │                              overall) via MODELS.haiku + generateObject + Zod.
│   │                              7-point prompt-injection hardening (tag wrap +
│   │                              two-tier sanitizer + INSTRUCTION INTEGRITY prologue
│   │                              + END OF DATA epilogue + no attribute interpolation
│   │                              + trusted-only headers + per-field truncation).
│   │                              Pure verb. BANNED_WORDS / BANNED_PHRASES /
│   │                              ASTROLOGY_TROPES exported as canonical constants.
│   │                              See design-patterns/llm-as-judge-prompt-injection-
│   │                              hardening-20260425.md for the full 7-point pattern.
│   ├── generate-with-critique.ts ← Phase 1e composer. Wraps generate + judge in a
│   │                              bounded critique loop (max 2 regenerations).
│   │                              Threshold: overall ≤ 3 OR antiBarnum ≤ 3 OR
│   │                              voiceAuthenticity ≤ 3 (anti-template dropped per
│   │                              baseline). 4-point hardening: BEST-of-N tracking,
│   │                              symmetric judge-output sanitization, sanitized
│   │                              feedback parameter (in generate.ts), critique block
│   │                              at END of prompt. See design-patterns/critique-loop-
│   │                              best-of-n-hardening-20260426.md. Composition lives
│   │                              HERE — neither generate nor judge knows about each
│   │                              other. NOT yet wired into cron (timeout-blocked).
│   ├── quote-bank.ts            ← VERIFIED_QUOTES + VALID_AUTHORS validation list.
│   ├── format-template.ts       ← 12 writing-format rotations, sign-aware + date-seeded.
│   └── types.ts                 ← ReadingOutput (camelCase) + HoroscopeData (snake_case)
│                                  + ReadingOutputModelSchema (Zod, the runtime parallel
│                                  of ReadingOutput minus injected fields) enforced by
│                                  reading:generate. Compile-time _Assert invariant
│                                  links the schema to the interface — renaming either
│                                  side breaks compilation.

├── cache/
│   ├── keys.ts                  ← Deterministic cache key (sign + philosopher + council hash).
│   ├── store.ts                 ← Redis write with 'horoscope-prod:' namespace, 1d TTL.
│   ├── retrieve.ts              ← Redis read with personalized-key → daily-key fallback.
│   └── invalidate.ts            ← SCAN+DEL pattern.

├── content/
│   ├── format.ts                ← Reading → 6 platform formats (Twitter, FB, etc.).
│   ├── share-card.ts            ← Re-export from @horoscope/shared.
│   └── distribute.ts            ← Ayrshare multi-platform posting.

└── audience/
    ├── subscribe.ts             ← Redis-based email rate limiting.
    ├── unsubscribe.ts           ← Same composition pattern.
    └── segment.ts               ← Same composition pattern.
```

**22 tool files total.** All pure or nearly pure; side effects restricted to Redis/AI-Gateway/Ayrshare. New code goes here first; old consumers migrate opportunistically.

### `src/agents/` — agent definitions (declarative, no runtime yet)

```
src/agents/
├── daily-publisher.ts           ← Goal: publish 12 readings/day. 7 verbs.
├── social-poster.ts             ← Goal: cross-platform content distribution. 5 verbs.
├── onboarding-guide.ts          ← Goal: conversational council building. 5 verbs.
└── index.ts
```

Each agent has `name`, `goal`, `tools` (verb allowlist), `constraints`. **No script, no step sequence.** The idea is that an agent runtime (not yet built — see §11 architectural decision) reads the goal + constraints and composes the listed verbs. Today these definitions are unused. They exist as the target shape for future Phase 2+ work and for the future "premium mentor" tier.

### `packages/shared/` — `@horoscope/shared` workspace package

```
packages/shared/
├── src/share-card.ts            ← Canonical share-card SVG generator, zero deps, 312 lines.
└── src/index.ts                 ← Barrel export.
```

Introduced in PR #55. Must be built (`npm run build --workspace=packages/shared`) before `next build`. **This has burned us repeatedly — see Pitfall #6.**

### `packages/mcp-server/` — MCP server + MCP Apps

```
packages/mcp-server/
├── src/index.ts                 ← 12 MCP tools + 2 MCP App resources. Contains an
│                                  inline PHILOSOPHERS list (mirror of registry.ts;
│                                  expanded to full 54 in PR #58). reading:judge and
│                                  reading:generate-with-critique are NOT yet exposed
│                                  via MCP — tracked for a follow-up bundle.
├── src/confirm-council.ts       ← Pure validator for philosopher_picker_confirm.
├── src/app/
│   ├── share-card/              ← Original MCP App (PR #52). Vite singlefile build.
│   └── philosopher-picker/      ← Second MCP App (PR #58). Vite singlefile build.
│       └── philosophers.data.js ← Second inline copy of the registry.
└── vite.config.ts               ← Multiplexes apps via MCP_APP env var.
```

**Registry duplication**: three copies of the 54-philosopher list exist (`src/tools/philosopher/registry.ts` is canonical; `packages/mcp-server/src/index.ts` mirrors it; `packages/mcp-server/src/app/philosopher-picker/philosophers.data.js` is an MCP App snapshot). All three carry sync warnings. **P2 hoist to `@horoscope/shared` is tracked** (memory file `mcp_app_registry_duplication.md`).

### `src/app/api/` — API routes (thin composers)

Every route is a 20-to-60 line composer. Business logic lives in `src/tools/`.

| Route | Method | Auth | Purpose |
|---|---|---|---|
| `/api/horoscope?sign=X&philosophers=...` | GET | Public | assign → cache → generate → store → return. **Today calls bare `generateReading`.** |
| `/api/cron/daily-horoscope` | GET | `CRON_SECRET` | 12× (assign → generate → store → email). **Today calls bare `generateReading`.** Migration to `generateReadingWithCritique` blocked on function-timeout fix (§13 #1). |
| `/api/og/[sign]` | GET | Public | Dynamic OG image (edge runtime — do not add OpenAI here) |
| `/api/subscribe` | POST | Public | Email capture → Redis |
| `/api/unsubscribe` | GET | Public | One-click unsubscribe |
| `/api/horoscopes` | GET | Public | All 12 signs batch read |
| `/api/debug/ping` | GET | Public | Health check |
| `/api/debug/redis` | GET | Public | Cache inspection |
| `/api/analytics/vitals` | POST | Public | Web vitals |

### Frontend (Next.js App Router)

| Page | Route | Rendering |
|---|---|---|
| Home | `/` | ISR (1h) — sign picker → philosopher grid → reading flow |
| Sign page | `/horoscope/[sign]` | ISR (1h) — full reading, OG tags, share |
| Daily archive | `/horoscope/[sign]/daily/[date]` | ISR (24h) |
| Monthly | `/horoscope/[sign]/monthly/[monthYear]` | ISR (24h) — **still uses legacy `horoscope-generator.ts` + raw OpenAI SDK** |
| About author | `/about/author` | ISR (24h) — Elena Vasquez persona |

Frontend does not make LLM calls. It fetches readings from the API via Vercel rewrites.

### Legacy utils (migration in progress)

```
src/utils/
├── feature-flags.ts             ← Active. USE_AI_SDK removed in PR #65.
├── verified-quotes.ts           ← Data; consumed by reading:quote-bank. Stable.
├── horoscope-generator.ts       ← LEGACY. Still used for monthly page. Uses raw OpenAI SDK.
│                                  Blocks OPENAI_API_KEY removal until migrated.
├── horoscope-prompts.ts         ← LEGACY. Consumed by horoscope-generator. Dies with it.
├── horoscope-service.ts         ← LEGACY. Consumed by HoroscopeDisplay.tsx,
│                                  AllHoroscopesContext.tsx. Needs a batch fetch verb.
├── cache-keys.ts                ← LEGACY. Used by debug routes (matches production cache).
├── redis-helpers.ts             ← LEGACY. Same reason as cache-keys.ts.
└── ...
```

**Rule**: new code imports from `src/tools/`. Old consumers migrate opportunistically, one at a time. Don't rewrite old utils — migrate their callers.

---

## 6. The 9 philosopher traditions

Canonical source: `src/tools/philosopher/registry.ts`.

| Tradition | Count | Philosophers |
|---|---|---|
| **Stoicism** | 8 | Marcus Aurelius, Seneca, Epictetus, Cato, Musonius Rufus, Cleanthes, Zeno, Chrysippus |
| **Epicureanism** | 1 | Epicurus |
| **Classical** | 3 | Socrates, Plato, Aristotle |
| **Eastern Wisdom** | 9 | Lao Tzu, Alan Watts, Krishnamurti, Thich Nhat Hanh, Rumi, Confucius, Zhuangzi, D.T. Suzuki, Pema Chodron |
| **Science & Wonder** | 9 | Einstein, Feynman, Sagan, Curie, Tesla, Carson, Tyson, Lovelace, Heisenberg |
| **Poetry & Soul** | 9 | Nietzsche, Emerson, Gibran, Oliver, Wilde, Thoreau, Angelou, Whitman, Hesse |
| **Spiritual Leaders** | 9 | Dispenza, Russell, Tolle, Ram Dass, Chopra, Yogananda, Mooji, Sadhguru, Dyer |
| **Existentialism** | 4 | de Beauvoir, Camus, Frankl, Arendt |
| **Contemporary** | 2 | Taleb, Naval Ravikant |

**Adding or modifying philosophers** — touch all three files until the registry hoist lands:
1. `src/tools/philosopher/registry.ts` (canonical, full metadata)
2. `packages/mcp-server/src/index.ts` (inline mirror)
3. `packages/mcp-server/src/app/philosopher-picker/philosophers.data.js` (MCP App snapshot)

Each carries a sync warning in its header.

---

## 7. Sprint 9 PRs (this session)

| PR | Summary | Compound doc |
|---|---|---|
| **#57** | P2 backlog: council rotation sign-aware, `VALID_SIGNS` dedupe, `mountedRef` fetch guard | — |
| **#58** | MCP App — Philosopher Picker. Two new MCP tools. Expanded registry to 54 | — |
| **#59** | Fixed Vercel preview deploy failures (`@horoscope/shared` build) | — |
| **#60** | Phase 1a: AI SDK + Gateway chokepoint (`src/tools/ai/provider.ts`) | — |
| **#61** | Phase 1b: `reading:generate` parity port behind `FEATURE_FLAG_USE_AI_SDK` | — |
| **#62** | Comprehensive handoff (predecessor of this doc) | — |
| **#63** | Phase 1b.5: `reading:judge` verb + 4-model 144-cell baseline eval | [`design-patterns/llm-as-judge-prompt-injection-hardening-20260425.md`](./solutions/design-patterns/llm-as-judge-prompt-injection-hardening-20260425.md) |
| **#64** | Compound doc + bootstrap of `critical-patterns.md` and `common-solutions.md` | — |
| **#65** | Phase 1c: Sonnet 4.6 + `generateObject` + canonical Zod schema; deleted legacy OpenAI path + flag | [`design-patterns/generateobject-production-hardening-20260426.md`](./solutions/design-patterns/generateobject-production-hardening-20260426.md) |
| **#66** | Compound doc for PR #65 | — |
| **#67** | Phase 1e: `reading:generate-with-critique` composer (BEST-of-N + symmetric defense + recency-bias placement) | [`design-patterns/critique-loop-best-of-n-hardening-20260426.md`](./solutions/design-patterns/critique-loop-best-of-n-hardening-20260426.md) |

**Every PR ran the loop**: spawn → principle-aware implementation → multi-persona review → remediation → merge. Notable corroborated findings across the sprint:

- **PR #63 round 2 prompt injection** (judge): 4 attack vectors discovered across 3 review rounds (bare-delimiter escape, attribute injection, markdown-heading injection, header regression).
- **PR #65 round 1 generateObject hardening**: 1 P0 (no retry on schema flake → 24h cron skip cascade), 3 P2s closed in round 2.
- **PR #67 round 1 BEST-of-N**: 3-reviewer corroboration on the "returns LAST attempt" risk; 4 P2s total closed in round 2.

The sprint produced **3 P1-class design patterns** (canonical pattern files updated each time) + **10 P2/P3 sub-patterns** (common-solutions index).

---

## 8. Phase status (parent plan)

| Phase | What | Status | Notes |
|---|---|---|---|
| **1a** | AI SDK + Gateway chokepoint | ✅ Shipped (PR #60) | `src/tools/ai/provider.ts` is the single import surface |
| **1b** | `reading:generate` parity port behind flag | ✅ Shipped (PR #61) | Flag retired in 1c |
| **1b.5** | `reading:judge` verb + 4-model baseline eval | ✅ Shipped (PR #63) | Compound P1 #1 |
| **1c** | Adopt Sonnet 4.6 + `generateObject` + canonical Zod | ✅ Shipped (PR #65) | Compound P1 #2 |
| **1d** | Corpus retrieval infrastructure | 🔜 BLOCKED | Living-philosopher posture decision (§11) |
| **1e** | Self-critique pass (composition, not fold-in) | ✅ Shipped (PR #67) | Compound P1 #3. Verb live; cron rewiring blocked on §13 #1 |
| **2a** | `astronomy:moon-phase` atomic verb | 🔜 After Phase 1 | Prompt-engineered against template tropes |
| **2b** | `calendar:seasonal-marker` atomic verb | 🔜 After Phase 1 | 8 hardcoded dates |
| **2c** | `astronomy:moon-sign` atomic verb | 🔜 After Phase 2a | Lands last so writing foundation can carry nuance |

**Phase 1 is functionally complete.** The remaining unit (1d) is blocked on a strategic decision, not technical work. The cron rewiring (1e operational) is blocked on a function-timeout fix that's well-scoped and ~1 day of work.

---

## 9. Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `AI_GATEWAY_API_KEY` | Yes (local dev); auto via `VERCEL_OIDC_TOKEN` in deployed envs | Vercel AI Gateway auth |
| `OPENAI_API_KEY` | DEPRECATED — but **still required** | No longer used by `reading:generate` after PR #65. **Still used by `src/utils/horoscope-generator.ts` for monthly pages.** Removal blocked on monthly-page migration. |
| `UPSTASH_REDIS_REST_URL` | Yes (prod) | Cache + subscribers + rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | Yes (prod) | Redis auth |
| `RESEND_API_KEY` | For email | Daily email sending |
| `CRON_SECRET` | For cron | Secures `/api/cron/daily-horoscope` |
| `AYRSHARE_API_KEY` | For social | Multi-platform posting |
| `NEXT_PUBLIC_API_URL` | Optional | API base URL override |
| `HOROSCOPE_API_URL` | MCP server | API base for MCP tool delegation |
| `FEATURE_FLAG_USE_REDIS_CACHE` | Auto-set in vercel.json | Whether to use Redis caching for API responses |
| `FEATURE_FLAG_USE_RATE_LIMITING` | Auto-set in vercel.json | Whether to use Redis for rate limiting |
| Other `FEATURE_FLAG_*` | Various | See `src/utils/feature-flags.ts` |

Redis is lazy-initialized via Proxy in `utils/redis.ts`. App won't crash without Redis — just won't cache or rate-limit.

---

## 10. Two Vercel projects, one repo

| Project | Domain | Serves | Build |
|---|---|---|---|
| `horoscope-ai-api` | api.gettodayshoroscope.com | API routes, cron, OG images, LLM calls | `next build` (via `vercel.json`) |
| `horoscope-ai-frontend` | www.gettodayshoroscope.com | Pages, components, static assets | `scripts/frontend-build.sh` (strips API routes + middleware, copies `next.config.frontend.js`) |

**CI/CD** (`.github/workflows/deploy.yml`):
- On PR: `Build & Lint` job (Node 22, npm ci, build shared, tsc, lint, next build).
- On push to main: `Build & Lint` → parallel `Deploy API` + `Deploy Frontend` → `Post-Deploy Verification`.
- Each deploy job runs: `vercel pull --prod` → `vercel build --prod` → `vercel deploy --prebuilt --prod`.

**Known flaky pattern**: GH Actions `Deploy Frontend` (and occasionally `Deploy API`) can report failure while Vercel actually completes the deploy successfully — the CLI call times out waiting for a slow deploy, but Vercel promotes the build server-side. **Always verify against actual Vercel deployment state** before assuming production is broken. Memory: `vercel_deploy_false_positive_ci.md`.

---

## 11. Open questions (block specific phases or decisions)

### Living-philosopher corpus posture — BLOCKS Phase 1d

For Naval Ravikant, Deepak Chopra, Sadhguru, Eckhart Tolle, Pema Chodron, Wayne Dyer, late-career Alan Watts, and similar living/recently-active philosophers, we need a stance on corpus building:

- **(a) Index freely under fair-use-for-transformative-use** (commentary/educational context). Aggressive posture; defensible for short quotation but risky at scale.
- **(b) Index only freely-shared material** (public podcasts, tweets, Wikiquote, publicly licensed talks). Narrow but safe.
- **(c) Skip corpus for living philosophers entirely**; they stay on current voice + quote-bank path. Users who pick living-philosopher-heavy councils get pre-Phase-1 quality for those voices forever.

**Lean**: (b). (a)'s risk isn't worth it pre-scale; (c) creates a permanent two-tier quality gap. **Must be decided before Phase 1d starts.**

### Cron timeout fix — BLOCKS production critique loop

Cron iterates 12 signs sequentially with bare Sonnet (~10s/sign) and the 30s `maxDuration` is already tight. With critique loop (up to 3 generations + 3 judges per sign, ~30-50s worst case), it's impossible. Fix paths:

1. **Parallelize with bounded concurrency** (Promise.all + semaphore sized to provider RPM/2). Simplest. Still bounded by total Vercel function duration.
2. **Per-sign cron entries** (12 separate cron paths). Each runs its own 30s budget. Operationally cleanest; needs `vercel.json` updates.
3. **Move to Vercel Workflows / Queues** (durable async). Most flexible; biggest refactor.

Recommend **option 2** as the smallest unit of work that unblocks the critique loop. ~1 day. After it lands, the cron route swaps `generateReading` → `generateReadingWithCritique` in one line and Phase 1e is operationally complete.

### Haiku vs Sonnet tradeoff for cron — re-evaluate after Phase 1d

PR #65 picked Sonnet 4.6 over Opus 4.7 on cost parity at indistinguishable quality. After corpus retrieval lands (Phase 1d), Haiku 4.5 (~3x cheaper than Sonnet) may close enough of the voice gap to be the right cron-path model. Re-run the eval after Phase 1d ships. The eval harness + judge verb are already shipped and parametric on model.

### Agent runtime architecture — pre-Phase 2 decision

Three agent definitions (`src/agents/`) with zero runtime. Phase 2+ needs an answer:

- **Vercel AI SDK's agent loops** (`generateText` with `tools` + `stopWhen`) — composes cleanly with what we have, keeps runtime in-repo.
- **Anthropic Managed Agents** (hosted) — simpler operationally, platform lock-in, beta pricing.
- **Self-hosted loop** — most control, most code to maintain.

**Lean**: AI SDK agent loops. ~50 lines of glue on top of the Phase 1 foundation. Covers `daily-publisher` cron trigger cleanly. No lock-in.

### Registry hoist to `@horoscope/shared` — tracked P2

Three copies of the 54-philosopher list exist. Hoisting eliminates duplication. Blast radius: ~10 files + TS enum `Tradition` → `as const` interop. Not urgent. See memory `mcp_app_registry_duplication.md`. Good candidate for a small dedicated PR when someone is touching the registry anyway.

### `reading:judge` and `reading:generate-with-critique` MCP exposure — tracked

Neither verb is exposed via the MCP server today. PR #63 description explicitly deferred this to PR D or E. Trivial when an external agent needs one — both verbs have stable shapes and the existing MCP tools (`reading_generate`, etc.) provide the wiring template.

---

## 12. How to run

```bash
# Setup
cd /Users/fp/Desktop/horoscope-ai-app
npm install
cp .env.example .env.local                       # Fill in API keys
# Or: vercel env pull .env.eval --environment=development (safer scratch file)

# Build shared packages (required before next build; also automated in
# vercel.json, scripts/frontend-build.sh, and root `npm run build`)
npm run build --workspace=packages/shared

# Dev
npm run dev                                      # Starts Next.js on :3000

# Build (must pass with zero errors in changed files)
npm run build                                    # Runs shared prebuild + next build
# or: npx next build                             # Next.js alone (shared already built)

# Tests — 159 tool tests + ~140 component/util tests; some pre-existing failing
# suites (HANDOFF §13 backlog #2), all flagged as not-regression-introducing
npx jest --passWithNoTests                       # Use directly; npm test cascades to
                                                   # workspaces and may fail
npx jest __tests__/tools                         # Just the tool tests (always green)

# Specific test file
npx jest __tests__/tools/reading/judge.test.ts

# MCP server
cd packages/mcp-server && npm run build && npm start

# Health check
curl https://api.gettodayshoroscope.com/api/debug/ping

# Test a sign (prod) — try a non-default council to force fresh generation
curl "https://api.gettodayshoroscope.com/api/horoscope?sign=virgo&philosophers=Marcus+Aurelius,Naval+Ravikant,Pema+Chodron" | python3 -m json.tool

# Refresh cache (prod; requires CRON_SECRET)
curl -H "Authorization: Bearer $CRON_SECRET" https://api.gettodayshoroscope.com/api/cron/daily-horoscope

# Run the baseline eval (requires AI_GATEWAY_API_KEY in .env.local or .env.eval)
npx tsx scripts/eval/reading-baseline.ts                  # Full 144-cell run, ~25 min, ~$1
npx tsx scripts/eval/reading-baseline.ts --limit 4        # Smoke test
npx tsx scripts/eval/reading-baseline.ts --signs aries,leo --limit 8  # Subset

# Vercel env management (linked to API project)
vercel env ls                                    # List current env vars
vercel env add AI_GATEWAY_API_KEY production     # Add one (prompts for value)
vercel env pull .env.eval --environment=development  # Pull to scratch file (does NOT
                                                   # overwrite .env.local)

# Verify AI Gateway model availability
VERCEL_TOKEN=$(cat ~/Library/Application\ Support/com.vercel.cli/auth.json | python3 -c "import sys,json;print(json.load(sys.stdin).get('token',''))")
curl -H "Authorization: Bearer $VERCEL_TOKEN" https://ai-gateway.vercel.sh/v1/models | jq '.data[] | select(.id | startswith("anthropic/")) | .id'
```

---

## 13. Backlog

### Known P2/P1 (not yet addressed)

| # | Issue | Path forward |
|---|---|---|
| **1** | **Cron `/api/cron/daily-horoscope` migration to `generate-with-critique`** | **BLOCKS production critique loop.** Sequential 12-sign loop with bare Sonnet (~10s/sign) already approaches the 30s `maxDuration`. Critique loop (up to 3 generations + 3 judges per sign) makes it strictly worse. Recommended fix: per-sign cron entries (option 2 in §11). After timeout fix, swap `generateReading` → `generateReadingWithCritique` in the cron route — single line. The verb is shipped and tested; only the operational rewiring is gated. |
| 2 | Share-card em-dash overlaps first quote line | Fix `dy` offset in SVG `tspan` in `packages/shared/src/share-card.ts`. Needs visual verification. |
| 3 | 8 pre-existing test failures: `SchemaMarkup.test.tsx` (implicit `any`), `VideoBanner.test.tsx`, `HoroscopeDisplay.test.tsx`, `guidance.test.ts`, etc. | Each needs individual triage. None are regression-introducing. |
| 4 | Tests for impure tools (`cache:store`, `cache:retrieve`) | Need Redis mocking strategy. |
| 5 | Registry hoist to `@horoscope/shared` | Tracked; see §11. |
| 6 | `frontend-build.sh` `set -e` + `mv` can leave `src/app/api` unrestored on build failure | Pre-existing; low priority. Wrap in a `trap`. |
| 7 | Vercel deploy false-positive (GH Actions retry/timeout) | Diagnostic recipe documented; fix is lower priority since the actual deploy succeeds. |
| 8 | Migrate `src/utils/horoscope-generator.ts` (monthly pages) off raw OpenAI SDK | Blocks `OPENAI_API_KEY` removal. Should adopt `generateObject` + a parallel `MonthlyReadingOutputModelSchema` (longer message field; no quote-bank constraint). |
| 9 | `scripts/` directory excluded from `tsconfig` (the `parseError` typo in PR #65 round 1 was caught only by review, not by `tsc`) | Add scripts/ to tsconfig.json; fix any latent type errors that surface. |
| 10 | Word-count telemetry warns are `console.warn` only (PR #65 + #67) — no aggregation | When a structured-event observability layer lands, sweep the warn sites and migrate. Tracked in compound docs as TODO. |
| 11 | `reading:judge` + `reading:generate-with-critique` not exposed via MCP server | Trivial bundle PR when an external agent needs them. |

### Medium-term (post-Phase 1)

- **Resolve living-philosopher corpus posture** (§11) — unlocks Phase 1d.
- **Wire agent definitions to runtime** — connect `src/agents/` to an agent loop (see §11 architectural decision).
- **Phase 2 — astronomical inputs** — moon phase, seasonal markers, moon sign as new atomic verbs.
- **Re-eval Haiku vs Sonnet after Phase 1d** — corpus may close Haiku's voice gap, halving cost for the cron path.
- **Batch fetch tool** — unblocks migration of `HoroscopeDisplay` from legacy `horoscope-service.ts`.
- **Delete remaining old utils** — after all consumers are migrated.
- **More MCP Apps** — reading dashboard, daily publisher dashboard.

### Future-state (deliberately deferred)

- **Premium mentor tier** — conversational "always-available" philosopher. Requires per-user × per-philosopher conversational state, streaming, possibly voice. We are NOT building for this today; Phase 1-2 deliberately stays stateless and one-shot. The corpus retrieval foundation (Phase 1d) is load-bearing if we ever build it.
- **Rising sign at onboarding** — industry consensus #1 personalization upgrade, but requires birth time + major onboarding redesign. Revisit after Phase 1 ships and we see whether the writing-quality lever moved the needle enough on its own.
- **Stripe integration** — pricing page exists; no payment flow.
- **Social accounts** — TikTok + X setup + Ayrshare connection. Facebook Page already live.

---

## 14. Pitfalls (will burn you)

| # | Pitfall | How to avoid |
|---|---|---|
| 1 | **Tailwind v3 ONLY** | CSS uses `@tailwind base/components/utilities`. NEVER `@import "tailwindcss"` (v4 syntax). v4 silently produces zero CSS. |
| 2 | **Two Vercel projects from one repo** | Frontend build excludes API routes via `frontend-build.sh`. API routes proxy via Vercel rewrites. Env vars and project IDs are separate. |
| 3 | **Edge runtime crashes OpenAI SDK** | Never add `export const runtime = 'edge'` to routes using OpenAI SDK or the AI SDK. OG routes are edge (fine). |
| 4 | **Non-www redirect** | `gettodayshoroscope.com` 308s to `www.`. Always use `www.` in URLs/health checks. |
| 5 | **Double Redis prefix** | Legacy `safelyStoreInRedis` adds `horoscope-prod:` automatically. Never prepend manually. |
| 6 | **Workspace build lockstep** | Adding a workspace package with a `tsc` dist means updating ALL build entry points: `.github/workflows/deploy.yml`, `vercel.json` `buildCommand`, `scripts/frontend-build.sh`, root `package.json` `build` script. Production can stay green while previews and local dev silently break. Grep for `next build` when adding workspaces. |
| 7 | **`npm test` cascades** | Workspaces have `"test": "echo 'No tests yet'"` to avoid failures, but use `npx jest` directly. |
| 8 | **node-fetch** | Not a dependency. Next.js has built-in fetch. Never import it. |
| 9 | **30s function timeout** | Set in `vercel.json`. Hobby plan. The cron currently violates this principle (12 sequential generations). Backlog #1. |
| 10 | **Visual regressions** | Always screenshot before/after UI changes. Sprint 3 required 7 hotfix PRs from visual degradation. |
| 11 | **Vercel deploy false-positive** | GH Actions can report failure while Vercel actually deploys. Verify against Vercel deployment state. |
| 12 | **AI SDK silent option drops** | The AI SDK OpenAI chat provider does NOT accept `providerOptions.openai.responseFormat`. Undocumented options are silently dropped. Canonical JSON enforcement is via `generateObject` + Zod. Don't extrapolate from OpenAI SDK naming when writing AI SDK calls. |
| 13 | **Jest jsdom + web streams** | Tests that import the AI SDK must use `@jest-environment node` (first line of file). jsdom doesn't have `TransformStream` which `ai` needs. `jest.setup.js` guards DOM-only setup behind `typeof window !== 'undefined'`. |
| 14 | **Hardcoded gateway model IDs** | Never. Always reference `MODELS.haiku` / `MODELS.sonnet` / `MODELS.opus` from `@/tools/ai/provider`. Rotating the underlying ID should be a one-file change. |
| 15 | **Horoscope-template clichés** | "As the new moon rises..." / "the cosmos whispers..." / "set your intentions..." — the whole moat is anti-template. Prompt feeds astronomical *facts*, never template phrases. The judge verb (PR #63) catches these on out-of-band readings; production prompt prohibits them up front. |
| 16 | **`scripts/` excluded from tsconfig** | Type errors in eval scripts won't surface at build time. The `parseError` typo in PR #65 round 1 escaped to merge because of this. Run `npx jest` and any smoke test before assuming a script is correct. Backlog #9 to fix the tsconfig. |
| 17 | **Stale `.env.eval`** | The eval script loads `.env.local` then `.env.eval` with `override: true`. A stale `AI_GATEWAY_API_KEY` in `.env.eval` will silently override the working one in `.env.local`. Re-pull `.env.eval` if calls fail mysteriously: `vercel env pull .env.eval --environment=development`. |

---

## 15. Process norms (how we ship)

### The compound-engineering loop (mandatory)

```
(Brainstorm) → Plan → Work → Review → Compound
                 ↑                        ↓
                 └── knowledge feeds back ─┘
```

Solo tasks (single-file change, docs, P3) use a lightweight version: plan in head → implement → quick self-review → compound if learned something. Multi-file, multi-domain, or production-grade tasks run the full loop.

### Branch discipline (hook-enforced)

- `git commit` and `git push` on `main` are **hard-blocked** by `branch-discipline.sh`.
- Every session starts with `git branch --show-current` as the first action.
- Feature branches follow `{type}/{squad}/{ticket-or-slug}` (e.g., `feat/reading-auth/phase-1e-critique-composition`).
- Never work on `main`. Checkout a feature branch before editing.

### The review + remediation + merge flow (proven across PRs #57-#67)

1. **Open PR** (push feature branch → `gh pr create`).
2. **Spawn a multi-persona review** in parallel. Pattern: 4-to-8 reviewer personas (correctness, maintainability, project-standards always; + testing / TypeScript / architecture / reliability / security / adversarial / kieran-typescript based on diff content). Each returns compact JSON; orchestrator synthesizes.
3. **Triage findings** — classify as blocker / suggestion / defer. P0/P1 are blockers. Cross-reviewer corroboration (3+ reviewers flag the same issue) escalates severity.
4. **Remediate** — apply fixes in the feature worktree. Push.
5. **Wait for CI** on the remediation commit. Verify Vercel deployment state in addition to GitHub Actions.
6. **Merge** — `gh pr merge <n> --squash --delete-branch`. CE Review gate + watch-ci gate must be cleared.
7. **Verify production post-merge** — `curl` the key endpoints. Don't trust GH Actions alone (false-positive pattern, Pitfall #11).
8. **Compound** if the work surfaced a durable pattern. Cross-reference into `critical-patterns.md` / `common-solutions.md` / `PROJECT_CONTEXT.md`.

### Bounded review-loop budget

CLAUDE.md caps review→remediate at `max_rounds=2`. This budget DOES NOT include rounds that fix regressions YOU introduced — fixing your own bug doesn't count against the budget. Be explicit in the commit message when invoking the exception (see common-solutions #4).

### Hook-enforced gates

| Gate | Enforcer | Blocks | How to clear |
|---|---|---|---|
| **Branch discipline** | `branch-discipline.sh` | `git commit` / `git push` on main | Checkout a feature branch |
| **Watch-CI gate** | `security-gate-bash.sh` + `post-git-actions.sh` | All bash commands after `git push`, `gh pr create`, `gh pr merge`, `gh run rerun` until `/watch-ci` runs | Run `gh run list`, `gh run watch`, or `gh run view` (or invoke `/watch-ci` skill) |
| **CE Review gate** | `security-gate-bash.sh` | `gh pr merge` unless review marker present | Invoke `compound-engineering:ce-code-review` skill for the branch, OR use `--no-review` for docs-only / config-only PRs (the `docs/*` branch prefix auto-bypasses) |
| **Decision gate** | `decision-gate.sh` | `git commit` when architectural files change without `DECISIONS.md` update | Update `DECISIONS.md` |
| **Security gate (files)** | `security-gate-files.sh` | Edits to `.env*`, credentials, keys | Don't edit those files |
| **Security gate (bash)** | `security-gate-bash.sh` | `rm -rf /`, `git reset --hard`, force-push to main, `DROP TABLE` | Don't run them |

### Memory system

- Path: `/Users/fp/.claude/projects/-Users-fp-Desktop-horoscope-ai-app/memory/`
- `MEMORY.md` is an index; each entry is a pointer to a per-topic file.
- Types: **user** (about the human), **feedback** (corrections / validated preferences), **project** (facts about the work), **reference** (pointers to external systems).
- Save automatically when you learn something non-obvious that future sessions need. Don't save code patterns or architecture — that's derivable.

Current memory files for this project:
- `MEMORY.md` — index
- `workspace_build_lockstep.md` — build sequence pitfall (Pitfall #6)
- `mcp_app_registry_duplication.md` — the 3-copy registry state + hoist acceptance criteria
- `parallel_squad_worktrees.md` — squad-spawn playbook
- `vercel_deploy_false_positive_ci.md` — CI flakiness pattern + diagnosis recipe

---

## 16. Compound knowledge — the patterns this sprint produced

The pattern files are the canonical index. Read them before working in the relevant area.

### P1 (critical) patterns — always check

[`docs/solutions/patterns/critical-patterns.md`](./solutions/patterns/critical-patterns.md)

| # | Pattern | Source | Apply when |
|---|---|---|---|
| 1 | **LLM-as-judge prompt-injection (7-point hardening)** | [PR #63 compound](./solutions/design-patterns/llm-as-judge-prompt-injection-hardening-20260425.md) | Building a verb that grades / scores / classifies model-generated content. |
| 2 | **generateObject production hardening (5-point)** | [PR #65 compound](./solutions/design-patterns/generateobject-production-hardening-20260426.md) | Building any `generateObject` verb on a production path. |
| 3 | **Critique-loop hardening (4-point: BEST-of-N + symmetric defense + recency-bias placement)** | [PR #67 compound](./solutions/design-patterns/critique-loop-best-of-n-hardening-20260426.md) | Building a composer wrapping generate + judge in a bounded loop. |

### P2/P3 patterns — worth a glance in the area

[`docs/solutions/patterns/common-solutions.md`](./solutions/patterns/common-solutions.md) (10 entries currently)

### How patterns get added

After every `/workflows:compound` (or equivalent), run the cross-reference step per CLAUDE.md:
1. Read both pattern files
2. NEW P1 → add to `critical-patterns.md` with code snippet, detection rule, "When to use"
3. NEW P2/P3 → add to `common-solutions.md` with code snippet and rule
4. REFINED existing pattern → update the canonical version
5. Sync `docs/PROJECT_CONTEXT.md` Critical Patterns Index + Top Common Solutions tables
6. Skip if no new patterns

---

## 17. Documentation map

| Doc | Purpose |
|---|---|
| **`docs/HANDOFF.md`** | **THIS FILE — start here** |
| `docs/plans/2026-04-24-001-reading-authenticity-and-ai-sdk-migration-plan.md` | Active initiative — full multi-PR plan, phase-by-phase. **Phase 1 is functionally complete.** |
| `docs/plans/2026-04-25-001-reading-eval-harness-and-model-baseline-plan.md` | Phase 1b.5 plan |
| `docs/evals/` | Durable measurement artifacts (`.json` raw + `.md` summary). Conventions in `docs/evals/README.md`. The 144-cell baseline that picked Sonnet 4.6 lives at `docs/evals/2026-04-25-baseline.md`. |
| `docs/solutions/patterns/critical-patterns.md` | **3 P1-class patterns** — read before working in AI SDK / judge / critique-loop areas |
| `docs/solutions/patterns/common-solutions.md` | **10 P2/P3 patterns** — quick reference for recurring sub-issues |
| `docs/solutions/design-patterns/` | Three full compound docs: LLM-as-judge, generateObject hardening, critique-loop hardening |
| `docs/solutions/agent-native/`, `docs/solutions/mcp-apps/`, `docs/solutions/workflow-issues/` | Older compound docs from prior sprints |
| `docs/ARCHITECTURE.md` | System diagrams, data flow, deployment topology |
| `docs/PROJECT_CONTEXT.md` | Design system, SEO, competitive positioning, file reference, pitfalls index, pattern index |
| `docs/plans/` | Historical plans (prior sprints) |
| `docs/brainstorms/` | Requirements for philosophy engine + video engine |
| `docs/setup/` | Production activation checklist, social accounts guide |
| `~/.claude/projects/-Users-fp-Desktop-horoscope-ai-app/memory/` | Session memory (pitfalls, patterns, process playbooks) |

---

## 18. Ramp-up reading order for a new team member

If you have **30 minutes**:
1. This document, §1-§4 (status snapshot, what this app is, principles, pipeline)
2. [`docs/solutions/patterns/critical-patterns.md`](./solutions/patterns/critical-patterns.md) — the 3 P1 patterns
3. Skim `src/tools/reading/generate.ts` and `src/tools/reading/generate-with-critique.ts` to see the patterns in action

If you have **60 minutes**:
4. This document, §5 (code map) + §11 (open questions) + §13 (backlog) + §14 (pitfalls)
5. Parent plan: [`docs/plans/2026-04-24-001-...`](./plans/2026-04-24-001-reading-authenticity-and-ai-sdk-migration-plan.md)
6. The 3 design-pattern compound docs in `docs/solutions/design-patterns/`

If you have **2 hours** (new team lead):
7. This document, §15 (process norms) + §16 (compound knowledge) + §17 (doc map)
8. [`docs/PROJECT_CONTEXT.md`](./PROJECT_CONTEXT.md) — full project context (design system, SEO, etc.)
9. [`docs/evals/2026-04-25-baseline.md`](./evals/2026-04-25-baseline.md) — the data behind the model decision
10. Recent merged PRs (#63, #65, #67) — actual code + multi-persona review patterns + remediation flow

---

## 19. Immediate next actions

If you're picking up where this sprint left off, in priority order:

1. **Decide the living-philosopher corpus posture** (§11) — unblocks Phase 1d, the single most product-impactful piece of remaining work. Lean is option (b) but the team must pick.

2. **Ship the cron timeout fix** (§13 #1) — single concrete unit of work that takes the critique loop from "shipped verb" to "live in production." Recommended: per-sign cron entries (option 2 in §11 cron-timeout discussion). After it lands, the cron route swap is one line.

3. **Migrate `src/utils/horoscope-generator.ts` off raw OpenAI SDK** (§13 #8) — unblocks `OPENAI_API_KEY` removal and closes the "chokepoint comment is a lie" pattern (common-solutions #8). Should adopt `generateObject` + a parallel monthly schema.

4. **Watch Sonnet stability for ~1 more day**, then proceed with #3 — production has been on Sonnet for ~24h as of this handoff with no observed issues.

5. **If you have time after the above, consider:**
   - Re-eval Haiku vs Sonnet after Phase 1d corpus lands (~3x cost reduction if Haiku passes)
   - MCP exposure for `reading:judge` and `reading:generate-with-critique` (small bundle PR)
   - Add `scripts/` to `tsconfig.json` (Pitfall #16, Backlog #9)

**The pattern works**: spawn → principle-aware implementation → multi-persona review → remediation → merge → verify Vercel deploy state → compound. PRs #63, #65, #67 each shipped clean P1-class patterns this sprint. Keep the loop.

Main at `f50faa9`. Ready to build.
