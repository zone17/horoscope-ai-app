# Project Context: gettodayshoroscope.com

> **Last updated**: 2026-04-01
> **Status**: Production — 23 PRs shipped, CI/CD active, visual design restored

---

## 1. What This Is

A daily AI-generated horoscope web app that delivers **philosophical guidance** (not fortune-telling) personalized by zodiac sign. Each of the 12 signs gets a distinct writing voice, a verified philosopher quote from a curated bank of 140+ sourced quotes, and a rotating structural format that changes daily. Astrological context (Mercury retrograde, moon phases) is injected when relevant.

**Live URLs:**
| Surface | URL | Vercel Project |
|---------|-----|---------------|
| Frontend | https://www.gettodayshoroscope.com | `horoscope-ai-frontend` (`prj_4Sha6rIf48CT3llWeOMMnPFqLHYS`) |
| API | https://api.gettodayshoroscope.com | `horoscope-ai-api` (`prj_rWJqgnyvBJZOIUA2R0BvpY5wzZ5E`) |
| Repo | https://github.com/zone17/horoscope-ai-app | — |

**Brand positioning:** "A philosopher in your corner. Every morning." — daily philosophy, personalized by the lens you were born with.

**Team ID:** `team_Rzq7CDbcuKfoNn4pJFUAZztO`

---

## 2. Tech Stack

| Layer | Technology | Version/Details |
|-------|-----------|-----------------|
| Framework | Next.js | 15.5.14, App Router, ISR (`revalidate: 3600`) |
| Language | TypeScript | `ignoreBuildErrors: true` in next.config.js (one dead function in schema-generator.ts) |
| Styling | Tailwind CSS | Dark cosmic theme, glassmorphism cards, element-based accent colors |
| Animation | Framer Motion | Conditional on `prefers-reduced-motion` |
| State | Zustand | Persisted to localStorage: `userSign`, `mode` (day/night), `streakCount`, `lastReadDate` |
| Cache | Upstash Redis | TTL-based caching, namespace `horoscope-prod:` |
| AI | OpenAI | `gpt-4o-mini-2024-07-18`, ~800 max tokens per horoscope |
| OG Images | @vercel/og (Satori) | Dynamic per-sign images with element gradients |
| Analytics | @vercel/analytics | Custom events: sign_selected, reading_opened, share_tapped, etc. |
| Fonts | Satoshi (body) + Playfair Display (sign names) | Loaded via next/font, Geist removed |
| CI/CD | GitHub Actions | Dual Vercel project deploy on merge to main |
| Hosting | Vercel | Hobby plan, 10s function timeout, 2 projects |
| PWA | manifest.json + service worker | Offline-capable, installable |

---

## 3. Architecture

### System Diagram

```
                    ┌──────────────────────────────────────────┐
                    │           GitHub Actions CI/CD           │
                    │  (build → deploy API + frontend → verify)│
                    └──────────┬──────────────┬────────────────┘
                               │              │
                    ┌──────────▼──────┐  ┌────▼───────────────┐
                    │   Frontend      │  │   API              │
                    │   Vercel Proj   │  │   Vercel Proj      │
                    │                 │  │                     │
  User ──────────>  │ www.gettodaysh  │  │ api.gettodaysh     │
                    │ oroscope.com    │  │ oroscope.com       │
                    │                 │  │                     │
                    │ Pages:          │  │ Routes:             │
                    │  /              │  │  /api/horoscope     │
                    │  /horoscope/*   │  │  /api/cron/daily    │
                    │  /compatibility │  │  /api/og/[sign]     │
                    │  /pricing       │  │  /api/subscribe     │
                    │                 │  │  /api/horoscope/    │
                    │ Rewrites:       │  │      refresh        │
                    │  /api/* → API   │  │  /api/debug/ping    │
                    └─────────────────┘  │  /api/debug/redis   │
                                         └──────────┬──────────┘
                                                    │
                                         ┌──────────▼──────────┐
                                         │   Upstash Redis     │
                                         │  (horoscope-prod)   │
                                         └──────────┬──────────┘
                                                    │
                                         ┌──────────▼──────────┐
                                         │   OpenAI API        │
                                         │  (gpt-4o-mini)      │
                                         └─────────────────────┘
```

### Data Flow

1. **Daily cron** (`/api/cron/daily-horoscope`) runs at midnight UTC → generates all 12 signs via `horoscope-generator.ts` → caches in Redis with 24h TTL
2. **On-demand** (`/api/horoscope?sign=aries`) checks Redis first → on cache miss, generates one sign → caches → returns
3. **Frontend** (`horoscope-service.ts`) fetches from API → renders cards with sign-specific voice
4. **Sign pages** (`/horoscope/[sign]`) use ISR with 1-hour revalidation, include OG meta tags pointing to `/api/og/[sign]`
5. **Compatibility pages** (`/compatibility/[pair]`) are statically generated at build time for all 66 combinations

### Two Vercel Projects — Critical Detail

The codebase deploys to TWO Vercel projects from one repo. This is the #1 source of confusion:

| Project | Domain | Serves | Build Command |
|---------|--------|--------|---------------|
| `horoscope-ai-api` | api.gettodayshoroscope.com | API routes, cron, OG images | `next build` (standard) |
| `horoscope-ai-frontend` | www.gettodayshoroscope.com | Pages, components, assets | `frontend-build.sh` (excludes API routes) |

The **GitHub Actions CI/CD pipeline** (`.github/workflows/deploy.yml`) handles both deployments automatically on merge to main. You should not need to deploy manually.

For manual deployment:
1. Update `.vercel/project.json` with the target project's `projectId`
2. Run `vercel deploy --prod --yes`
3. Remember to restore the original `projectId` after

---

## 4. Content System — The Differentiator

This is what makes the product unique. Understanding the content pipeline is essential.

### Generation Pipeline

```
buildHoroscopePrompt(sign, philosopher)     ← horoscope-prompts.ts
    │
    ├── Sign personality (12 distinct voices)
    ├── Writing format (12 rotating structures)
    ├── Philosopher assignment (daily rotation)
    ├── Verified quotes from bank (4 options per prompt)
    ├── Astrological context (retrograde, moon phase)
    ├── Banned word list
    └── Bad examples (for weak signs: Taurus, Libra, Sagittarius)
    │
    ▼
generateHoroscope(sign, type)               ← horoscope-generator.ts
    │
    ├── OpenAI gpt-4o-mini call
    ├── JSON response parsing
    ├── Quote validation against verified bank
    ├── Post-validation: replace fabricated quotes with verified ones
    ├── Best match self-exclusion filter
    └── Data normalization (lucky_number/lucky_color objects → strings)
    │
    ▼
Redis cache (horoscope-prod:horoscope:date=...&sign=...&type=daily)
```

### Sign Voice System (`src/utils/horoscope-prompts.ts`)

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

**Philosopher roster:** Alan Watts, Marcus Aurelius, Lao Tzu, Seneca, Albert Einstein, Epicurus, Friedrich Nietzsche, Plato, Richard Feynman, Aristotle, Dr. Joe Dispenza, Walter Russell, Socrates, Jiddu Krishnamurti

**Rotation:** `getPhilosopherAssignment(sign, date)` uses `(signIndex + dayOffset) % 12` to ensure each sign gets a unique philosopher every day, and the pairing shifts daily.

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

### Content Pipeline (the core product logic)

| File | Purpose | Owner |
|------|---------|-------|
| `src/utils/horoscope-prompts.ts` | Sign personalities, writing formats, philosopher rotation, banned words, prompt builder | Content |
| `src/utils/verified-quotes.ts` | 140+ verified quotes with sources, `getQuotesForPrompt()` helper | Content |
| `src/utils/horoscope-generator.ts` | **Single** generation function — ALL code paths use this. OpenAI call + validation + normalization | Content |
| `src/utils/astro-context.ts` | Mercury retrograde dates, moon phase calculator, `getAstroContext(date)` | Content |

### API Routes

| Route | Purpose | Auth | Timeout Risk |
|-------|---------|------|-------------|
| `GET /api/horoscope?sign=X&type=daily` | Main endpoint — cache check → generate → return | Public | ~3s per sign on cache miss |
| `GET /api/cron/daily-horoscope` | Batch generate all 12 signs | `CRON_SECRET` required | YES — 12 sequential calls, may exceed 10s |
| `GET /api/horoscope/refresh` | Force regenerate individual signs + verify cache | `CRON_SECRET` required | ~3s per sign |
| `GET /api/og/[sign]` | Dynamic OG image (1200x630, element gradient) | Public | <1s |
| `POST /api/subscribe` | Email capture → Redis (`subscriber:{email}` hash + `subscribers:{sign}` set) | Public | <1s |
| `GET /api/debug/ping` | Health check (returns `{ success: true }`) | Public | <1s |
| `GET /api/debug/redis` | Cache inspection (lists which signs are cached) | Public | <1s |
| `GET /api/openai-test` | OpenAI connectivity test | Public | ~2s |
| `GET /api/openai-enhanced` | Enhanced OpenAI test | Public | ~3s |

### Frontend Pages

| Page | Route | Rendering | Notes |
|------|-------|-----------|-------|
| Home | `/` | ISR (1h) | Hero + sign picker + 12-card grid |
| Sign page | `/horoscope/[sign]` | ISR (1h) | Full reading, OG tags, share button, push prompt, email capture |
| Weekly forecast | `/horoscope/[sign]/weekly` | ISR (24h) | Templated weekly content |
| Compatibility | `/compatibility/[pair]` | ISR (24h) | 66 pages, element-based compatibility ratings |
| Pricing | `/pricing` | Static | Free vs Premium comparison, "Coming Soon" badge |
| Sitemap | `/sitemap.xml` | Dynamic | 92 URLs (1 home + 12 sign + 12 weekly + 66 compatibility + 1 pricing) |

### Frontend Components

| Component | File | Purpose |
|-----------|------|---------|
| ZodiacCard | `src/components/zodiac/ZodiacCard.tsx` | Main card — element accent colors, auto-height, 3-sentence preview, inline expand, a11y (focus trap, keyboard, reduced motion) |
| HoroscopeDisplay | `src/components/zodiac/HoroscopeDisplay.tsx` | Grid layout, hero section ("Your sign is not a prediction"), featured card for user's sign |
| SignPicker | `src/components/zodiac/SignPicker.tsx` | Horizontal sign selector — navigates to `/horoscope/[sign]` on click, persists via Zustand |
| SignPageClient | `src/app/horoscope/[sign]/SignPageClient.tsx` | Client component for sign pages — data fetch, share button (Web Share API + clipboard fallback) |
| EmailCapture | `src/components/zodiac/EmailCapture.tsx` | Email input + sign — posts to `/api/subscribe` |
| PushPrompt | `src/components/zodiac/PushPrompt.tsx` | Push notification permission request — shows 3s after sign page load |
| ModeToggle | `src/components/ModeToggle.tsx` | Day/Night mode switch — 44px touch target, syncs to `document.documentElement.dataset.mode` |
| VideoBanner | `src/components/VideoBanner.tsx` | Lazy video loading — poster image default, intersection observer, video on hover |
| Header | `src/components/layout/Header.tsx` | Fixed header with logo, date, mode toggle |
| ServiceWorkerRegistration | `src/components/ServiceWorkerRegistration.tsx` | Registers `public/sw.js` on mount |
| SchemaMarkup | `src/components/seo/SchemaMarkup.tsx` | JSON-LD structured data (WebSite, Organization, Service, ItemList, FAQ) |

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
| `next.config.js` | Main Next.js config (API project build) — `ignoreBuildErrors: true`, `ignoreDuringBuilds: true` |
| `next.config.frontend.js` | Frontend-specific config — `output: 'standalone'`, API rewrites |
| `vercel.json` | API project — cron schedule, function config (`maxDuration: 10`, `memory: 1024`) |
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
| `OPENAI_API_KEY` | OpenAI API access | `horoscope-generator.ts` |
| `UPSTASH_REDIS_REST_URL` | Redis connection URL | `redis.ts` |
| `UPSTASH_REDIS_REST_TOKEN` | Redis auth token | `redis.ts` |
| `CRON_SECRET` | Auth for cron + refresh endpoints | `cron/daily-horoscope`, `horoscope/refresh` |

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

Generated by `src/utils/cache-keys.ts` via `horoscopeKeys.daily(sign, date)`.

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

| Pitfall | Details | How to Avoid |
|---------|---------|-------------|
| **Double namespace prefix** | `safelyStoreInRedis` already adds `horoscope-prod:`. Manual prefix creates `horoscope-prod:horoscope-prod:...` | Use `safelyStoreInRedis`/`safelyRetrieveForUI` exclusively |
| **Vercel 10s timeout** | Hobby plan hard limit. Batch generation of 12 signs exceeds it (~36s) | Generate signs individually, not batch. Cron job may timeout — individual fallback exists |
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

### Agent Summary (23 agents total)

**Wave 1 — Technical Review (10 agents):** Architect, Engineer, PM, QA, Design/UX, 5 user personas (wellness seeker, skeptic tech worker, astrology creator, older reader, philosophy student)

**Wave 2 — Expert Strategy (6 agents):** Design director, CPO, UX researcher, Content strategist, CRO specialist, Brand strategist

**Execution Squads (7 agents across 2 sprints):** 3 squads in Sprint 1 (content, security, frontend) + 4 squads in Sprint 2 (content, infra, design, SEO)

**Key consensus findings:** All P0s and P1s resolved. See `docs/solutions/workflow-issues/multi-agent-production-remediation-20260401.md` for the full pattern.

### Key Lesson: Visual Changes Must Be Tested Against Original

Sprint 3 was entirely caused by Squad C's frontend changes degrading the visual design. The lesson: **always compare screenshots before/after when changing visual components**. The original ZodiacCard + globals.css were restored from git history (commit `51d00b0`) because the squad's changes (removing videos, flattening cards, Tailwind v4 migration) collectively made the site look significantly worse despite each individual change seeming reasonable.

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

## 14. Future Roadmap

| Priority | Feature | Status | Notes |
|----------|---------|--------|-------|
| **P1** | Birth chart basics (Big 3: Sun/Moon/Rising) | Not started | Most requested by astrology enthusiasts |
| **P1** | Email sending (daily digest) | Capture built | Needs email service (Resend/SendGrid) |
| **P1** | Stripe integration for premium tier | Scaffolding built | Pricing page exists, needs payment flow |
| **P1** | Prompt tightening (integrate astro-context into prompts) | astro-context.ts created | Needs integration into buildHoroscopePrompt |
| **P2** | Reading history / journal | Streak exists | localStorage → Redis for cross-device sync |
| **P2** | Server-side rendering of hero sign | Client-side fetch | Eliminate loading spinner for return visitors |
| **P2** | Clean up remaining dead code | `schema-generator.ts` `generateSchemasOld` | Dead function with undefined var reference |
| **P3** | Mobile app (React Native / Capacitor) | PWA available | PWA covers most use cases |
| **P3** | Community features | Not started | Reflection prompts, user submissions |
| **P3** | Audio narration | Not started | 60-second voiced daily readings |
| **P3** | Ambient sound design | Not started | Optional meditative audio per mode |

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
