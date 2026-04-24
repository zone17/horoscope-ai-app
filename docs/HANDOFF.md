# Handoff: Today's Horoscope — Agent-Native Philosophy Engine

> **Date**: 2026-04-17
> **Latest PRs**: #54 (doc sync), #55 (shared package + agent definitions)
> **Status**: Main green. Production deployed. 55 PRs shipped total.
> **Branch**: `main` — clean, single branch. No open PRs.

---

## 1. What This App Is

**Today's Horoscope** is a Philosophy Engine. Users pick their zodiac sign, select up to 5 philosophers from 54 thinkers across 9 traditions, and receive daily personalized readings that blend philosopher wisdom with zodiac personality.

- **Domain**: gettodayshoroscope.com (www = frontend, api = backend)
- **Stack**: Next.js 15.5.14, Vercel (2 projects), Upstash Redis, OpenAI (gpt-4o-mini), Ayrshare, Resend
- **Architecture**: Agent-native — 19 tool files in `src/tools/`, 3 agent definitions in `src/agents/`, shared package at `packages/shared/`, MCP server at `packages/mcp-server/`
- **Principles**: Verbs not workflows. Atomic tools. Composability. Emergent capability.

**The moat**: Personalized philosopher council. ChatGPT can't remember your philosophers, blend them with your sign daily, or build a relationship over time.

---

## 2. Architecture — The Complete Map

### Tool Tree (`src/tools/` — 19 files, ~2,900 lines)

```
src/tools/                          ← SOURCE OF TRUTH for all business logic
├── zodiac/
│   ├── sign-profile.ts             ← 12 sign personalities, voices, elements, avoidPatterns
│   └── sign-compatibility.ts       ← Element-based sign matching
├── philosopher/
│   ├── registry.ts                 ← 54 philosophers, 9 traditions (CANONICAL)
│   ├── assign-daily.ts             ← Daily philosopher rotation from user's council
│   └── recommend.ts                ← Sign-based philosopher suggestions
├── reading/
│   ├── generate.ts                 ← Core AI generation (OpenAI gpt-4o-mini)
│   ├── quote-bank.ts               ← Verified quotes + VALID_AUTHORS validation list
│   ├── format-template.ts          ← 12 writing format rotations
│   └── types.ts                    ← ReadingOutput (camelCase) + HoroscopeData (snake_case)
├── cache/
│   ├── keys.ts                     ← Deterministic cache key (includes philosopher + council hash)
│   ├── store.ts                    ← Redis write
│   ├── retrieve.ts                 ← Redis read with daily-key fallback
│   └── invalidate.ts               ← SCAN+DEL pattern
├── content/
│   ├── format.ts                   ← Reading → 6 platform formats
│   ├── share-card.ts               ← Re-export from @horoscope/shared
│   └── distribute.ts               ← Ayrshare multi-platform posting
└── audience/
    ├── subscribe.ts                ← Redis-based rate limiting
    ├── unsubscribe.ts
    └── segment.ts                  ← Query subscribers by sign
```

### Agent Definitions (`src/agents/` — 3 agents)

```
src/agents/
├── daily-publisher.ts              ← 7 verbs: autonomous daily content publishing
├── social-poster.ts                ← 5 verbs: cross-platform content distribution
├── onboarding-guide.ts             ← 5 verbs: conversational council building
└── index.ts                        ← Barrel export
```

Each agent has: `name`, `goal` (what to achieve), `tools` (which verbs), `constraints` (rules). No scripts, no step sequences — the agent composes verbs to achieve the goal.

### Shared Package (`packages/shared/`)

```
packages/
├── shared/                         ← @horoscope/shared (npm workspace)
│   ├── src/share-card.ts           ← CANONICAL share-card implementation (312 lines, zero deps)
│   └── src/index.ts                ← Barrel export
└── mcp-server/                     ← horoscope-philosophy-mcp
    └── src/index.ts                ← 12 MCP tools, imports share-card from @horoscope/shared
```

Root `package.json` has `"workspaces": ["packages/shared", "packages/mcp-server"]`.

### API Routes (thin composers — under 60 lines each)

| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| `/api/horoscope?sign=X&philosophers=...` | GET | Public | assign → cache → generate → store → return |
| `/api/cron/daily-horoscope` | GET | `CRON_SECRET` | 12× (assign → generate → store → email) |
| `/api/og/[sign]` | GET | Public | Dynamic OG image (edge runtime) |
| `/api/subscribe` | POST | Public | Email capture → Redis |
| `/api/unsubscribe` | GET | Public | One-click unsubscribe |
| `/api/horoscopes` | GET | Public | All 12 signs batch read |
| `/api/debug/ping` | GET | Public | Health check |
| `/api/debug/redis` | GET | Public | Cache inspection |
| `/api/analytics/vitals` | POST | Public | Web vitals |

### Frontend Pages

| Page | Route | Rendering |
|------|-------|-----------|
| Home | `/` | ISR (1h) — sign picker → philosopher grid → reading flow |
| Sign page | `/horoscope/[sign]` | ISR (1h) — full reading, OG tags, share |
| Daily archive | `/horoscope/[sign]/daily/[date]` | ISR (24h) |
| Monthly | `/horoscope/[sign]/monthly/[monthYear]` | ISR (24h) |
| About author | `/about/author` | ISR (24h) — Elena Vasquez persona |

### Two Vercel Projects

| Project | Domain | Build | Vercel ID |
|---------|--------|-------|-----------|
| `horoscope-ai-api` | api.gettodayshoroscope.com | `next build` | `prj_rWJqgnyvBJZOIUA2R0BvpY5wzZ5E` |
| `horoscope-ai-frontend` | www.gettodayshoroscope.com | `scripts/frontend-build.sh` | `prj_4Sha6rIf48CT3llWeOMMnPFqLHYS` |
| Team ID | | | `team_Rzq7CDbcuKfoNn4pJFUAZztO` |

CI/CD (`.github/workflows/deploy.yml`) deploys both in parallel on merge to main. PRs only run Build & Lint.

---

## 3. How a Reading Gets Generated

```
User picks sign (Aries) + philosophers (Seneca, Alan Watts, Rumi)
  ↓
/api/horoscope?sign=aries&philosophers=Seneca,Alan+Watts,Rumi
  ↓
1. assignDaily({ sign, council, date })     → picks today's philosopher from council
  ↓
2. retrieve({ sign, philosopher, date })    → personalized key first, daily-key fallback
   → Cache hit? Return immediately.
  ↓
3. generateReading({ sign, philosopher, date })
   → getSignProfile()       → voice, avoidPatterns, element
   → getFormatTemplate()    → one of 12 rotating structures
   → getQuotes(philosopher) → verified quotes from quote-bank
   → Build prompt: SOUL section + voice + rules + format + quotes
   → OpenAI gpt-4o-mini (JSON response format)
   → Validate: author check, quote verification, self-match filter
  ↓
4. store({ sign, philosopher, date, council, reading })
   → Cache key includes ALL inputs (council hash for personalized)
  ↓
5. toSnakeCase(reading) → Response
```

---

## 4. The 9 Philosopher Traditions

Canonical source: `src/tools/philosopher/registry.ts` (54 philosophers)

| Tradition | Count | Philosophers |
|-----------|-------|-------------|
| **Stoicism** | 8 | Marcus Aurelius, Seneca, Epictetus, Cato, Musonius Rufus, Cleanthes, Zeno, Chrysippus |
| **Epicureanism** | 1 | Epicurus |
| **Classical** | 3 | Socrates, Plato, Aristotle |
| **Eastern Wisdom** | 9 | Lao Tzu, Alan Watts, Krishnamurti, Thich Nhat Hanh, Rumi, Confucius, Zhuangzi, D.T. Suzuki, Pema Chodron |
| **Science & Wonder** | 9 | Einstein, Feynman, Sagan, Curie, Tesla, Carson, Tyson, Lovelace, Heisenberg |
| **Poetry & Soul** | 9 | Nietzsche, Emerson, Gibran, Oliver, Wilde, Thoreau, Angelou, Whitman, Hesse |
| **Spiritual Leaders** | 9 | Dispenza, Russell, Tolle, Ram Dass, Chopra, Yogananda, Mooji, Sadhguru, Dyer |
| **Existentialism** | 4 | de Beauvoir, Camus, Frankl, Arendt |
| **Contemporary** | 2 | Taleb, Naval Ravikant |

---

## 5. Brand Decisions

- **Dark cosmic premium palette** — indigo/purple/amber/glassmorphism. NOT pastel.
- **Constellation dot-line SVG icons** — `src/components/icons/ConstellationIcon.tsx`. Kill-switch: `USE_CONSTELLATION_ICONS = false`.
- **Voice**: "Grounded optimism — not naive, not preachy, not performative." 12 distinct sign voices.
- **Positioning**: "Not predictions. Philosophy that meets you where you are."
- **Forbidden language**: celestial, tapestry, embrace, navigate, "Dear [sign]"

---

## 6. Legacy Utils — Migration Status

The agent-native migration (PR #48) created `src/tools/` but not all consumers were migrated. Two systems coexist:

| Old Util | Status | Remaining Consumers | Why Not Migrated |
|----------|--------|-------------------|------------------|
| `horoscope-generator.ts` | **Partially migrated** | Monthly page (`generateHoroscope`) | `generateReading` doesn't support monthly type yet |
| `horoscope-prompts.ts` | **Partially migrated** | `horoscope-generator.ts` (prompt builder) | Dies when generator dies |
| `horoscope-service.ts` | **Not migrated** | `HoroscopeDisplay.tsx`, `AllHoroscopesContext.tsx` | Needs a batch fetch tool |
| `cache-keys.ts` | **Not migrated** | Debug routes | Legitimately needs old key format for production cache |
| `redis-helpers.ts` | **Not migrated** | Debug routes | Same — diagnostic tool matches production |
| `feature-flags.ts` | **Not migrated** | 16+ files | Deeply embedded, needs a strategy |
| `verified-quotes.ts` | **Consumed by tools** | `reading:quote-bank` imports from it | Data file, not logic — lower priority |

**Rule**: New code imports from `src/tools/`. Old consumers are migrated opportunistically. Don't rewrite old utils — migrate their consumers one at a time.

---

## 7. MCP Server

`packages/mcp-server/src/index.ts` — 12 tools via MCP protocol.

```json
{
  "mcpServers": {
    "horoscope": {
      "command": "npx",
      "args": ["horoscope-philosophy-mcp"],
      "env": { "HOROSCOPE_API_URL": "https://api.gettodayshoroscope.com" }
    }
  }
}
```

**Tools**: `zodiac_sign_profile`, `zodiac_sign_compatibility`, `philosopher_lookup`, `philosopher_list`, `philosopher_recommend`, `reading_generate`, `content_format`, `content_share_card`, `audience_subscribe`, `audience_unsubscribe`, `daily_publish`

Pure data tools (zodiac, philosopher) run locally. Generation and audience tools delegate to the API.

MCP Apps: interactive HTML share card (`ui://horoscope/share-card.html`), Vite singlefile build (107KB / 30KB gzip).

---

## 8. Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `OPENAI_API_KEY` | Yes | AI generation |
| `UPSTASH_REDIS_REST_URL` | Yes (prod) | Cache + subscribers + rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | Yes (prod) | Redis auth |
| `RESEND_API_KEY` | For email | Daily email sending |
| `CRON_SECRET` | For cron | Secures /api/cron/daily-horoscope |
| `AYRSHARE_API_KEY` | For social | Multi-platform posting |
| `NEXT_PUBLIC_API_URL` | Optional | API base URL override |
| `HOROSCOPE_API_URL` | MCP server | API base for MCP tool delegation |
| `AI_GATEWAY_API_KEY` | For local dev (AI SDK) | Vercel AI Gateway auth. Vercel-deployed envs use `VERCEL_OIDC_TOKEN` automatically when this is unset. |
| `FEATURE_FLAG_USE_AI_SDK` | Optional | Parity flag for Phase 1b: when `true`, `reading:generate` routes through `@/tools/ai/provider` instead of the legacy OpenAI SDK. Default off. Removed in Phase 1c after rollout. |

Redis is lazy-initialized via Proxy in `utils/redis.ts`. App won't crash without Redis — just won't cache or rate-limit.

---

## 9. Known P2s (Deferred)

| # | Issue | Suggested Fix |
|---|-------|---------------|
| 1 | Council-mode rotation doesn't vary by sign | Add signIndex to council-mode rotation in `assign-daily.ts` |
| 2 | Share card em-dash overlaps first quote line | Fix dy offset in SVG tspan in `packages/shared/src/share-card.ts` |
| 3 | Spurious fetch on edit-council | Guard fetchReading with mounted ref in `HomeFlow.tsx` |
| 4 | VALID_SIGNS duplicated in audience tools | Import from `zodiac:sign-profile` |
| 5 | Old test file references deleted `social-posting.ts` | Delete `__tests__/utils/social-posting.test.ts` |
| 6 | 9 pre-existing test failures in CI | SchemaMarkup.test.tsx (implicit `any`), social-posting.test.ts (missing module), others |

---

## 10. Pitfalls (Will Burn You)

| # | Pitfall | How to Avoid |
|---|---------|-------------|
| 1 | **Tailwind v3 ONLY** | CSS uses `@tailwind base/components/utilities`. NEVER `@import "tailwindcss"` (v4 syntax). V4 silently produces zero CSS. |
| 2 | **Two Vercel projects from one repo** | Frontend build excludes API routes via `frontend-build.sh`. API routes proxy via Vercel rewrites. |
| 3 | **Edge runtime crashes OpenAI** | Never add `export const runtime = 'edge'` to routes using OpenAI SDK. OG routes are edge (fine). |
| 4 | **Non-www redirect** | `gettodayshoroscope.com` 308s to `www.`. Always use `www.` in URLs/health checks. |
| 5 | **Double Redis prefix** | Legacy `safelyStoreInRedis` adds `horoscope-prod:` automatically. Never prepend manually. |
| 6 | **CI must build shared packages first** | `npm run build --workspace=packages/shared` before `next build`. Already in deploy.yml. |
| 7 | **`npm test` cascades to workspaces** | Workspace packages have `"test": "echo 'No tests yet'"` to prevent failures. |
| 8 | **node-fetch** | Not in dependencies. Next.js has built-in fetch. Never import it. |
| 9 | **30s function timeout** | Set in `vercel.json`. Hobby plan. Don't batch-generate all 12 signs sequentially. |
| 10 | **Visual regressions** | Always screenshot before/after UI changes. Sprint 3 required 7 hotfix PRs from visual degradation. |

---

## 11. Tests

120 tests for 8 pure-function atomic tools (PR #51):
- `cache:keys`, `assign-daily`, `content:format`, `registry`, `recommend`, `sign-profile`, `sign-compatibility`
- 0.8s, zero mocks, all pass

9 pre-existing test failures (not introduced by recent work):
- `SchemaMarkup.test.tsx` — implicit `any` type params
- `social-posting.test.ts` — references deleted module
- `guidance.test.ts`, `HoroscopeDisplay.test.tsx`, `VideoBanner.test.tsx`, etc.

Run tests: `npx jest --passWithNoTests` (use directly, not `npm test` which cascades)

---

## 12. Sprint History (55 PRs)

| Sprint | PRs | What |
|--------|-----|------|
| 1: Emergency Fix | #1-#10 | Edge runtime removal, content pipeline, security, frontend |
| 2: Product Overhaul | #11-#15 | 20-point remediation, CI/CD, dependencies |
| 3: Visual Restoration | #16-#23 | Tailwind v3 fix, design restoration, video autoplay |
| 4: SEO P0 | #27, #29 | AutoResearch content, monthly pages, E-E-A-T |
| 5: Philosophy Engine | #29-#39 | 50+ philosophers, homepage redesign, email, sharing, API+MCP |
| 6: Archive + Video | #40-#46 | Daily archive, video engine, quality gate |
| 7: Agent-Native | #47-#53 | 16 tools migration, MCP server v2, 120 tests, MCP Apps |
| 8: Verbs + Agents | #54-#55 | Doc sync, shared package, type extraction, agent definitions |

---

## 13. Next Steps (Priority Order)

### Immediate

1. **More MCP Apps** — Philosopher picker, reading dashboard, daily publisher dashboard. Validates the pattern from PR #52.
2. **Social accounts** — TikTok, X account setup + Ayrshare connection (Facebook Page already live). Setup guide: `docs/setup/social-accounts-setup-guide.md`
3. **P2 backlog** — Council rotation sign variance, spurious fetch, stale test cleanup

### Medium-term

4. **Extend `generateReading` for monthly type** — Unblocks migration of monthly page from `horoscope-generator.ts`
5. **Create batch fetch tool** — Unblocks migration of `HoroscopeDisplay` from `horoscope-service.ts`
6. **Wire agent definitions to runtime** — Connect `src/agents/` to MCP server or orchestrator so agents can self-compose
7. **Tests for impure tools** — cache:store, cache:retrieve, reading:generate (need Redis/OpenAI mocking)

### Future

8. **Delete remaining old utils** — After all consumers are migrated
9. **Stripe integration** — Pricing page exists, needs payment flow
10. **Birth chart basics** — Big 3 (Sun/Moon/Rising)

---

## 14. How to Run

```bash
# Setup
cd /Users/fp/Desktop/horoscope-ai-app
npm install
cp .env.example .env.local          # Fill in API keys (or: vercel env pull .env.local)

# Build shared packages (required once, or after changes to packages/shared/)
npm run build --workspace=packages/shared

# Dev
npm run dev

# Build (must pass with zero errors)
npx next build

# Tests
npx jest --passWithNoTests

# MCP server
cd packages/mcp-server && npm run build && npm start

# Health check
curl https://api.gettodayshoroscope.com/api/debug/ping

# Test a sign
curl "https://api.gettodayshoroscope.com/api/horoscope?sign=aries" | python3 -m json.tool

# Flush cache
curl -H "Authorization: Bearer $CRON_SECRET" https://api.gettodayshoroscope.com/api/cron/daily-horoscope
```

---

## 15. Documentation Map

| Doc | Purpose | Freshness |
|-----|---------|-----------|
| **`docs/HANDOFF.md`** | **THIS FILE — start here** | 2026-04-17 |
| `docs/ARCHITECTURE.md` | System diagrams, data flow, constraints | 2026-04-15 |
| `docs/PROJECT_CONTEXT.md` | Full context — design system, SEO, competitive positioning | 2026-04-15 |
| `docs/AGENT_HANDOFF.md` | **DEPRECATED** — historical reference only (pre-migration) | 2026-04-02 |
| `docs/plans/` | 8 sprint plans (architecture decisions, squad assignments) | Various |
| `docs/brainstorms/` | Requirements for philosophy engine + video engine | Various |
| `docs/solutions/` | Compound docs (learnings from each sprint) | Various |
| `docs/setup/` | Production activation checklist, social accounts guide | 2026-04-13 |

---

## 16. Commit History (Recent)

| Commit | PR | Summary |
|--------|-----|---------|
| `9a8a2a2` | #55 | Shared package, type extraction, agent definitions, CI workspace fix |
| `97052bd` | #54 | Docs synced to agent-native architecture, 39 branches cleaned |
| `5eebaca` | #53 | Session close-out compound doc |
| `cd7581c` | #52 | MCP Apps interactive share card |
| `2440a0a` | #51 | 120 tests for 8 pure-function tools |
| `6669098` | #50 | Exhaustive handoff doc |
| `6e26805` | #49 | MCP server v2: 12 tools |
| `b53ad23` | #48 | Agent-native migration: 16 tools, 13 P0s resolved |
