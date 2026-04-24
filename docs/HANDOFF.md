# Handoff: Today's Horoscope — Philosophy Engine

> **Date**: 2026-04-24
> **Main at**: `70332da` · **PRs shipped**: 61 total · **This session added**: #57, #58, #59, #60, #61
> **Active initiative**: Reading Authenticity + AI SDK Migration (Phase 1a and 1b complete, Phase 1c next)
> **Status**: production stable; legacy OpenAI path still serves all production traffic; AI SDK path in code behind `FEATURE_FLAG_USE_AI_SDK` (off)

This is the authoritative onboarding document. Read it top-to-bottom before making changes. Other docs (plan file, memory files, ARCHITECTURE.md) go deeper on specific topics — this is the map.

---

## 1. Status snapshot (read this first)

**What ships today:**
- Live on `www.gettodayshoroscope.com` (frontend) and `api.gettodayshoroscope.com` (API), two separate Vercel projects.
- Users pick a zodiac sign + up to 5 philosophers from a council of 54 thinkers across 9 traditions. Daily reading blends the selected philosophers' frameworks with the sign's voice.
- 20 atomic tools in `src/tools/`, 3 declarative agent definitions in `src/agents/`, MCP server with 12 tools + 2 interactive MCP Apps, shared package at `packages/shared/`.
- Reading generation currently uses OpenAI `gpt-4o-mini-2024-07-18` direct (legacy path). Vercel AI SDK + AI Gateway is wired and available behind `FEATURE_FLAG_USE_AI_SDK` — not yet enabled in production.

**What's landing next** (in order, per the active plan):
1. **Phase 1c** — flip `USE_AI_SDK` on, swap model to Anthropic (Haiku 4.5 or Sonnet 4.6, decided by A/B), add `generateObject` with Zod schema (replaces the `providerOptions` workaround deferred in Phase 1b).
2. **Phase 1d** — corpus retrieval infrastructure for all 54 philosophers (graceful degradation by depth). This is the single biggest authenticity lever.
3. **Phase 1e** — self-critique pass against voice rules + anti-Barnum + anti-astrology-template patterns.
4. **Phase 2** — astronomical rhythm inputs (moon phase, seasonal markers, moon sign) as atomic verbs.

**The mandate behind all of it**: readings should feel like the philosopher is actually speaking — "a mashup of in the style of" the selected gurus, grounded in their real writings. Quotes must be real and attributed. No formulaic check-ins, no horoscope tropes, no Barnum-effect vagueness. The moat is anti-template writing.

Full plan with rationale and remaining open questions: [`docs/plans/2026-04-24-001-reading-authenticity-and-ai-sdk-migration-plan.md`](./plans/2026-04-24-001-reading-authenticity-and-ai-sdk-migration-plan.md).

---

## 2. What this app is (and isn't)

**Positioning**: "Not predictions. Philosophy that meets you where you are."

**Not**: a generic horoscope app. Not a fortune-telling app. Not a journaling app. Not a mood tracker. Not an astrology-purist app.

**Is**: a Philosophy Engine. Users pick a council of up to 5 philosophers from 54 thinkers across 9 traditions; each day a reading is generated that blends the council's intellectual frameworks with the sign's voice. The day's attributed quote is drawn from the verified quote-bank. The reading body is a style-matched synthesis — *not* first-person impersonation, not attributed paraphrase, just "in the style of" the council.

**The moat**: ChatGPT can write a horoscope. ChatGPT can write about Seneca. ChatGPT cannot remember your specific council across days and synthesize across their actual writings, rooted in verifiable sources, without sounding like a horoscope. That's what this builds toward.

**Future direction** (not in scope now; deliberately deferred): a premium "always-available mentor" tier where each philosopher in the user's council is reachable for conversation. We do not build infrastructure for that today — no conversational state, no per-user memory, no streaming. We do build the *foundation* (corpus retrieval, AI SDK chokepoint, atomic verbs) that would enable it later.

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

Write atomic verbs (`reading:generate`, `philosopher:recommend`, `cache:store`). Do not write workflows ("daily-horoscope-pipeline", "reading-orchestrator"). Agents compose verbs. Do not bake composition into code — expose the verbs and let an agent (or an API route acting as an agent) sequence them.

Example from this session: when Squad B needed to make council rotation vary by sign (PR #57), the principle said *extend the existing atomic `assign-daily` verb* with a `signIndex` input. The wrong move would have been a new `assignDailyBySign` wrapper.

### Atomic tools

Each verb does one thing. Pure function where possible. No hidden state. No side effects. No bundled calls. If "all philosophers in a tradition" is a need, that is `listPhilosophers().filter(p => p.tradition === X)` — composition, not a new `listByTradition` verb.

### Composability

Tools compose into other tools and into agents. Shared data has a single source of truth; consumers import from it. Duplication is a code review blocker.

Example from this session: PR #57 replaced three copies of `VALID_SIGNS` across `audience/*` tools with a single import from `zodiac:sign-profile`. Textbook composability win.

### Emergent capability

From atomic verbs, new agent behaviors emerge. The Philosopher Picker MCP App (PR #58) is not a workflow — it is an interactive surface that composes `philosopher:list`, `philosopher:recommend`, `reading:quote-bank` and ultimately invokes `reading:generate` with a council. Nothing special about it; it's just composition.

### What this means in review

A 2-persona review (correctness + maintainability) runs on every PR. A 3-to-6-persona review runs on PRs touching verbs, transports, or principled surfaces. Any finding that cites a principle violation is a blocker. "Feels clunky" is a P3; "introduces a workflow wrapper around an atomic verb" is a P1.

---

## 4. Code map

### `src/tools/` — verbs (source of truth for all business logic)

```
src/tools/
├── ai/
│   └── provider.ts              ← AI SDK + Gateway chokepoint (PR #60)
│                                   Re-exports generateText/generateObject/streamText.
│                                   Exposes MODELS { haiku, sonnet, opus } — single source
│                                   of truth for gateway model IDs. Never hardcode IDs
│                                   in consumers; always reference MODELS.

├── zodiac/
│   ├── sign-profile.ts          ← 12 sign personalities, voices, elements, avoidPatterns.
│   │                              Exports VALID_SIGNS (canonical) + isValidSign type guard.
│   └── sign-compatibility.ts    ← Element-based sign matching.

├── philosopher/
│   ├── registry.ts              ← 54 philosophers, 9 traditions. CANONICAL.
│   │                              Duplicated in packages/mcp-server/src/index.ts
│   │                              and packages/mcp-server/src/app/philosopher-picker/
│   │                              philosophers.data.js (see §8 for why + P2 plan).
│   ├── assign-daily.ts          ← Daily philosopher rotation from council,
│   │                              sign-aware (fixed PR #57).
│   └── recommend.ts             ← Sign-based philosopher suggestions with
│                                  human-readable reasons via buildReason().

├── reading/
│   ├── generate.ts              ← Main generation verb. Branches on
│   │                              FEATURE_FLAG_USE_AI_SDK (see §6).
│   ├── quote-bank.ts            ← VERIFIED_QUOTES + VALID_AUTHORS validation list.
│   ├── format-template.ts       ← 12 writing-format rotations, sign-aware + date-seeded.
│   └── types.ts                 ← ReadingOutput (camelCase) + HoroscopeData (snake_case).

├── cache/
│   ├── keys.ts                  ← Deterministic cache key (sign + philosopher + council hash).
│   ├── store.ts                 ← Redis write with 'horoscope-prod:' namespace.
│   ├── retrieve.ts              ← Redis read with personalized-key → daily-key fallback.
│   └── invalidate.ts            ← SCAN+DEL pattern.

├── content/
│   ├── format.ts                ← Reading → 6 platform formats (Twitter, FB, etc.).
│   ├── share-card.ts            ← Re-export from @horoscope/shared.
│   └── distribute.ts            ← Ayrshare multi-platform posting.

└── audience/
    ├── subscribe.ts             ← Redis-based email rate limiting. Imports
    │                              isValidSign from zodiac:sign-profile (PR #57).
    ├── unsubscribe.ts           ← Same composition pattern.
    └── segment.ts               ← Same composition pattern.
```

**20 tool files total.** All pure or nearly pure; side effects restricted to Redis/OpenAI/AI-Gateway/Ayrshare. New code goes here first; old consumers migrate to these opportunistically.

### `src/agents/` — agent definitions (declarative)

```
src/agents/
├── daily-publisher.ts           ← Goal: publish 12 readings/day. 7 verbs. No runtime yet.
├── social-poster.ts             ← Goal: cross-platform content distribution. 5 verbs.
├── onboarding-guide.ts          ← Goal: conversational council building. 5 verbs.
└── index.ts                     ← Barrel export.
```

Each agent has `name`, `goal`, `tools` (verb allowlist), `constraints`. **No script, no step sequence.** The idea is that an agent runtime (not yet built) reads the goal + constraints and composes the listed verbs to achieve the goal. Today these definitions are unused — they exist as the target shape for future Phase 2+ work.

### `packages/shared/` — `@horoscope/shared` workspace package

```
packages/shared/
├── src/share-card.ts            ← Canonical share-card SVG generator, zero deps, 312 lines.
└── src/index.ts                 ← Barrel export.
```

Introduced in PR #55. Must be built (`npm run build --workspace=packages/shared`) before `next build` because `src/tools/content/share-card.ts` re-exports from it. **This has burned us repeatedly — see Pitfall #6.**

### `packages/mcp-server/` — MCP server + MCP Apps

```
packages/mcp-server/
├── src/index.ts                 ← 12 MCP tools + 2 MCP App resources.
│                                  Contains an inline PHILOSOPHERS list (mirror of
│                                  src/tools/philosopher/registry.ts; expanded from
│                                  24 to 54 in PR #58).
├── src/confirm-council.ts       ← Pure validator for philosopher_picker_confirm
│                                  (from PR #58 remediation).
├── src/app/
│   ├── share-card/              ← Original MCP App (PR #52). Vite singlefile build.
│   └── philosopher-picker/      ← Second MCP App (PR #58). Vite singlefile build.
│       └── philosophers.data.js ← Second inline copy of the registry (build constraint:
│                                  Vite can't import from the Next.js TS codebase across
│                                  package boundaries before the workspace is built).
└── vite.config.ts               ← Multiplexes apps via MCP_APP env var.
```

**Shipped MCP tools**: `zodiac_sign_profile`, `zodiac_sign_compatibility`, `philosopher_lookup`, `philosopher_list`, `philosopher_recommend`, `reading_generate`, `content_format`, `content_share_card`, `audience_subscribe`, `audience_unsubscribe`, `daily_publish`, `philosopher_picker_open`, `philosopher_picker_confirm`.

**Registry duplication**: three copies of the 54-philosopher list exist — `src/tools/philosopher/registry.ts` (canonical), `packages/mcp-server/src/index.ts` (MCP server mirror), `packages/mcp-server/src/app/philosopher-picker/philosophers.data.js` (MCP App snapshot). All three carry sync warnings in their headers. **Hoist to `@horoscope/shared` is a tracked P2** — full rationale + acceptance criteria in memory file `mcp_app_registry_duplication.md`.

### `src/app/api/` — API routes (thin composers)

Every route is a 20-to-60 line composer. Business logic lives in `src/tools/`.

| Route | Method | Auth | Purpose |
|---|---|---|---|
| `/api/horoscope?sign=X&philosophers=...` | GET | Public | assign → cache → generate → store → return |
| `/api/cron/daily-horoscope` | GET | `CRON_SECRET` | 12× (assign → generate → store → email) |
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
| Monthly | `/horoscope/[sign]/monthly/[monthYear]` | ISR (24h) |
| About author | `/about/author` | ISR (24h) — Elena Vasquez persona |

Frontend does not make LLM calls. It fetches readings from the API via Vercel rewrites.

### Legacy utils (migration in progress)

```
src/utils/
├── feature-flags.ts             ← Active. USE_AI_SDK added in PR #61.
├── verified-quotes.ts           ← Data; consumed by reading:quote-bank. Stable.
├── horoscope-generator.ts       ← Legacy. Still used for monthly page. Retire when
│                                  generate.ts gains monthly support.
├── horoscope-prompts.ts         ← Legacy. Consumed by horoscope-generator. Dies with it.
├── horoscope-service.ts         ← Legacy. Consumed by HoroscopeDisplay.tsx,
│                                  AllHoroscopesContext.tsx. Needs a batch fetch tool
│                                  before retirement.
├── cache-keys.ts                ← Legacy. Used by debug routes with the historical
│                                  key format (matches production cache).
├── redis-helpers.ts             ← Legacy. Same reason as cache-keys.ts.
└── ...
```

**Rule**: new code imports from `src/tools/`. Old consumers migrate opportunistically, one at a time. Don't rewrite old utils — migrate their callers.

---

## 5. The 9 philosopher traditions

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

**Adding or modifying philosophers** — touch all three files until the P2 registry hoist lands (see §4 and memory file `mcp_app_registry_duplication.md`):
1. `src/tools/philosopher/registry.ts` (canonical, full metadata)
2. `packages/mcp-server/src/index.ts` (inline mirror)
3. `packages/mcp-server/src/app/philosopher-picker/philosophers.data.js` (MCP App snapshot)

Each file carries a sync warning in its header.

---

## 6. How a reading gets made today

### The flow (input → output)

```
User picks sign (Aries) + council (Seneca, Alan Watts, Rumi, Feynman, Rumi)
  ↓
/api/horoscope?sign=aries&philosophers=Seneca,Alan+Watts,Rumi,Feynman,Rumi
  ↓
1. assignDaily({ sign, council, date })     → picks today's philosopher from council
                                                (sign-aware rotation — PR #57)
  ↓
2. retrieve({ sign, philosopher, date })    → Redis: personalized key first,
                                                daily-key fallback. Cache hit? Return.
  ↓
3. generateReading({ sign, philosopher, date })
   ├─ getSignProfile(sign)                    → voice + avoidPatterns + element
   ├─ getFormatTemplate(sign, date)           → one of 12 writing structures
   ├─ getQuotes(philosopher, dateSeed)        → 4 verified quotes from quote-bank
   ├─ buildReadingPrompt(...)                 → full prompt: SOUL + voice + rules +
   │                                             format + quote bank section
   ├─ callModelForReading(prompt)             → BRANCHES ON FEATURE_FLAG_USE_AI_SDK:
   │                                             (see next subsection)
   ├─ JSON.parse(content)                     → structured fields
   ├─ validate quote_author against VALID_AUTHORS
   ├─ validate inspirational_quote against VERIFIED_QUOTES (override if unverified)
   └─ filter self-matches from best_match
  ↓
4. store({ sign, philosopher, date, council, reading }) → Redis write
  ↓
5. toSnakeCase(reading) → response
```

### The two model-call paths (Phase 1b parity)

Inside `callModelForReading(prompt)` in `src/tools/reading/generate.ts`:

**Legacy path (default, `FEATURE_FLAG_USE_AI_SDK` off or unset):**
```ts
new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  .chat.completions.create({
    model: 'gpt-4o-mini-2024-07-18',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    max_tokens: 800,
  });
```

**AI SDK path (`FEATURE_FLAG_USE_AI_SDK=true`):**
```ts
generateText({
  model: 'openai/gpt-4o-mini',     // via Vercel AI Gateway
  prompt,
  maxOutputTokens: 800,
  // NOTE: JSON-mode enforcement is intentionally NOT set here.
  // providerOptions.openai.responseFormat is not a documented key.
  // PR C (Phase 1c) replaces this with generateObject + Zod.
});
```

Both target gpt-4o-mini for Phase 1b parity. The AI SDK path is **not yet JSON-mode-enforced** — this is a deliberate deferral to Phase 1c (see §8). The flag defaults off so production currently serves 100% legacy-path traffic.

Test: `__tests__/tools/reading/generate.test.ts` (6 tests, both paths mocked).

---

## 7. This session's PRs (2026-04-22 to 2026-04-24)

| PR | Summary | Principle highlight |
|---|---|---|
| **#57** | P2 backlog: council rotation sign-aware, `VALID_SIGNS` dedupe, `mountedRef` fetch guard, stale test deleted | Extended the atomic verb (not wrapped); composability via zodiac→audience import |
| **#58** | MCP App — Philosopher Picker. Two new atomic MCP tools. Incidental: expanded MCP server's stale 24-entry `PHILOSOPHERS` inline array to full 54 (silently fixed `philosopher_lookup` for Arendt/Confucius/Cato/etc.) | UI composes existing verbs; no new orchestration |
| **#59** | Fixed pre-existing Vercel preview deploy failures (`@horoscope/shared` not built before `next build`). Applied across `vercel.json`, `scripts/frontend-build.sh`, and root `package.json` build script | Single source of truth for build sequence |
| **#60** | Phase 1a: AI SDK + Gateway chokepoint. `src/tools/ai/provider.ts` re-exports `generateText` / `generateObject` / `streamText` + `MODELS` constant (`anthropic/claude-haiku-4.5`, `anthropic/claude-sonnet-4.6`, `anthropic/claude-opus-4.7`) verified against live Gateway | Chokepoint for future agent runtime; consumers never hardcode IDs |
| **#61** | Phase 1b: `reading:generate` parity port behind `FEATURE_FLAG_USE_AI_SDK`. Legacy path preserved. 6 parity tests (mocked transport selection + output-shape equivalence) | Atomic verb preserved; flag is transport toggle, not new verb |

Plan doc created in this session: [`docs/plans/2026-04-24-001-reading-authenticity-and-ai-sdk-migration-plan.md`](./plans/2026-04-24-001-reading-authenticity-and-ai-sdk-migration-plan.md).

**Every PR in this session** was: spawn → principle-aware implementation → multi-persona review → remediation → merge. Review findings that mattered:
- PR #58 review caught that the MCP App was producing a structurally-divergent `recommendPhilosophers` shape (fake parity); fixed by porting canonical `buildReason()`.
- PR #61 review caught that `providerOptions.openai.responseFormat` is not a documented AI SDK OpenAI chat provider option and was being silently dropped (parity claim broken); fixed by dropping the key and documenting the deferral to PR C.

---

## 8. Active initiative: Reading Authenticity

The plan doc is the source of truth: [`docs/plans/2026-04-24-001-reading-authenticity-and-ai-sdk-migration-plan.md`](./plans/2026-04-24-001-reading-authenticity-and-ai-sdk-migration-plan.md). Read it before starting any phase 1c+ work.

### The vision

Readings should sound like the philosopher is actually speaking — a "mashup *in the style of*" the user's selected gurus, grounded in their actual writings, speeches, and workshops. Direct quotes are always real and attributed. The reading body is a non-attributed third-person synthesis drawing on the breadth of the council.

### Decisions locked this session

- **Voice**: non-attributed third-person, "in the style of" synthesis. Not first-person impersonation; not explicit attribution. The reading doesn't claim anyone said anything.
- **Quote placement**: the daily card's attributed quote field is the only verbatim moment — real quotes from the `quote-bank`, rotated daily across the council, fully attributed (philosopher name; fuller source citation is a stretch goal).
- **Reading body**: does not quote. Synthesis only.
- **Council synthesis shape**: lead philosopher (today's rotation) colors the day's flavor; other four council members texture the reading with their frameworks. Each day feels distinct even with the same council.
- **Corpus coverage**: all 54 philosophers (not a subset). Graceful degradation by depth — deep corpora for well-sourced public-domain thinkers, thinner coverage elsewhere, graceful fallback to current voice+quote-bank for gaps. The retrieval layer handles empty/thin corpora without breaking.
- **Input set** (beyond sign + council + date):
  - **Moon phase** — adding. Feed astronomical facts to the prompt; model uses them texturally or not at all. No "set intentions under the new moon" tropes.
  - **Seasonal markers** — adding. 8 hardcoded dates/year (solstices, equinoxes, cross-quarters). Philosophical framing, not astrology-template.
  - **Moon sign** — adding after writing foundation is proven. 2.5-day flavor variation.
  - **Mood/intention tap** — **explicitly dropped**. Formulaic by design; conflicts with the anti-template moat.
  - **Rising sign** — deferred. Requires birth time in onboarding (major UX change).
  - **Tarot / planetary day / biorhythms / numerology** — skipped. Weak evidence or conflicts with positioning.

### Phase status

| Phase | What | Status | Notes |
|---|---|---|---|
| **1a** | AI SDK + Gateway chokepoint | ✅ Shipped (PR #60, merged `3835d33`) | `src/tools/ai/provider.ts` is the single import surface |
| **1b** | `reading:generate` parity port behind flag | ✅ Shipped (PR #61, merged `70332da`) | Flag defaults off; production still on legacy |
| **1c** | Flip flag + model swap + `generateObject` + Zod | 🔜 Next | Haiku vs Sonnet decided by A/B eval; Zod schema defines `ReadingOutput` strictly |
| **1d** | Corpus retrieval infrastructure | 🔜 After 1c | **Blocked on open question**: living-philosopher corpus posture (see §13) |
| **1e** | Self-critique pass | 🔜 After 1d | Anti-cliché, anti-Barnum, anti-astrology-template. Haiku 4.5 for critique cost. |
| **2a** | `astronomy:moon-phase` atomic verb | 🔜 After Phase 1 | Prompt-engineered against template tropes |
| **2b** | `calendar:seasonal-marker` atomic verb | 🔜 After Phase 1 | 8 hardcoded dates |
| **2c** | `astronomy:moon-sign` atomic verb | 🔜 After Phase 2a | Lands last so writing foundation can carry nuance |

### Research grounding

The initiative's direction is informed by external research (summarized in the plan doc). Key findings that shaped decisions:

- **Writing quality > input richness.** The Pattern's "eerily accurate" reputation comes from prose specificity, not from more inputs. This is why the corpus + model upgrade comes before new inputs.
- **Rising sign is the industry consensus #1 upgrade**, but requires birth time at onboarding. Deferred as a major scope change.
- **Moon sign of the day is universal** across tier-1 apps. Adding it is cheap and high-leverage.
- **Mood taps work in journaling apps**, but journaling apps have a different moat (reflection personalization) than a philosophy engine (anti-template writing). The research evidence didn't transfer; we dropped the mood tap.
- **Writing quality trap**: adding inputs to weak writing produces *more* generic output, not less. Foundation must come first.

---

## 9. Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `OPENAI_API_KEY` | Yes (while flag off) | Legacy `reading:generate` path. Retired after Phase 1c full rollout. |
| `UPSTASH_REDIS_REST_URL` | Yes (prod) | Cache + subscribers + rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | Yes (prod) | Redis auth |
| `RESEND_API_KEY` | For email | Daily email sending |
| `CRON_SECRET` | For cron | Secures `/api/cron/daily-horoscope` |
| `AYRSHARE_API_KEY` | For social | Multi-platform posting |
| `NEXT_PUBLIC_API_URL` | Optional | API base URL override |
| `HOROSCOPE_API_URL` | MCP server | API base for MCP tool delegation |
| `AI_GATEWAY_API_KEY` | For local dev (AI SDK) | Vercel AI Gateway auth. Set in Vercel env for API project as of 2026-04-24. Vercel-deployed envs use `VERCEL_OIDC_TOKEN` automatically when this is unset. |
| `FEATURE_FLAG_USE_AI_SDK` | Optional | Phase 1b parity flag. When `true`, `reading:generate` routes through `@/tools/ai/provider`. Default off. Removed after Phase 1c rollout. |

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

**Known flaky pattern**: GH Actions `Deploy Frontend` (and occasionally `Deploy API`) can report failure while Vercel actually completes the deploy successfully — the CLI call times out waiting for a slow deploy, but Vercel promotes the build server-side. **Always verify against actual Vercel deployment state** (via `mcp__plugin_vercel_vercel__list_deployments` or dashboard) before assuming production is broken. Memory: `vercel_deploy_false_positive_ci.md`.

---

## 11. How to run

```bash
# Setup
cd /Users/fp/Desktop/horoscope-ai-app
npm install
cp .env.example .env.local                       # Fill in API keys
# Or: vercel env pull .env.local (but be careful — overwrites local overrides)

# Build shared packages (required before next build; also automated in
# vercel.json, scripts/frontend-build.sh, and root `npm run build`)
npm run build --workspace=packages/shared

# Dev
npm run dev                                      # Starts Next.js on :3000

# Build (must pass with zero errors)
npm run build                                    # Runs shared prebuild + next build
# or: npx next build                             # Next.js alone (shared already built)

# Tests — ~320 tests across 33 suites; 8 pre-existing failing suites, all flagged
npx jest --passWithNoTests                       # Use directly; `npm test` cascades to
                                                   # workspaces and will fail

# Specific test file
npx jest __tests__/tools/ai/provider.test.ts

# MCP server
cd packages/mcp-server && npm run build && npm start

# Health check
curl https://api.gettodayshoroscope.com/api/debug/ping

# Test a sign (prod)
curl "https://api.gettodayshoroscope.com/api/horoscope?sign=aries" | python3 -m json.tool

# Refresh cache (prod; requires CRON_SECRET)
curl -H "Authorization: Bearer $CRON_SECRET" https://api.gettodayshoroscope.com/api/cron/daily-horoscope

# Vercel env management (linked to API project)
vercel env ls                                    # List current env vars
vercel env add AI_GATEWAY_API_KEY production     # Add one (prompts for value)
vercel env pull .env.local                       # Pull to local file (⚠️ overwrites)

# Verify AI Gateway model availability
VERCEL_TOKEN=$(cat ~/Library/Application\ Support/com.vercel.cli/auth.json | python3 -c "import sys,json;print(json.load(sys.stdin).get('token',''))")
curl -H "Authorization: Bearer $VERCEL_TOKEN" https://ai-gateway.vercel.sh/v1/models | jq '.data[] | select(.id | startswith("anthropic/")) | .id'
```

---

## 12. Pitfalls (will burn you)

| # | Pitfall | How to avoid |
|---|---|---|
| 1 | **Tailwind v3 ONLY** | CSS uses `@tailwind base/components/utilities`. NEVER `@import "tailwindcss"` (v4 syntax). v4 silently produces zero CSS. |
| 2 | **Two Vercel projects from one repo** | Frontend build excludes API routes via `frontend-build.sh`. API routes proxy via Vercel rewrites. Env vars and project IDs are separate. |
| 3 | **Edge runtime crashes OpenAI** | Never add `export const runtime = 'edge'` to routes using OpenAI SDK or the AI SDK. OG routes are edge (fine). |
| 4 | **Non-www redirect** | `gettodayshoroscope.com` 308s to `www.`. Always use `www.` in URLs/health checks. |
| 5 | **Double Redis prefix** | Legacy `safelyStoreInRedis` adds `horoscope-prod:` automatically. Never prepend manually. |
| 6 | **Workspace build lockstep** | Adding a workspace package with a `tsc` dist means updating ALL build entry points: `.github/workflows/deploy.yml`, `vercel.json` `buildCommand`, `scripts/frontend-build.sh`, root `package.json` `build` script. Production can stay green while previews and local dev silently break. Grep for `next build` when adding workspaces. |
| 7 | **`npm test` cascades** | Workspaces have `"test": "echo 'No tests yet'"` to avoid failures, but CI should use `npx jest --passWithNoTests` directly. |
| 8 | **node-fetch** | Not a dependency. Next.js has built-in fetch. Never import it. |
| 9 | **30s function timeout** | Set in `vercel.json`. Hobby plan. Don't batch-generate all 12 signs sequentially. |
| 10 | **Visual regressions** | Always screenshot before/after UI changes. Sprint 3 required 7 hotfix PRs from visual degradation. |
| 11 | **Vercel deploy false-positive** | GH Actions can report failure while Vercel actually deploys successfully. Verify against Vercel deployment state before assuming production is broken (see §10 and memory `vercel_deploy_false_positive_ci.md`). |
| 12 | **AI SDK silent option drops** | The AI SDK OpenAI chat provider does NOT accept `providerOptions.openai.responseFormat`. Undocumented options are silently dropped without error. Canonical JSON enforcement is via `generateObject` + Zod. Don't extrapolate from OpenAI SDK naming when writing AI SDK calls. |
| 13 | **Jest jsdom + web streams** | Tests that import the AI SDK must use `@jest-environment node` (first line of file). jsdom doesn't have `TransformStream` which `ai` needs. `jest.setup.js` guards DOM-only setup behind `typeof window !== 'undefined'` so node-env tests don't crash on setup. |
| 14 | **Hardcoded gateway model IDs** | Never. Always reference `MODELS.haiku` / `MODELS.sonnet` / `MODELS.opus` from `@/tools/ai/provider`. Rotating the underlying ID should be a one-file change. |
| 15 | **Horoscope-template clichés** | "As the new moon rises..." / "the cosmos whispers..." / "set your intentions..." — the whole moat is anti-template. Prompt feeds astronomical *facts* (e.g., "moon is in Taurus, waxing gibbous, 78% illuminated"), never template phrases. Self-critique pass in Phase 1e enforces this. |

---

## 13. Open questions (block specific phases)

### Living-philosopher corpus posture (blocks Phase 1d)

For Naval Ravikant, Deepak Chopra, Sadhguru, Eckhart Tolle, Pema Chodron, Wayne Dyer, late-career Alan Watts, and similar living/recently-active philosophers, we need a stance on corpus building:

- **(a) Index freely under fair-use-for-transformative-use** (commentary/educational context). Aggressive posture; defensible for short quotation but risky at scale.
- **(b) Index only freely-shared material** (public podcasts, tweets, Wikiquote, publicly licensed talks). Narrow but safe.
- **(c) Skip corpus for living philosophers entirely**; they stay on current voice + quote-bank path. Users who pick living-philosopher-heavy councils get pre-Phase-1 quality for those voices forever.

**Lean**: (b) — (a)'s risk isn't worth it pre-scale; (c) creates a permanent two-tier quality gap. **Must be decided before Phase 1d starts.**

### Haiku vs Sonnet for reading generation (decided in Phase 1c A/B)

Phase 1c ships the flip-flag + model-swap work. A/B eval should compare:
- `MODELS.haiku` (cheap, fast, step up from gpt-4o-mini)
- `MODELS.sonnet` (best voice consistency, 7-10× cost, ~$100-150/year added)
- Same prompts, same corpus (whatever exists at 1c time), blind quality scoring

**Lean**: Sonnet 4.6 if A/B confirms the delta is material; Haiku as fallback. Both are cheap at ~13M tokens/year.

### Agent runtime architecture (pre-Phase 2 decision)

We have three agent definitions (`src/agents/`) with zero runtime. Phase 2+ needs an answer:

- Vercel AI SDK's agent loops (`generateText` with `tools` + `stopWhen`) — composes cleanly with what we have, keeps runtime in-repo.
- Anthropic Managed Agents (hosted) — simpler operationally, platform lock-in, beta pricing.
- Self-hosted loop — most control, most code to maintain.

**Lean**: AI SDK agent loops. ~50 lines of glue on top of the Phase 1 foundation. Covers `daily-publisher` cron trigger cleanly. No lock-in.

### Registry hoist to `@horoscope/shared` (tracked P2)

Three copies of the 54-philosopher list exist. Hoisting to the shared package eliminates the duplication. Blast radius: ~10 files + TS enum `Tradition` → `as const` interop. Not urgent. See memory `mcp_app_registry_duplication.md` for full acceptance criteria. Good candidate for a dedicated small PR when someone is about to touch the registry anyway.

---

## 14. Process norms (how we ship)

### The compound-engineering loop (mandatory)

```
(Brainstorm) → Plan → Work → Review → Compound
                 ↑                        ↓
                 └── knowledge feeds back ─┘
```

Not every task needs the full loop. Solo tasks (single-file change, docs, P3) use a lightweight version: plan in head → implement → quick self-review → compound if learned something. Multi-file, multi-domain, or production-grade tasks run the full loop.

### Branch discipline (hook-enforced)

- `git commit` and `git push` on `main` are **hard-blocked** by `branch-discipline.sh`.
- Every session starts with `git branch --show-current` as a first action.
- Feature branches follow `{type}/{squad}/{ticket-or-slug}` (e.g., `feat/reading-auth/phase-1c-generateobject-zod`).
- Never work on `main`. Checkout a feature branch before editing.

### The review + remediation + merge flow

The pattern proven across PRs #57 through #61:

1. **Open PR** (push feature branch → `gh pr create`).
2. **Spawn a review coordinator agent** in background. Pattern: 3-to-6 reviewer personas (correctness, maintainability, project-standards always; + testing / TypeScript / architecture / reliability / security based on diff content). Coordinator consolidates with confidence gating and returns structured findings.
3. **Triage findings** — classify as blocker / suggestion / defer. Blockers must be fixed before merge. Suggestions are case-by-case. Defer the rest with explicit rationale.
4. **Remediate** — apply fixes in the feature worktree (either directly or via a focused remediation agent). Push.
5. **Wait for CI** on the remediation commit. Verify Vercel deployment state in addition to GitHub Actions.
6. **Merge** — `gh pr merge <n> --squash --delete-branch`. CE Review gate + watch-ci gate must be cleared (see below).
7. **Verify production post-merge** — `curl` the key endpoints. Don't trust GH Actions alone (false-positive pattern).

### Parallel squad worktrees (proven pattern)

For independent multi-stream work:
1. `git worktree add -b {type}/{squad}/{slug} ../horoscope-{squad}-{topic} main` for each squad.
2. One driver agent per worktree, spawned with `run_in_background: true` and a name. Brief must include: worktree path as FIRST-ACTION cd target, architectural principles, forbidden paths (cross-squad), explicit stop conditions.
3. Squads run concurrently. Zero file overlap is the ticket — verify in the briefs.
4. Reviews run in parallel too (one coordinator per PR).
5. Merge order: smaller/cleaner PR first; larger after.
6. Cleanup: `git worktree remove ../horoscope-{squad}-{topic}` when done.

Worked well for PRs #57 and #58 shipped simultaneously. Memory: `parallel_squad_worktrees.md`.

### Hook-enforced gates (what to know)

| Gate | Enforcer | What it blocks | How to clear |
|---|---|---|---|
| **Branch discipline** | `branch-discipline.sh` (PreToolUse) | `git commit` / `git push` on main | Checkout a feature branch |
| **Watch-CI gate** | `security-gate-bash.sh` + `post-git-actions.sh` | All bash commands after `git push`, `gh pr create`, `gh pr merge`, `gh run rerun` until `/watch-ci` runs | Run `gh run list`, `gh run watch`, or `gh run view` (or invoke `/watch-ci` skill) |
| **CE Review gate** | `security-gate-bash.sh` | `gh pr merge` unless review marker present | Invoke `compound-engineering:ce-code-review` skill for the branch, OR use `--no-review` bypass for docs-only / config-only PRs (the harness's flag-strip is unreliable — the skill is more reliable) |
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

## 15. Backlog

### Known P2s (not yet addressed)

| # | Issue | Path forward |
|---|---|---|
| 1 | Share-card em-dash overlaps first quote line | Fix `dy` offset in SVG `tspan` in `packages/shared/src/share-card.ts`. Needs visual verification. |
| 2 | 9 pre-existing test failures (now 8 — `social-posting.test.ts` deleted PR #57): `SchemaMarkup.test.tsx` (implicit `any`), `VideoBanner.test.tsx`, `HoroscopeDisplay.test.tsx`, `guidance.test.ts`, etc. | Each needs individual triage. None are regression-introducing. |
| 3 | Tests for impure tools (`cache:store`, `cache:retrieve`, legacy `reading:generate`) | Need Redis / OpenAI mocking strategy. |
| 4 | Registry hoist to `@horoscope/shared` | Tracked; see §13. |
| 5 | `frontend-build.sh` has a `set -e` + `mv` pattern that can leave `src/app/api` unrestored on build failure | Pre-existing; low priority. Wrap critical section in a `trap`. |
| 6 | Vercel deploy false-positive (GH Actions retry/timeout) | Diagnostic recipe is documented; fix is lower priority since the actual deploy succeeds. |

### Medium-term (post-Phase 2)

- **Wire agent definitions to runtime** — connect `src/agents/` to an agent loop (see §13 for architecture decision).
- **Extend `reading:generate` for monthly type** — unblocks migration of monthly page from legacy `horoscope-generator.ts`.
- **Batch fetch tool** — unblocks migration of `HoroscopeDisplay` from legacy `horoscope-service.ts`.
- **Delete remaining old utils** — after all consumers are migrated.
- **More MCP Apps** — reading dashboard, daily publisher dashboard (now that the picker + share-card pattern is proven twice).

### Future-state (deliberately deferred)

- **Premium mentor tier** — conversational "always-available" philosopher. Requires per-user × per-philosopher conversational state, streaming responses, possibly voice. We are NOT building for this today; Phase 1-2 deliberately stays stateless and one-shot. The corpus retrieval foundation (Phase 1d) is load-bearing for this future if we ever do it.
- **Rising sign at onboarding** — industry consensus #1 personalization upgrade, but requires birth time + major onboarding redesign. Revisit after Phase 1 lands and we see whether the writing-quality lever moved the needle enough on its own.
- **Stripe integration** — pricing page exists; no payment flow.
- **Social accounts** — TikTok + X setup + Ayrshare connection. Facebook Page already live.

---

## 16. Sprint history (all 61 PRs)

| Sprint | PRs | What |
|---|---|---|
| 1: Emergency Fix | #1-#10 | Edge runtime removal, content pipeline, security, frontend |
| 2: Product Overhaul | #11-#15 | 20-point remediation, CI/CD, dependencies |
| 3: Visual Restoration | #16-#23 | Tailwind v3 fix, design restoration, video autoplay |
| 4: SEO P0 | #27, #29 | AutoResearch content, monthly pages, E-E-A-T |
| 5: Philosophy Engine | #29-#39 | 50+ philosophers, homepage redesign, email, sharing, API+MCP |
| 6: Archive + Video | #40-#46 | Daily archive, video engine, quality gate |
| 7: Agent-Native | #47-#53 | 16 tools migration, MCP server v2, 120 tests, MCP Apps |
| 8: Verbs + Agents | #54-#56 | Doc sync, shared package, type extraction, agent definitions |
| **9: Reading Authenticity Foundation** | **#57-#61** | **P2 cleanup, 2nd MCP App, preview config fix, AI SDK chokepoint, parity port behind flag** |

---

## 17. Documentation map

| Doc | Purpose |
|---|---|
| **`docs/HANDOFF.md`** | **THIS FILE — start here** |
| `docs/plans/2026-04-24-001-reading-authenticity-and-ai-sdk-migration-plan.md` | Active initiative — full multi-PR plan, phase-by-phase |
| `docs/ARCHITECTURE.md` | System diagrams, data flow, deployment topology |
| `docs/PROJECT_CONTEXT.md` | Design system, SEO, competitive positioning |
| `docs/plans/` | Historical plans (8 sprint plans preceding the current initiative) |
| `docs/brainstorms/` | Requirements for philosophy engine + video engine |
| `docs/solutions/` | Compound docs (learnings captured per sprint / per feature) |
| `docs/setup/` | Production activation checklist, social accounts guide |
| `~/.claude/projects/-Users-fp-Desktop-horoscope-ai-app/memory/` | Session memory (pitfalls, patterns, process playbooks) |

---

## 18. Immediate next actions (for the next session)

1. **Read the plan doc** — `docs/plans/2026-04-24-001-reading-authenticity-and-ai-sdk-migration-plan.md`. It's the source of truth for remaining phases.

2. **Decide Haiku vs Sonnet for PR C** — can be done by:
   - Writing a one-off local script that generates 12 signs × 3 philosophers on both models
   - Blind-scoring the outputs for voice authenticity, anti-Barnum, anti-template
   - Picking the winner; the cost delta is ~$100-150/year — voice quality wins if the delta is material

3. **Start PR C** (Phase 1c) — flip flag, swap model, add `generateObject` with Zod schema defining `ReadingOutput`. Schema enforces: `message` (40-80 words), `bestMatch` (comma-separated sign list), `inspirationalQuote`, `quoteAuthor`, `peacefulThought`. This replaces the deferred `providerOptions.responseFormat` workaround from PR #61.

4. **Resolve the living-philosopher corpus question** before starting PR D. The plan doc flags this as a blocker; see §13 here.

5. **Keep the loop**: spawn → principle-aware implementation → 3-persona review → remediation → merge → verify Vercel deploy state. The pattern works.

Ready to build. Main at `70332da`.
