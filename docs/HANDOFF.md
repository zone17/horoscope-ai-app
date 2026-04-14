# Handoff Document: Today's Horoscope — Agent-Native Architecture

> **Date**: 2026-04-14
> **Previous session**: Agent-native migration (PRs #48, #49)
> **Status**: Both PRs merged to main. CI green. Production deployed.
> **Branch**: `main` is the active branch. No open PRs.

---

## What This App Is

**Today's Horoscope** is a Philosophy Engine — users pick their zodiac sign, select up to 5 philosophers from 54 thinkers across 9 traditions, and receive daily personalized readings that blend philosopher wisdom with zodiac personality. It's NOT a generic horoscope app.

- **Domain**: gettodayshoroscope.com
- **Stack**: Next.js 15.5.14, Vercel, Upstash Redis, OpenAI (gpt-4o-mini), Ayrshare (social posting), Resend (email)
- **Architecture**: Agent-native — 16 atomic tools in `src/tools/`, composed by thin API routes and a cron job. MCP server exposes 12 tools to external agents.

---

## Architecture Overview

```
src/tools/                          ← THE SOURCE OF TRUTH
├── zodiac/
│   ├── sign-profile.ts             ← 12 sign personalities, voices, elements
│   └── sign-compatibility.ts       ← Element-based sign matching
├── philosopher/
│   ├── registry.ts                 ← 54 philosophers, 9 traditions (CANONICAL)
│   ├── assign-daily.ts             ← Daily philosopher rotation from council
│   └── recommend.ts                ← Sign-based philosopher suggestions
├── reading/
│   ├── generate.ts                 ← Core AI generation (OpenAI)
│   ├── quote-bank.ts               ← Verified quotes (no hallucinations)
│   └── format-template.ts          ← 12 writing format rotations
├── cache/
│   ├── keys.ts                     ← Cache key derivation (includes philosopher!)
│   ├── store.ts                    ← Redis write
│   ├── retrieve.ts                 ← Redis read with daily-key fallback
│   └── invalidate.ts               ← SCAN+DEL pattern
├── content/
│   ├── format.ts                   ← Reading → 6 platform formats
│   ├── share-card.ts               ← 1080x1080 SVG generator
│   └── distribute.ts               ← Ayrshare multi-platform posting
└── audience/
    ├── subscribe.ts                ← Redis-based rate limiting
    ├── unsubscribe.ts
    └── segment.ts                  ← Query subscribers by sign

packages/mcp-server/src/index.ts    ← MCP server (12 tools for external agents)

src/app/api/horoscope/route.ts      ← THIN wrapper: assign → cache → generate → store → return
src/app/api/cron/daily-horoscope/   ← THIN wrapper: 12× (assign → generate → store → email)
```

### Key Principle

**Every tool is independently useful.** You can call `getSignProfile('aries')` without generating a reading. You can call `getQuotes('Seneca')` without a sign selected. You can call `formatReading({ reading, platform: 'tiktok' })` for a platform that doesn't exist in the UI.

API routes are under 60 lines — they parse inputs, compose tools, return responses. Zero business logic in routes.

---

## The 9 Philosopher Traditions (Corrected Taxonomy)

This was a P0 fix — the old code had Epicurus under Stoicism and Socrates/Plato/Aristotle under "Modern Thinkers."

| Tradition | Philosophers | Era |
|-----------|-------------|-----|
| **Stoicism** | Marcus Aurelius, Seneca, Epictetus, Cato, Musonius Rufus, Cleanthes, Zeno, Chrysippus | Ancient |
| **Epicureanism** | Epicurus | Ancient |
| **Classical** | Socrates, Plato, Aristotle | Ancient |
| **Eastern Wisdom** | Lao Tzu, Alan Watts, Krishnamurti, Thich Nhat Hanh, Rumi, Confucius, Zhuangzi, D.T. Suzuki, Pema Chodron | Mixed |
| **Science & Wonder** | Einstein, Feynman, Sagan, Curie, Tesla, Carson, Tyson, Lovelace, Heisenberg | Modern |
| **Poetry & Soul** | Nietzsche, Emerson, Gibran, Oliver, Wilde, Thoreau, Angelou, Whitman, Hesse | Modern |
| **Spiritual Leaders** | Dispenza, Russell, Tolle, Ram Dass, Chopra, Yogananda, Mooji, Sadhguru, Dyer | Mixed |
| **Existentialism** | de Beauvoir, Camus, Frankl, Arendt | Modern |
| **Contemporary** | Taleb, Naval Ravikant | Contemporary |

The canonical source is `src/tools/philosopher/registry.ts`. PhilosopherStep.tsx and PhilosopherCard.tsx import directly from the registry.

---

## How a Reading Gets Generated

```
User picks sign (Aries) + philosophers (Seneca, Alan Watts, Rumi)
  ↓
/api/horoscope?sign=aries&philosophers=Seneca,Alan+Watts,Rumi
  ↓
1. assignDaily({ sign: 'aries', council: ['Seneca','Alan Watts','Rumi'], date: '2026-04-14' })
   → { philosopher: 'Seneca', reason: 'Day rotation index 0' }
  ↓
2. retrieve({ sign: 'aries', philosopher: 'Seneca', date: '2026-04-14', council: [...] })
   → Checks personalized key first, then daily key as fallback
   → Cache hit? Return immediately
  ↓
3. generateReading({ sign: 'aries', philosopher: 'Seneca', date: '2026-04-14' })
   → Fetches sign profile (voice, avoidPatterns)
   → Fetches writing format (rotates daily per sign)
   → Fetches verified Seneca quotes
   → Builds prompt with SOUL section + voice + rules + format + quote bank
   → Calls OpenAI gpt-4o-mini with JSON response format
   → Validates output (author check, quote verification, self-match filter)
  ↓
4. store({ sign, philosopher, date, council, reading })
   → Cache key includes ALL inputs (fixes the old cache bug)
  ↓
5. toSnakeCase(reading) → Response
   → Maps camelCase tool output to snake_case for frontend compatibility
```

---

## Brand Decisions

Documented in `.claude/brand-decisions.md`. Key points:

- **Dark cosmic premium palette** — indigo/purple/amber/glassmorphism. NOT pastel.
- **Constellation dot-line SVG icons** — amber/gold on dark bg, in `src/components/icons/ConstellationIcon.tsx`. Kill-switch: `USE_CONSTELLATION_ICONS = false` reverts to emoji.
- **Voice**: "Grounded optimism — not naive, not preachy, not performative." 12 distinct sign voices.
- **Name**: "Today's Horoscope" (display), "gettodayshoroscope.com" (domain only)
- **Positioning**: "Not predictions. Philosophy that meets you where you are."
- **Forbidden language**: celestial, tapestry, embrace, navigate, "Dear [sign]"

---

## What Was Fixed (13 P0s + 6 Review Findings)

### Original P0s from 5-Wave Audit

| # | Issue | How Fixed |
|---|-------|-----------|
| 1 | Philosopher miscategorization | `registry.ts` — Epicurus→Epicureanism, Socrates/Plato/Aristotle→Classical |
| 2 | Cache key ignores philosophers | `cache:keys` auto-includes all inputs |
| 3 | ignoreBuildErrors | Removed — build fails on real errors |
| 4 | Function timeout 10s | 10→30s in vercel.json |
| 5 | No rate limiting on subscribe | Redis INCR+EXPIRE in `audience:subscribe` |
| 6 | Cron no Redis fallback | Health check + skip-cache path |
| 7 | Edit council doesn't reset | `setPhilosophers([])` before step change |
| 8 | web-vitals broken imports | getCLS→onCLS, removed deprecated FID |
| 9 | Email gate skip invisible | Opacity 30→60% |
| 10 | No share card | `content:share-card` — 1080x1080 SVG |
| 11 | No guided philosopher path | `philosopher:recommend` in onboarding |
| 12 | Broken legacy imports | Dead files deleted |
| 13 | Duplicate dead files | All cleaned |

### Review Findings (Caught by CE Review)

| # | Issue | How Fixed |
|---|-------|-----------|
| R1 | camelCase/snake_case response mismatch | `toSnakeCase()` mapping in API route |
| R2 | Cache key asymmetry (cron vs API) | Daily-key fallback in `cache:retrieve` |
| R3 | In-memory rate limiter useless in serverless | Moved to Redis INCR+EXPIRE |
| R4 | Redis throws at module load | Lazy-init via Proxy in `utils/redis.ts` |
| R5 | Old routes on old cache namespace | Deleted guidance, debug/generate, refresh, regenerate routes |
| R6 | Compat layer hiding taxonomy fix | PhilosopherStep imports from registry directly |

---

## Known P2s (Deferred)

| # | Issue | Risk | Suggested Fix |
|---|-------|------|---------------|
| 1 | Council-mode rotation doesn't vary by sign | Two users with same council get same philosopher | Add signIndex to council-mode rotation |
| 2 | Zero tests for 16 tools | Regressions undetected | Priority: cache:keys, content:format, assign-daily |
| 3 | Share card em-dash overlaps first quote line | Visual glitch | Fix dy offset in SVG tspan |
| 4 | Spurious fetch on edit-council | Wasted OpenAI call during unmount | Guard fetchReading with mounted ref |
| 5 | VALID_SIGNS duplicated in audience tools | Divergence risk | Import from zodiac:sign-profile |
| 6 | Old test file references deleted social-posting.ts | CI warning | Delete or update test |

---

## Files Deleted During Migration

| File | Reason |
|------|--------|
| `src/utils/social-posting.ts` | Replaced by `tools/content/format` + `tools/content/distribute` |
| `src/utils/cache.ts` | Replaced by `tools/cache/` |
| `src/contexts/ModeContext.tsx` | Dead code |
| `src/components/Header.tsx` | Dead (broken import) |
| `src/components/HoroscopeDisplay.tsx` | Dead (not imported) |
| `src/components/ZodiacCard.tsx` | Dead (broken import) |
| `src/app/api/guidance/route.ts` | Duplicate of /api/horoscope |
| `src/app/api/debug/generate/route.ts` | Used old generator |
| `src/app/api/debug/regenerate-horoscopes/` | Used old generator |
| `src/app/api/horoscope/refresh/route.ts` | Replaced by cron |
| `src/app/api/openai-enhanced/route.ts` | Dead test route |
| `src/app/api/openai-test/route.ts` | Dead test route |

---

## Files Still Using Old Utils (Migration Incomplete)

These old files still have active imports — they'll be fully replaced when all consumers migrate:

| Old File | Import Count | What Still Uses It |
|----------|-------------|-------------------|
| `utils/horoscope-generator.ts` | 5 | video-helpers, monthly/daily pages |
| `utils/horoscope-prompts.ts` | 2 | reading:generate (VALID_AUTHORS), horoscope-generator |
| `utils/horoscope-service.ts` | 3 | HoroscopeDisplay, AllHoroscopesContext |
| `utils/cache-keys.ts` | 3 | debug/redis, debug/assets |
| `utils/redis-helpers.ts` | 2 | debug routes |
| `utils/feature-flags.ts` | 16+ | Deeply embedded |
| `constants/philosophers.ts` | 4 | EmailGate, ReadingPreview, ReadingDisplay, PhilosopherCard(compat) |

---

## MCP Server

`packages/mcp-server/src/index.ts` — 12 tools via MCP protocol.

**Setup with Claude Desktop:**
```json
{
  "mcpServers": {
    "horoscope": {
      "command": "npx",
      "args": ["horoscope-philosophy-mcp"],
      "env": {
        "HOROSCOPE_API_URL": "https://api.gettodayshoroscope.com"
      }
    }
  }
}
```

**Tools available:**
- `zodiac_sign_profile` / `zodiac_sign_compatibility`
- `philosopher_lookup` / `philosopher_list` / `philosopher_recommend`
- `reading_generate`
- `content_format` / `content_share_card`
- `audience_subscribe` / `audience_unsubscribe`
- `daily_publish` (composite: assign → generate → format in one call)

Pure data tools (zodiac, philosopher) run locally. Generation and audience tools delegate to the API.

---

## Environment Variables

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

Note: Redis is lazy-initialized. App won't crash if Redis env vars are missing — it just won't cache or rate-limit.

---

## What Was Done (2026-04-14 Session)

### PR #51 — 120 tests for 8 pure-function atomic tools (MERGED)
- 7 test suites: cache:keys, assign-daily, content:format, registry, recommend, sign-profile, sign-compatibility
- 3-agent review → 8 findings remediated (stronger assertions, no magic numbers)
- All 120 tests pass in 0.8s, zero mocks

### PR #52 — First MCP App: interactive share card (MERGED)
- Fixed share card divergence (canonical 312-line tool replaces 18-line stub)
- Migrated all 12 tools from deprecated `server.tool()` to `registerTool`
- MCP Apps interactive HTML: sign picker, live card preview, constellation art
- Vite singlefile build (107KB / 30KB gzip)
- 3-agent security/correctness/maintainability review → 7 findings remediated (XSS fix, escapeHtml, missing deps)
- Graceful degradation for non-MCP-Apps clients

### Global Memory Saved
- Claude Cookbooks reference (40+ notebooks)
- Claude Managed Agents API reference
- MCP 2026 Roadmap + Extensions + MCP Apps reference

### Compound Doc
- `docs/solutions/mcp-apps/mcp-apps-share-card-20260414.md`

---

## Next Steps (Priority Order)

1. **Extract share-card.ts into shared package** — P0 divergence risk. The MCP server has a copy that will drift. Zero external deps makes extraction trivial.
2. **Agent definitions** — System prompts for `daily-publisher`, `social-poster`, `onboarding-guide` agents that know which MCP tools they have
3. **More MCP Apps** — Philosopher picker, reading dashboard, daily publisher dashboard. Validates the pattern established in PR #52.
4. **Social accounts** — TikTok, X account setup + Ayrshare connection (Facebook Page already live)
5. **P2 backlog** — Council rotation sign variance, spurious fetch, stale test cleanup (no Linear ticket yet — auth was down)
6. **Delete remaining old utils** — Migrate last consumers of horoscope-generator, horoscope-service, feature-flags
7. **Tests for impure tools** — cache:store, cache:retrieve, reading:generate (need Redis/OpenAI mocking)

---

## How to Run Locally

```bash
cd /Users/fp/Desktop/horoscope-ai-app
npm install
cp .env.example .env.local  # Fill in API keys
npm run dev                  # Starts on next available port (check output)
```

Build: `npx next build` (must pass with zero errors — no ignoreBuildErrors flag)

MCP server: `cd packages/mcp-server && npm run build && npm start`

---

## Commit History (This Sprint)

| Commit | PR | Summary |
|--------|-----|---------|
| `2440a0a` | #51 | 120 tests for 8 pure-function atomic tools |
| `cd7581c` | #52 | MCP Apps interactive share card + registerTool migration |
| `db80492` | #48 | Phases 1-2: 7 tools + constellation icons + hygiene P0s |
| `1948545` | #48 | Phase 3: reading:generate + auto-keyed cache + API rewired |
| `264d7c2` | #48 | Phase 4: content distribution + audience tools + cron rewired |
| `0c3e66b` | #48 | Phase 5: UI wired + dead code removed |
| `e849850` | #48 | Review fixes: 2 P0s + 4 P1s |
| `90633b5` | #48 | CI fix: exclude packages/ from tsconfig |
| `944d69b` | #49 | MCP server v2: 12 tools |
