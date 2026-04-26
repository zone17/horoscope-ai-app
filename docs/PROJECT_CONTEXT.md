# Project Context: gettodayshoroscope.com

> **Last updated**: 2026-04-26
> **Status**: Production — 67 PRs shipped, agent-native architecture (PR #48), 159 tool tests, MCP server + MCP Apps, AI SDK + Gateway chokepoint (PR #60), LLM-as-judge verb (PR #63), Sonnet 4.6 + canonical Zod schema for `reading:generate` (PR #65), critique-loop composer `reading:generate-with-critique` shipped (PR #67 — verb live, cron rewiring blocked on function-timeout fix). **Phase 1 of the Reading Authenticity initiative is functionally complete; Phase 1d (corpus retrieval) remains, blocked on the living-philosopher posture decision.**

---

## 1. What This Is

A **Philosophy Engine** — users pick their zodiac sign, select up to 5 philosophers from 54 thinkers across 9 traditions, and receive daily personalized readings that blend philosopher wisdom with zodiac personality. It's NOT a generic horoscope app or fortune-telling.

**Live URLs:**
| Surface | URL | Vercel Project |
|---------|-----|---------------|
| Frontend | https://www.gettodayshoroscope.com | `horoscope-ai-frontend` (`prj_4Sha6rIf48CT3llWeOMMnPFqLHYS`) |
| API | https://api.gettodayshoroscope.com | `horoscope-ai-api` (`prj_rWJqgnyvBJZOIUA2R0BvpY5wzZ5E`) |
| Repo | https://github.com/zone17/horoscope-ai-app | — |

**Brand positioning:** "Not predictions. Philosophy that meets you where you are."

**Team ID:** `team_Rzq7CDbcuKfoNn4pJFUAZztO`

---

## 2. Tech Stack

| Layer | Technology | Version/Details |
|-------|-----------|-----------------|
| Framework | Next.js | 15.5.14, App Router, ISR (`revalidate: 3600`) |
| Language | TypeScript | `ignoreBuildErrors` removed (PR #48) — build fails on real errors |
| Styling | Tailwind CSS | Dark cosmic theme, glassmorphism cards, element-based accent colors |
| Animation | Framer Motion | Conditional on `prefers-reduced-motion` |
| State | Zustand | Persisted to localStorage: `userSign`, `mode` (day/night), `streakCount`, `lastReadDate` |
| Cache | Upstash Redis | TTL-based caching, namespace `horoscope-prod:` |
| AI | OpenAI | `gpt-4o-mini-2024-07-18`, ~800 max tokens per horoscope |
| OG Images | @vercel/og (Satori) | Dynamic per-sign images with element gradients |
| Analytics | @vercel/analytics | Custom events: sign_selected, reading_opened, share_tapped, etc. |
| Fonts | Satoshi (body) + Playfair Display (sign names) | Loaded via next/font, Geist removed |
| CI/CD | GitHub Actions | Dual Vercel project deploy on merge to main |
| Hosting | Vercel | Hobby plan, 30s function timeout (vercel.json), 2 projects |
| PWA | manifest.json + service worker | Offline-capable, installable |

---

## 3. Architecture

> **Full details**: [`docs/ARCHITECTURE.md`](./ARCHITECTURE.md)

### Agent-Native Tool Architecture (since PR #48, Apr 2026)

16 atomic tools in `src/tools/` are the source of truth. API routes are thin composers (under 60 lines). An MCP server (`packages/mcp-server/`) exposes 12 tools to external agents.

```
src/tools/
├── zodiac/        sign-profile, sign-compatibility
├── philosopher/   registry (54 thinkers, 9 traditions), assign-daily, recommend
├── reading/       generate (OpenAI), quote-bank, format-template
├── cache/         keys, store, retrieve, invalidate
├── content/       format (6 platforms), share-card (SVG), distribute (Ayrshare)
└── audience/      subscribe, unsubscribe, segment
```

### Data Flow

1. User picks sign + philosophers → `/api/horoscope?sign=X&philosophers=...`
2. `assignDaily()` selects today's philosopher from the user's council
3. `retrieve()` checks Redis cache (personalized key, then daily-key fallback)
4. On cache miss: `generateReading()` → OpenAI gpt-4o-mini → validates quotes → `store()`
5. `toSnakeCase(reading)` → JSON response

### Two Vercel Projects

| Project | Domain | Serves | Build |
|---------|--------|--------|-------|
| `horoscope-ai-api` | api.gettodayshoroscope.com | API routes, cron, OG images | `next build` |
| `horoscope-ai-frontend` | www.gettodayshoroscope.com | Pages, components, assets | `scripts/frontend-build.sh` |

CI/CD (`.github/workflows/deploy.yml`) deploys both in parallel on merge to main.

---

## 4. Content System — The Differentiator

This is what makes the product unique. Understanding the content pipeline is essential.

### Generation Pipeline (Agent-Native)

Generation flows through `src/tools/reading/generate.ts` (canonical since PR #48). Legacy `src/utils/horoscope-generator.ts` still has consumers (video-helpers, monthly pages) being phased out.

```
assignDaily({ sign, council, date })        ← tools/philosopher/assign-daily.ts
    ↓
retrieve({ sign, philosopher, date })       ← tools/cache/retrieve.ts
    ↓ (cache miss)
generateReading({ sign, philosopher, date })← tools/reading/generate.ts
    │
    ├── getSignProfile(sign)                ← tools/zodiac/sign-profile.ts
    ├── getFormatTemplate(sign, date)       ← tools/reading/format-template.ts
    ├── getQuotes(philosopher)              ← tools/reading/quote-bank.ts
    ├── Prompt: SOUL section + voice + rules + format + quotes
    ├── OpenAI gpt-4o-mini with JSON response format
    └── Validates: author check, quote verification, self-match filter
    ↓
store({ sign, philosopher, date, council }) ← tools/cache/store.ts
```

### Sign Voice System (`src/tools/zodiac/sign-profile.ts`)

| Sign | Voice Description | Key Anti-patterns |
|------|------------------|-------------------|
| Aries | Bold, direct coach — punchy sentences, unexpected insights | No "fiery phoenix", no greetings, no "Today, [sign]..." |
| Taurus | Unhurried porch friend — sensory details, temperatures, textures | No "steadfast", no bull metaphors |
| Gemini | Intellectually curious — thought experiments, "what if" scenarios | No twin/duality clichés |
| Cancer | Tender emotional intelligence — home, memory, body wisdom | No shell/crab metaphors |
| Leo | Warm mentor with honest challenges — cinematic imagery | No flattery, no "king/queen of the jungle" |
| Virgo | Precise, dry wit — small details reveal larger truths | No "perfectionist" or "analytical mind" clichés |
| Libra | Elegant diplomat-poet — two competing truths, unanswerable questions | No scales/balance metaphors |
| Scorpio | Raw psychological intensity — no sugarcoating, sharp language | No "sting", no "mysterious depths" |
| Sagittarius | Philosophical campfire wanderer — irreverent wisdom, paradoxes | No "archer", no "aim your arrow" |
| Capricorn | Understated hard-won authority — rest is not weakness | No "mountain goat", no "climb to the top" |
| Aquarius | Visionary systems thinker — science analogies, pattern-seeing | No "water bearer", no "rebel" clichés |
| Pisces | Dreamlike synesthetic fluidity — blur metaphor and reality | No "ocean depths", no "swimming" clichés |

### Global Banned Words/Phrases

```
tapestry, canvas, journey, embrace, navigate, celestial, radiant, vibrant,
manifest, align/alignment, resonate, ignite, illuminate, nurture, unfold,
"Dear [Sign]", "As [philosopher] once said", "the cosmos has aligned"
```

### Writing Format Rotation (12 formats)

Rotates daily per sign using `(signIndex + dayNum) % 12`:

1. Scene/micro-story → single insight → question
2. Nature observation → inner truth → actionable suggestion
3. Philosophical paradox/koan → sit with it
4. Three short distinct thoughts — no transitions
5. Start mid-thought → specific and concrete → zoom out
6. Name something the reader felt this morning → validate → reframe
7. Brief parable/anecdote → let it land → one line of reflection
8. Question first → two angles → practice/experiment for the day
9. Start with the body → doorway to emotional territory → stay grounded
10. What this day is NOT about → clear the noise → one thing that matters
11. Advice to your younger self about today → honest, kind, specific
12. Begin with silence → horoscope emerges from stillness

### Verified Quote Bank (`src/utils/verified-quotes.ts`)

140+ real, source-cited quotes from 14 philosophers. Each philosopher has 10+ quotes. The prompt includes 4 quotes from the assigned philosopher; the model selects the most thematically relevant one. Post-validation replaces any fabricated quote with a verified one from the bank.

**Philosopher roster:** 54 philosophers across 9 traditions. Canonical source: `src/tools/philosopher/registry.ts`. Users select up to 5 as their council; `assignDaily()` rotates through the council daily.

### Astrological Context (`src/utils/astro-context.ts`)

Injects context into prompts when relevant:
- **Mercury retrograde periods** (2026: Mar 14-Apr 7, Jul 17-Aug 10, Nov 9-Dec 1)
- **Moon phases** (calculated from Jan 18 2026 new moon reference, 29.53-day cycle)
- Returns `null` when no special context applies — prompt runs without astrological section

### Content Quality Benchmarks

From a 12-sign audit by a content strategist:

| Tier | Signs | Notes |
|------|-------|-------|
| A- | Cancer, Scorpio, Pisces | Best voice differentiation and quote-message coherence |
| B | Aries, Virgo, Capricorn, Aquarius | Solid, room for improvement |
| C+ | Taurus, Leo, Gemini, Libra, Sagittarius | Model flattens specs; bad examples added to prompts for these signs |

---

## 5. File Reference

### Agent-Native Tools (`src/tools/`) — Source of Truth

| Directory | Tools | Purpose |
|-----------|-------|---------|
| `zodiac/` | sign-profile, sign-compatibility | 12 sign personalities, element matching |
| `philosopher/` | registry, assign-daily, recommend | 54 philosophers, 9 traditions, rotation, suggestions |
| `reading/` | generate, judge, generate-with-critique, quote-bank, format-template | AI generation (Sonnet 4.6 + canonical Zod schema), LLM-as-judge scoring (5 axes, prompt-injection hardened — see [`design-patterns/llm-as-judge-prompt-injection-hardening-20260425.md`](./solutions/design-patterns/llm-as-judge-prompt-injection-hardening-20260425.md)), critique-loop composer wrapping generate+judge with BEST-of-N (see [`design-patterns/critique-loop-best-of-n-hardening-20260426.md`](./solutions/design-patterns/critique-loop-best-of-n-hardening-20260426.md)), verified quotes, 12 writing formats |
| `ai/` | provider | AI SDK + Gateway chokepoint — single import surface for `generateText`/`generateObject`/`streamText` + canonical `MODELS` constants |
| `cache/` | keys, store, retrieve, invalidate | Redis cache with auto-keyed derivation |
| `content/` | format, share-card, distribute | 6 platform formats, SVG cards, Ayrshare posting |
| `audience/` | subscribe, unsubscribe, segment | Redis-based rate-limited subscription |

### Legacy Utils (still have active consumers — being phased out)

| File | Replaced By | Still Used By |
|------|-------------|---------------|
| `utils/horoscope-generator.ts` | `tools/reading/generate.ts` | video-helpers, monthly/daily pages |
| `utils/horoscope-prompts.ts` | `tools/zodiac/sign-profile.ts` + `tools/reading/format-template.ts` | reading:generate (VALID_AUTHORS) |
| `utils/horoscope-service.ts` | Direct API fetch | HoroscopeDisplay |
| `utils/cache-keys.ts` | `tools/cache/keys.ts` | debug/redis, debug/assets |
| `utils/redis-helpers.ts` | `tools/cache/store.ts` + `tools/cache/retrieve.ts` | debug routes |
| `utils/feature-flags.ts` | No replacement yet | 16+ consumers (deeply embedded) |

### MCP Server

`packages/mcp-server/src/index.ts` — 12 tools via MCP protocol. Pure data tools run locally; generation/audience tools delegate to the API.

### API Routes

| Route | Purpose | Auth |
|-------|---------|------|
| `GET /api/horoscope?sign=X&philosophers=...` | Main endpoint — assign → cache → generate → return | Public |
| `GET /api/cron/daily-horoscope` | Batch generate all 12 signs + send emails | `CRON_SECRET` |
| `GET /api/og/[sign]` | Dynamic OG image (1200x630, edge runtime) | Public |
| `POST /api/subscribe` | Email capture → Redis | Public |
| `GET /api/unsubscribe` | One-click unsubscribe | Public |
| `GET /api/debug/ping` | Health check | Public |
| `GET /api/debug/redis` | Cache inspection | Public |
| `GET /api/horoscopes` | All 12 signs batch read | Public |

### Frontend Pages

| Page | Route | Rendering | Notes |
|------|-------|-----------|-------|
| Home | `/` | ISR (1h) | Sign picker → philosopher grid → reading flow |
| Sign page | `/horoscope/[sign]` | ISR (1h) | Full reading, OG tags, share button, email capture |
| About author | `/about/author` | ISR (24h) | Elena Vasquez persona |
| Sitemap | `/sitemap.xml` | Dynamic | Auto-generated |

### Frontend Components

**Homepage flow (`src/components/home/`):**

| Component | Purpose |
|-----------|---------|
| HomeFlow | Orchestrates step flow (sign → philosophers → reading) |
| SignStep | 12 sign buttons with constellation icons |
| PhilosopherStep | Categorized grid with live preview, imports from `tools/philosopher/registry` |
| PhilosopherCard | Individual philosopher card |
| EmailGate | Soft gate — preview + email input |
| ReadingDisplay | Personalized reading |
| ReadingPreview | Preview before gate |
| ShareButton | Web Share API + clipboard fallback |

**Zodiac components (`src/components/zodiac/`):**

| Component | Purpose |
|-----------|---------|
| ZodiacCard | Card with element accent colors, auto-height, a11y |
| HoroscopeDisplay | 12-card grid layout |
| SignPicker | Horizontal sign selector |
| EmailCapture | Email input → `/api/subscribe` |

**Other:**

| Component | Purpose |
|-----------|---------|
| ConstellationIcon | Amber/gold constellation dot-line SVG icons |
| ModeToggle | Day/Night mode switch |
| Header | Fixed header with logo, date, mode toggle |
| SchemaMarkupServer | JSON-LD structured data (WebSite, Organization, Service, ItemList, FAQ) |

### State Management (`src/hooks/useMode.ts`)

Zustand store with `persist` middleware (localStorage key: `horoscope-mode-storage`):

| Field | Type | Purpose |
|-------|------|---------|
| `mode` | `'day' \| 'night'` | Switches content (message vs peaceful_thought) AND visual theme |
| `userSign` | `string \| null` | Persisted sign preference — shown first on return, used for sign page navigation |
| `streakCount` | `number` | Consecutive days read — increments if lastReadDate is yesterday |
| `lastReadDate` | `string \| null` | ISO date string — used for streak calculation |
| `toggleMode()` | function | Switches day/night |
| `setUserSign(sign)` | function | Saves sign preference |
| `recordReading()` | function | Updates streak + lastReadDate |

### Configuration

| File | Purpose |
|------|---------|
| `next.config.js` | Main Next.js config (API project build) — `ignoreBuildErrors` removed |
| `next.config.frontend.js` | Frontend-specific config — `output: 'standalone'`, API rewrites |
| `vercel.json` | API project — cron schedule, function config (`maxDuration: 30`, `memory: 1024`) |
| `vercel.frontend.json` | Frontend project — `buildCommand: frontend-build.sh`, API rewrites |
| `tailwind.config.js` | Tailwind — `fontFamily.sans` (Satoshi), `fontFamily.display` (Playfair Display) |
| `eslint.config.mjs` | Flat ESLint config — `no-explicit-any: off`, `no-require-imports: off` |
| `.github/workflows/deploy.yml` | CI/CD — build verification → parallel deploy to both projects → health checks |
| `scripts/frontend-build.sh` | Frontend build — moves API routes + middleware out, runs `next build`, restores |

### PWA Assets

| File | Purpose |
|------|---------|
| `public/manifest.json` | PWA manifest — app name, icons, theme colors, standalone display |
| `public/sw.js` | Service worker — cache-first for shell, network-first for API, push handlers |
| `public/icons/icon.svg` | SVG source icon |
| `public/icons/icon-192x192.png` | PWA icon (192px) |
| `public/icons/icon-512x512.png` | PWA icon (512px) |

---

## 6. Environment Variables

### Required (Vercel + Local)

| Variable | Purpose | Where Used |
|----------|---------|-----------|
| `OPENAI_API_KEY` | OpenAI API access | `tools/reading/generate.ts` |
| `UPSTASH_REDIS_REST_URL` | Redis connection URL | `utils/redis.ts` |
| `UPSTASH_REDIS_REST_TOKEN` | Redis auth token | `utils/redis.ts` |
| `CRON_SECRET` | Auth for cron endpoint | `cron/daily-horoscope` |
| `RESEND_API_KEY` | Email delivery | `utils/email.ts` |
| `AYRSHARE_API_KEY` | Social posting | `tools/content/distribute.ts` |

### Feature Flags (Optional)

| Variable | Default | Purpose |
|----------|---------|---------|
| `FEATURE_FLAG_USE_REDIS_CACHE` | `true` | Enable/disable Redis caching |
| `FEATURE_FLAG_USE_TIMEZONE_CONTENT` | `false` | Timezone-aware content generation |
| `FEATURE_FLAG_USE_SCHEMA_MARKUP` | `true` | SEO JSON-LD structured data |
| `FEATURE_FLAG_USE_ENHANCED_SCHEMA_MARKUP` | `false` | Extended schema types |

### CI/CD Secrets (GitHub)

| Secret | Value |
|--------|-------|
| `VERCEL_TOKEN` | Vercel API token (from vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | `team_Rzq7CDbcuKfoNn4pJFUAZztO` |
| `VERCEL_API_PROJECT_ID` | `prj_rWJqgnyvBJZOIUA2R0BvpY5wzZ5E` |
| `VERCEL_FRONTEND_PROJECT_ID` | `prj_4Sha6rIf48CT3llWeOMMnPFqLHYS` |

### Local Development

Pull Vercel env vars: `vercel env pull .env.local`

---

## 7. CI/CD Pipeline

### Workflow (`.github/workflows/deploy.yml`)

```
On push to main:
  1. Build & Lint (TypeScript check + ESLint + Next.js build)
  2. Deploy API ──────────────┐ (parallel)
  3. Deploy Frontend ─────────┤ (parallel)
  4. Post-Deploy Verification ┘ (after both complete)
     - API health check (/api/debug/ping → 200)
     - Horoscope data check (/api/horoscope?sign=aries → success: true)
     - OG image check (/api/og/aries → 200)
     - Sign page check (www.gettodayshoroscope.com/horoscope/aries → 200)

On pull request:
  1. Build & Lint only (no deploy)
```

### Frontend Build Process

The frontend project uses `scripts/frontend-build.sh`:
1. Moves `src/app/api/` and `src/middleware.ts` to temp backup
2. Runs `next build` (API routes are proxied via Vercel rewrites, not bundled)
3. Restores API routes and middleware

---

## 8. Redis Cache

### Key Structure

```
horoscope-prod:horoscope:date=2026-04-01&sign=aries&type=daily
```

Cache key derivation is in `src/tools/cache/keys.ts` (canonical). Legacy `src/utils/cache-keys.ts` still used by debug routes.

**CRITICAL**: `safelyStoreInRedis` / `safelyRetrieveForUI` in `redis-helpers.ts` handle the `horoscope-prod:` namespace prefix automatically. **Never manually prepend `horoscope-prod:`** — this causes a double-prefix bug that was the root cause of the refresh route failure (fixed in PR #5).

### TTLs

| Content Type | TTL | Key Pattern |
|-------------|-----|-------------|
| Daily horoscope | 86,400s (24h) | `horoscope-prod:horoscope:date=...&sign=...&type=daily` |
| Weekly forecast | 604,800s (7d) | `horoscope-prod:horoscope:sign=...&type=weekly` |
| Subscriber data | No TTL | `subscriber:{email}`, `subscribers:{sign}` (sets) |

### Cache Flush

After changing prompts or generation logic, flush stale cache:
```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://api.gettodayshoroscope.com/api/cron/daily-horoscope
```

Or regenerate individual signs by hitting `/api/horoscope?sign=X` (generates on cache miss).

---

## 9. Common Pitfalls

> See also: canonical pattern indexes at [`docs/solutions/patterns/critical-patterns.md`](./solutions/patterns/critical-patterns.md) (P1-class) and [`docs/solutions/patterns/common-solutions.md`](./solutions/patterns/common-solutions.md) (P2/P3). The table below is the operational quick reference; the pattern files carry the full detection rules and remediation playbooks.

### Critical Patterns Index (P1)

| # | Pattern | When it bites | Source |
|---|---|---|---|
| 1 | LLM-as-judge prompt-injection (4-vector hardening) | Any verb where input prose is itself model-generated (judge, critic, scorer, RAG-with-judge). Naive delimiters are escapable; failure mode is silent quality collapse. | [`design-patterns/llm-as-judge-prompt-injection-hardening-20260425.md`](./solutions/design-patterns/llm-as-judge-prompt-injection-hardening-20260425.md) |
| 2 | generateObject production hardening (5-point pattern) | Any verb using `generateObject` on a production path. Naive wiring (one call, no retry, no fallbacks) cascades into 24h-of-500s outages because the AI SDK doesn't auto-retry, cron silently skips failures, and post-call validators can empty out without the schema noticing. | [`design-patterns/generateobject-production-hardening-20260426.md`](./solutions/design-patterns/generateobject-production-hardening-20260426.md) |
| 3 | Critique-loop hardening (4-point: BEST-of-N + symmetric defense + recency-bias placement) | Any composer wrapping generate + judge in a bounded `generate → judge → regenerate` loop. Without the 4 points, the loop systematically degrades quality on the cells it was supposed to improve (oscillating regenerations ship the worst attempt; judge-output → next-prompt is an injection chain; critique mid-prompt displaces contract attention). | [`design-patterns/critique-loop-best-of-n-hardening-20260426.md`](./solutions/design-patterns/critique-loop-best-of-n-hardening-20260426.md) |

### Top Common Solutions (P2/P3)

| # | Pattern | Severity | Source |
|---|---|---|---|
| 1 | Refactor regression — sanitized alias not propagated to every interpolation site | P2 | [`design-patterns/llm-as-judge-prompt-injection-hardening-20260425.md`](./solutions/design-patterns/llm-as-judge-prompt-injection-hardening-20260425.md) |
| 2 | Cross-family LLM-as-judge bias | P2 | [`design-patterns/llm-as-judge-prompt-injection-hardening-20260425.md`](./solutions/design-patterns/llm-as-judge-prompt-injection-hardening-20260425.md) |
| 3 | Re-baseline eval after material prompt changes | P2 | [`design-patterns/llm-as-judge-prompt-injection-hardening-20260425.md`](./solutions/design-patterns/llm-as-judge-prompt-injection-hardening-20260425.md) |
| 4 | Bounded review-loop budget exception (self-introduced regressions don't count) | P2 (process) | [`design-patterns/llm-as-judge-prompt-injection-hardening-20260425.md`](./solutions/design-patterns/llm-as-judge-prompt-injection-hardening-20260425.md) |
| 5 | Word-count whitespace edge — `''.split(/\s+/).length === 1` | P3 | [`design-patterns/generateobject-production-hardening-20260426.md`](./solutions/design-patterns/generateobject-production-hardening-20260426.md) |
| 6 | Test fixture silently fires telemetry warn on every passing test | P3 | [`design-patterns/generateobject-production-hardening-20260426.md`](./solutions/design-patterns/generateobject-production-hardening-20260426.md) |
| 7 | Schema shape introspection in tests is Zod-version-coupled | P3 | [`design-patterns/generateobject-production-hardening-20260426.md`](./solutions/design-patterns/generateobject-production-hardening-20260426.md) |
| 8 | Chokepoint comment is a lie when a legacy direct-import remains | P2 (docs truth) | [`design-patterns/generateobject-production-hardening-20260426.md`](./solutions/design-patterns/generateobject-production-hardening-20260426.md) |
| 9 | Identical-fixture test masks BEST-of-N regression | P2 (testing) | [`design-patterns/critique-loop-best-of-n-hardening-20260426.md`](./solutions/design-patterns/critique-loop-best-of-n-hardening-20260426.md) |
| 10 | Computing a value from a comparison true by construction | P3 | [`design-patterns/critique-loop-best-of-n-hardening-20260426.md`](./solutions/design-patterns/critique-loop-best-of-n-hardening-20260426.md) |

### Operational Pitfalls

| Pitfall | Details | How to Avoid |
|---------|---------|-------------|
| **Double namespace prefix** | `safelyStoreInRedis` already adds `horoscope-prod:`. Manual prefix creates `horoscope-prod:horoscope-prod:...` | Use `safelyStoreInRedis`/`safelyRetrieveForUI` exclusively |
| **Vercel 30s timeout** | Set in vercel.json (changed from 10s in PR #48). Batch generation of 12 signs can still be tight | Generate signs individually when possible |
| **Two Vercel projects** | Frontend changes don't appear until the FRONTEND project deploys | CI/CD handles both automatically. For manual: check `.vercel/project.json` projectId |
| **OpenAI quota exhausted** | All signs return 500 when API key has no credits | Error message: `429 You exceeded your current quota`. Fix at platform.openai.com/billing |
| **Stale cache after prompt changes** | Old horoscopes persist until TTL expires | Trigger cron endpoint with CRON_SECRET, or wait 24h for natural expiry |
| **Edge runtime** | `export const runtime = 'edge'` crashes routes using OpenAI SDK | Never add edge runtime to API routes that import OpenAI |
| **node-fetch import** | `import fetch from 'node-fetch'` crashes at runtime (not in dependencies) | Next.js has built-in fetch. Never import node-fetch |
| **Frontend build excludes API** | `frontend-build.sh` removes `src/app/api/` during build | API routes are proxied via Vercel rewrites in `vercel.frontend.json` |
| **Non-www redirect** | `gettodayshoroscope.com` returns 308 → `www.gettodayshoroscope.com` | Always use `www.` in health checks and links. Use `curl -L` to follow redirects |
| **Tailwind v3 vs v4** | PostCSS uses `tailwindcss` (v3), NOT `@tailwindcss/postcss` (v4). CSS must use `@tailwind base/components/utilities` directives, NOT `@import "tailwindcss"`. V4 silently produces zero utility CSS. | Never install `@tailwindcss/postcss`. Never use `@import "tailwindcss"`, `@config`, or `@plugin` directives. |
| **@layer in globals.css** | `@layer components` and `@layer utilities` in `globals.css` may not survive CSS processing in some Next.js build configurations | Keep custom classes outside `@layer` wrappers as plain CSS. Tailwind's own `@layer` directives (`@tailwind base/components/utilities`) handle layer ordering. |
| **VideoBanner poster images** | `public/images/posters/` directory was never populated. Poster image refs cause 404s. | Use direct video `src` attribute, not conditional `<source>` rendering. Videos autoplay (muted) via IntersectionObserver. |

---

## 10. Visual Design System

### Color Palette

| Role | Day Mode | Night Mode (`[data-mode="night"]`) |
|------|----------|-----------------------------------|
| Background | `#0C0B1E` → `#06050E` gradient | `#030208` → `#010105` (deeper void) |
| Card surface | `rgba(255,255,255,0.05)` | `rgba(255,255,255,0.02)` |
| Primary text | `#F0EEFF` | `#D4CCF0` (dimmer) |
| Card border | `rgba(255,255,255,0.08)` | `rgba(138,92,246,0.12)` (violet tint) |

### Element Accent Colors

| Element | Signs | Color | Hex |
|---------|-------|-------|-----|
| Fire | Aries, Leo, Sagittarius | Amber-orange | `#F97316` |
| Earth | Taurus, Virgo, Capricorn | Lime-green | `#84CC16` |
| Air | Gemini, Libra, Aquarius | Sky-blue | `#38BDF8` |
| Water | Cancer, Scorpio, Pisces | Violet | `#A78BFA` |

Applied as 3px left border on cards.

### Typography

| Usage | Font | Weight |
|-------|------|--------|
| Sign names (cards, headings) | Playfair Display (serif) | Medium (500) |
| Body text, horoscope content | Satoshi (sans-serif) | Normal (400) |
| Labels ("Best Match", "Quote") | Satoshi | Medium (500) |
| Metadata (dates, ranges) | Satoshi | Light (300) |

### Night Mode

Activated via `data-mode="night"` on `<html>`. CSS custom properties shift:
- Background deepens
- Text dims
- Accents shift to violet
- 600ms crossfade transition on mode toggle

---

## 11. Development History

### Sprint 1 — Emergency Fix + Content Pipeline (2026-03-31)

| PR | Change | Impact |
|----|--------|--------|
| #1 | Removed edge runtime from API routes | Fixed 500 errors on all endpoints |
| #2 | Updated Next.js to 15.5.14 | Resolved CVE-2025-66478 Vercel deploy block |
| #3 | New sign personality system | 12 distinct voices, format rotation, philosopher assignment |
| #5 | Content pipeline remediation | Verified quote bank, single generator, dead code cleanup (-2,105 lines) |
| #6 | Security hardening | Removed debug endpoints, fixed CORS, secured cron, re-enabled TS |
| #7 | Frontend overhaul | Video optimization (82MB→posters), sign picker, sign pages, sitemap |
| #8-10 | Build fixes | ESLint config, TS error suppression for dead code |

### Sprint 2 — Product & Design Overhaul (2026-03-31 → 2026-04-01)

| PR | Change | Impact |
|----|--------|--------|
| #11 | 20-point remediation | Hero rewrite, element colors, night mode, card redesign, a11y, PWA, analytics, OG images, streaks, email, astro context |
| #12 | Missing dependencies | Installed @vercel/analytics and @vercel/og |
| #13 | CI/CD pipeline | GitHub Actions dual-project deploy with health checks |
| #14-15 | CI fixes | Frontend build ordering, health check URL (www redirect) |

### Sprint 3 — Visual Restoration + Hotfixes (2026-04-01)

| PR | Change | Impact |
|----|--------|--------|
| #16 | Tailwind v4 CSS syntax attempt | Broke card styling — v4 directives incompatible with v3 config |
| #17-18 | Tailwind v3 restoration | Removed @tailwindcss/postcss v4, restored @tailwind directives |
| #19 | Hotfix: @tailwind v3 directives | Final fix for CSS processing chain |
| #20 | Restore original visual design | Reverted ZodiacCard, HoroscopeDisplay, globals.css to pre-squad versions |
| #21-22 | Video autoplay restoration | Direct src attribute, IntersectionObserver play, no poster images |
| #23 | Best match font size | Reduced from text-lg to text-sm |

**Total: 23 PRs merged across 3 sprints in one session.**

### Sprint 4 — SEO P0 (2026-04-01)

| PR | Change | Impact |
|----|--------|--------|
| #27 | SEO P0 | AutoResearch-optimized homepage, 24 monthly pages, E-E-A-T author, sitemap 13→38 |
| #29 | UI polish | Button styling, quote sizing, duplicate hero removed |

### Sprint 5 — Personal Philosophy Engine (2026-04-01 → 2026-04-02)

| PR | Change | Impact |
|----|--------|--------|
| #29-32 | Philosopher roster + quote bank expansion | 50+ philosophers, 500+ verified quotes |
| #33 | Resend email integration | Email template, daily cron |
| #35 | Generation pipeline extension | Philosopher override param |
| #36 | Homepage redesign | Sign picker → philosopher grid → reading flow |
| #37 | OG quote cards + share button | Branded sharing |
| #38 | Email gate + daily email cron | Soft gate, Resend delivery |
| #39 | Public Guidance API + MCP Server v1 | JSON endpoint + 12 MCP tools |

### Sprint 6 — Daily Archive + Video Engine (2026-04-08 → 2026-04-09)

| PR | Change | Impact |
|----|--------|--------|
| #40 | Daily archive pages + voice tuning | Backfill script, archive catalog |
| #41-42 | Redis dynamic import fixes | Frontend build compatibility |
| #43 | Automated video content engine | edge-tts, Remotion pipeline |
| #44-46 | Video engine fixes + quality gate | Input validation, Telegram spot-check |

### Sprint 7 — Agent-Native Migration (2026-04-13 → 2026-04-14)

| PR | Change | Impact |
|----|--------|--------|
| #47 | Pre-render fix + disable cron | Generation fix |
| #48 | **Agent-native migration** | 16 atomic tools in `src/tools/`, 13 P0s resolved, dead code deleted |
| #49 | MCP server v2 | 12 tools exposing Philosophy Engine |
| #50 | Exhaustive handoff doc | `docs/HANDOFF.md` |
| #51 | 120 tool tests | 8 pure-function tools tested, 0.8s, zero mocks |
| #52 | MCP Apps interactive share card | Vite singlefile build, XSS hardening |
| #53 | Session close-out | Compound doc + handoff update |

**Total: 53 PRs across 7 sprints.**

### Key Lesson: Visual Changes Must Be Tested Against Original

Sprint 3 was entirely caused by Squad C's frontend changes degrading the visual design. The lesson: **always compare screenshots before/after when changing visual components**.

---

## 12. Competitive Positioning

| Competitor | Their Angle | Our Angle | Our Advantage |
|-----------|------------|-----------|---------------|
| Co-Star | Algorithmic, blunt, social features | Philosophical, warm, mentorship | Content quality + verified quotes |
| The Pattern | Psychological profiling, Jungian depth | Sign-specific philosophical voice | Simpler, more accessible, no account required |
| Sanctuary | Expert astrologers, premium subscription | AI + philosopher curation | Free tier + unique voice system |
| Chani | Inclusive, intersectional, transit-focused | Philosophical depth, daily ritual | Verified quote bank, 12 writing formats |
| Newspapers | Generic, copy-pasted across signs | Deep, sign-specific | 12 distinct voices vs 1 template |

**Whitespace:** "The thinking person's horoscope" — daily philosophical guidance grounded in real thinkers, not fortune-telling or personality profiling. No competitor occupies this intersection of philosophy + astrology + daily ritual.

---

## 13. SEO Surface

| Content Type | Pages | Monthly Search Volume | Priority |
|-------------|-------|----------------------|----------|
| Sign daily | 12 (`/horoscope/[sign]`) | ~400K combined | 0.9 |
| Home | 1 (`/`) | ~135K ("horoscope today") | 1.0 |
| Compatibility | 66 (`/compatibility/[pair]`) | ~200K combined | 0.6 |
| Weekly forecast | 12 (`/horoscope/[sign]/weekly`) | ~150K combined | 0.7 |
| Pricing | 1 (`/pricing`) | — | 0.5 |
| **Total** | **92 indexed URLs** | | |

All pages have `generateMetadata` with sign-specific titles, descriptions, OG tags, and canonical URLs.

---

## 14. Next Steps (from HANDOFF.md)

| Priority | Feature | Status |
|----------|---------|--------|
| **P0** | Extract share-card.ts into shared package | MCP server has a copy that will drift |
| **P1** | Agent definitions (daily-publisher, social-poster, onboarding-guide) | Not started |
| **P1** | More MCP Apps (philosopher picker, reading dashboard) | Not started |
| **P1** | Social accounts (TikTok, X + Ayrshare connection) | Facebook Page live |
| **P2** | P2 backlog (council rotation sign variance, spurious fetch, stale test) | Not started |
| **P2** | Delete remaining old utils (migrate last consumers) | In progress |
| **P2** | Tests for impure tools (cache:store, cache:retrieve, reading:generate) | Need mocking |
| **P3** | Birth chart basics (Big 3: Sun/Moon/Rising) | Not started |
| **P3** | Stripe integration for premium tier | Pricing page exists |
| **P3** | Reading history / personal journal | Streak exists in Zustand |

---

## 15. Quick Reference Commands

```bash
# Pull env vars from Vercel
vercel env pull .env.local

# Run locally
npm run dev

# Build
npm run build

# Run tests
npm test

# Deploy API (automatic via CI, manual if needed)
# Set projectId to API project first
vercel deploy --prod --yes

# Flush horoscope cache
curl -H "Authorization: Bearer $CRON_SECRET" \
  https://api.gettodayshoroscope.com/api/cron/daily-horoscope

# Check API health
curl https://api.gettodayshoroscope.com/api/debug/ping

# Check cache status
curl https://api.gettodayshoroscope.com/api/debug/redis

# Test a single sign
curl https://api.gettodayshoroscope.com/api/horoscope?sign=aries | python3 -m json.tool
```
