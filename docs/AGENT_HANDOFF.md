# Agent Handoff: gettodayshoroscope.com — Complete Project Knowledge Base

> **Last updated:** April 2, 2026
> **Status:** Sprint 1 (SEO P0) shipped. Sprint 2 (Personal Philosophy Engine) planned, ready to execute.
> **Live:** www.gettodayshoroscope.com | api.gettodayshoroscope.com
> **Repo:** github.com/zone17/horoscope-ai-app | Branch: `main`

---

## 1. What This Product Is

A daily AI-generated philosophical horoscope web app. Each of the 12 zodiac signs gets a distinct writing voice, a verified philosopher quote from a curated bank, and a rotating structural format. The content is grounded in Stoicism, Eastern philosophy, and scientific thinking — not fortune-telling.

**Current brand:** "A philosopher in your corner. Every morning."

**Where it's going:** A personal philosophy engine. Users pick their sign + 3-5 favorite philosophers from 50+ thinkers. AI blends those voices with the user's zodiac temperament daily. Email delivery, branded social sharing, and a public JSON API + MCP server for agent access. AI-transparent positioning — "We trained an AI on 50+ of the world's greatest philosophers."

**The moat:** Personalized philosopher selection. ChatGPT can't remember your philosophers, blend them with your sign daily, or build a relationship over time.

---

## 2. Tech Stack (Exact Versions)

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router, ISR) | 15.5.14 |
| Language | TypeScript | 5.x (`ignoreBuildErrors: true` in next.config) |
| Styling | Tailwind CSS | **3.4.19 (v3 ONLY — see pitfalls)** |
| Animation | Framer Motion | 12.5 |
| State | Zustand (persisted to localStorage) | 5.0.3 |
| Cache | Upstash Redis (REST mode) | @upstash/redis 1.34.5 |
| AI | OpenAI | SDK 4.24.1, model `gpt-4o-mini-2024-07-18` |
| OG Images | @vercel/og (Satori) | 0.11.1, edge runtime |
| Analytics | @vercel/analytics | 2.0.1 |
| UI Primitives | shadcn/ui | class-variance-authority + clsx + tailwind-merge |
| Fonts | Satoshi (body) + Playfair Display (sign names) | via next/font |
| CI/CD | GitHub Actions | `.github/workflows/deploy.yml` |
| Hosting | Vercel | Hobby plan, **10s function timeout** |
| PWA | manifest.json + service worker | Offline-capable |

---

## 3. Architecture — Two Vercel Projects (The #1 Gotcha)

The codebase deploys to TWO separate Vercel projects from ONE repo:

| Project | Domain | Serves | Build |
|---------|--------|--------|-------|
| `horoscope-ai-api` | api.gettodayshoroscope.com | API routes, cron, OG images | `next build` (standard) |
| `horoscope-ai-frontend` | www.gettodayshoroscope.com | Pages, components, assets | `scripts/frontend-build.sh` (excludes API routes) |

**The frontend build script** (`scripts/frontend-build.sh`) MOVES `src/app/api/` and `middleware.ts` out before building, then restores them. API routes are proxied via Vercel rewrites in `vercel.frontend.json`.

**CI/CD pipeline** (`.github/workflows/deploy.yml`):
```
On push to main:
  1. Build & Lint (TypeScript + ESLint + Next.js build)
  2. Deploy API (parallel)
  3. Deploy Frontend (parallel)
  4. Post-Deploy Verification (API health + OG image + sign page)

On pull request:
  1. Build & Lint only (no deploy)
```

**Vercel project IDs:**
- API: `prj_rWJqgnyvBJZOIUA2R0BvpY5wzZ5E`
- Frontend: `prj_4Sha6rIf48CT3llWeOMMnPFqLHYS`
- Team: `team_Rzq7CDbcuKfoNn4pJFUAZztO`

---

## 4. Content Generation Pipeline (The Core Product Logic)

ALL generation goes through ONE function: `src/utils/horoscope-generator.ts`. No other file should instantiate OpenAI or build prompts.

### Generation Flow

```
buildHoroscopePrompt(sign, philosopher)     ← horoscope-prompts.ts
    │
    ├── Sign personality (12 distinct voices)
    ├── Writing format (12 rotating structures, (signIndex + dayNum) % 12)
    ├── Philosopher assignment (daily rotation, (signIndex + dayOffset) % 12)
    ├── 4 verified quotes from bank (date-based rotation)
    ├── Astrological context (Mercury retrograde, moon phases) — optional
    ├── Banned word list (tapestry, journey, embrace, navigate, etc.)
    └── Bad examples for weak signs (Taurus, Libra, Sagittarius)
    │
    ▼
generateHoroscope(sign, type, options?)     ← horoscope-generator.ts
    │
    ├── OpenAI gpt-4o-mini call (max_tokens: 800 daily, 1200 monthly)
    ├── JSON response parsing
    ├── Quote validation against verified bank (prefix match)
    ├── Post-validation: replace fabricated quotes with verified ones
    ├── Best match self-exclusion filter
    └── Data normalization (lucky_number/lucky_color objects → strings)
    │
    ▼
Redis cache (horoscope-prod:horoscope:date=...&sign=...&type=daily)
```

### Philosopher Rotation

`getPhilosopherAssignment(sign, date)` in `horoscope-prompts.ts` uses `(signIndex + dayOffset) % 12`. Current rotation pool (12 active):

Alan Watts, Marcus Aurelius, Lao Tzu, Seneca, Albert Einstein, Epicurus, Friedrich Nietzsche, Plato, Richard Feynman, Aristotle, Dr. Joe Dispenza, Walter Russell

Two additional philosophers have verified quotes but are NOT in the rotation: **Jiddu Krishnamurti** and **Socrates**. Easy expansion points.

### Verified Quote Bank

`src/utils/verified-quotes.ts` — `Record<string, VerifiedQuote[]>` with 140+ quotes across 14 philosophers. Each quote has `text`, `source` (book/speech/letter with date), `author`. The prompt includes 4 quotes; the model selects one; post-validation replaces any fabricated quote.

### Sign Voice System

Each sign has a distinct personality defined in `horoscope-prompts.ts`:

| Sign | Voice | Anti-patterns |
|------|-------|--------------|
| Aries | Bold, direct coach | No "fiery phoenix", no greetings |
| Taurus | Unhurried porch friend | No "steadfast", no bull metaphors |
| Gemini | Intellectually curious | No twin/duality clichés |
| Cancer | Tender emotional intelligence | No shell/crab metaphors |
| Leo | Warm mentor with honest challenges | No flattery, no "king/queen" |
| Virgo | Precise, dry wit | No "perfectionist" clichés |
| Libra | Elegant diplomat-poet | No scales/balance metaphors |
| Scorpio | Raw psychological intensity | No "sting", no "mysterious depths" |
| Sagittarius | Philosophical campfire wanderer | No "archer", no "aim your arrow" |
| Capricorn | Understated hard-won authority | No "mountain goat" |
| Aquarius | Visionary systems thinker | No "water bearer", no "rebel" |
| Pisces | Dreamlike synesthetic fluidity | No "ocean depths", no "swimming" |

### Monthly Horoscopes (Sprint 1 Addition)

`src/utils/monthly-content.ts` defines `VALID_MONTH_SLUGS` (currently april-2026, may-2026). The generator accepts `type: 'monthly'` with `options.month` slug. Monthly prompts request 300-500 words with structured sections (opening theme, challenges, growth, closing reflection). Cached with 30-day TTL.

### Generation Extension Points for Sprint 2

The generator already accepts `GenerateHoroscopeOptions` with optional `month` field. Sprint 2 adds `philosophers?: string[]` to this interface. When provided, overrides the default rotation. Cache key includes philosopher selections for separate caching.

---

## 5. Data Model (Redis)

Redis client: `@upstash/redis` with `automaticDeserialization: false`. All values stored/retrieved as JSON strings manually via `safelyStoreInRedis`/`safelyRetrieveForUI`.

### Key Patterns

| Key | Value | TTL |
|-----|-------|-----|
| `horoscope-prod:horoscope-prod:horoscope:date={YYYY-MM-DD}&sign={sign}&type=daily` | HoroscopeData JSON | 24h |
| `horoscope-prod:horoscope-prod:horoscope:sign={sign}&type=monthly&month={slug}` | HoroscopeData JSON | 30d |
| `subscriber:{email}` | Hash: `{ sign, subscribedAt }` | None |
| `subscribers:{sign}` | Redis Set of email strings | None |

**CRITICAL — Double-prefix bug:** `generateCacheKey` builds `horoscope-prod:horoscope:...`, then `safelyStoreInRedis` prepends `horoscope-prod:` again. The result is `horoscope-prod:horoscope-prod:horoscope:...`. This is self-consistent (reads and writes go through the same path). **Do NOT try to fix this** — it works. Use `safelyStoreInRedis`/`safelyRetrieveForUI` exclusively.

### HoroscopeData Shape

```typescript
{
  sign: string;
  type: string;        // 'daily' | 'monthly'
  date: string;
  message: string;
  best_match: string;
  inspirational_quote: string;
  quote_author: string;
  peaceful_thought: string;
  lucky_number?: string;
  lucky_color?: string;
  mood?: string;
  compatibility?: string;
}
```

---

## 6. API Routes

| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| `/api/horoscope?sign=X&type=daily` | GET | Public | Main endpoint — cache check → generate → return |
| `/api/cron/daily-horoscope` | GET | `CRON_SECRET` | Batch generate all 12 signs (daily cron) |
| `/api/horoscope/refresh` | GET | `CRON_SECRET` | Force regenerate individual signs |
| `/api/og/[sign]` | GET | Public | Dynamic OG image (1200x630, edge runtime) |
| `/api/og/[sign]/quote` | GET | Public | **Sprint 2:** Dynamic OG quote card with actual quote text |
| `/api/subscribe` | POST | Public | Email capture → Redis |
| `/api/unsubscribe` | GET | Public | **Sprint 2:** One-click unsubscribe |
| `/api/guidance` | GET | Public | **Sprint 2:** Agent-facing JSON API for philosophical guidance |
| `/api/debug/ping` | GET | Public | Health check |
| `/api/debug/redis` | GET | Public | Cache inspection |
| `/api/analytics/vitals` | POST | Public | Web vitals tracking |

Response envelope for `/api/horoscope`:
```json
{
  "success": true,
  "cached": boolean,
  "data": HoroscopeData
}
```

---

## 7. Frontend Pages

| Page | Route | Rendering | Notes |
|------|-------|-----------|-------|
| Home | `/` | ISR (1h) | **Sprint 2 redesign:** Sign picker → philosopher grid → reading |
| Sign page | `/horoscope/[sign]` | ISR (1h) | Full reading, OG tags, share, email capture. Ungated for SEO |
| Monthly | `/horoscope/[sign]/monthly/[monthYear]` | ISR (24h) | 24 pages (12 signs × 2 months). Article + BreadcrumbList schema |
| About author | `/about/author` | ISR (24h) | Elena Vasquez persona. **Sprint 2:** De-emphasize on homepage, keep page |
| Pricing | `/pricing` | Static | Scaffolding only, "Coming Soon" badge |
| Sitemap | `/sitemap.xml` | Dynamic | 38 URLs (home + 12 signs + 24 monthly + 1 about) |

### Current Homepage Structure (Pre-Sprint 2)

```
page.tsx
├── Header (fixed, 64px height)
├── HeroIntro (server component — H1 + intro copy + "Read your sign" CTA)
├── HoroscopeDisplay (client component — fetches all 12 signs, renders card grid)
├── FAQSection (server component wrapping FAQAccordion client component)
└── Footer
```

### Sprint 2 Homepage Target

```
page.tsx
├── Header
├── HeroIntro (updated — AI-transparent copy)
├── HomeFlow (client component — orchestrates step flow)
│   ├── SignStep (12 sign buttons)
│   ├── PhilosopherStep (categorized grid with live preview)
│   ├── EmailGate (soft gate — preview + email input)
│   └── ReadingDisplay (personalized reading + share button)
├── FAQSection
└── Footer
```

---

## 8. State Management (Zustand)

`src/hooks/useMode.ts` — persisted to localStorage key `horoscope-mode-storage`:

| Field | Type | Purpose |
|-------|------|---------|
| `mode` | `'day' \| 'night'` | Theme + content mode (message vs peaceful_thought) |
| `userSign` | `string \| null` | Persisted sign preference |
| `streakCount` | `number` | Consecutive days read |
| `lastReadDate` | `string \| null` | ISO date for streak calc |

### Sprint 2 Additions

| Field | Type | Purpose |
|-------|------|---------|
| `selectedPhilosophers` | `string[]` | User's chosen 3-5 philosophers |
| `email` | `string \| null` | Captured email (gate bypass for return visits) |

---

## 9. Shared Constants (Single Source of Truth)

| File | Exports | Used By |
|------|---------|---------|
| `src/constants/zodiac.ts` | `VALID_SIGNS`, `SIGN_META`, `ValidSign`, `isValidSign()` | All pages, sitemap, generator |
| `src/constants/faqs.ts` | `FAQS`, `FAQ` type | FAQSection, SchemaMarkupServer |
| `src/constants/author.ts` | `AUTHOR`, `Author` type | About page, monthly pages |
| `src/constants/philosophers.ts` | **Sprint 2:** `PHILOSOPHERS`, `TRADITIONS`, helpers | Homepage, generator, email |

---

## 10. SEO Infrastructure (Shipped in Sprint 1)

### What's Live

- **Sitemap:** 38 URLs submitted to Google Search Console (April 1, 2026). 38 pages discovered.
- **Schema markup:** WebSite, Organization, Service, FAQPage (4 Q&As), BreadcrumbList, Article, ItemList — all via `SchemaMarkupServer.tsx`
- **OG images:** Dynamic per-sign at `/api/og/[sign]` (sign symbol + element gradient)
- **Meta tags:** Sign-specific title, description, OG tags, Twitter cards on every page
- **Canonical URLs:** Set on all pages
- **ISR:** All content pages use Incremental Static Regeneration

### SEO Strategy

- **DR 0, zero organic traffic** — sitemap just submitted, indexing in progress
- **Target keywords:** `[sign] horoscope [month] [year]` (near-zero competition)
- **Monthly pages** are the long-tail SEO engine (24 pages now, expand monthly)
- **Daily archive pages** (`/[sign]/daily/[date]/`) planned for Sprint 3 — 4,380 pages/year
- **Author persona** (Elena Vasquez) at `/about/author` for E-E-A-T compliance

### AutoResearch Results

AutoResearch (autonomous experiment loop) ran 10 experiments on SEO content:
- Score: 45.5 → 68.5 (+50.5%)
- Cost: $0.27 total (~$0.03/experiment)
- Optimized: H1, intro copy, meta description, FAQ content, schema types
- State files: `.autoresearch/` directory (seo-content.json, experiments.jsonl, state.json)

---

## 11. Design System

### Color Palette

| Role | Day Mode | Night Mode |
|------|----------|-----------|
| Background | `#0C0B1E` → `#06050E` | `#030208` → `#010105` |
| Card surface | `rgba(255,255,255,0.05)` | `rgba(255,255,255,0.02)` |
| Primary text | `#F0EEFF` | `#D4CCF0` |
| Card border | `rgba(255,255,255,0.08)` | `rgba(138,92,246,0.12)` |

### Element Accent Colors

| Element | Signs | Hex |
|---------|-------|-----|
| Fire | Aries, Leo, Sagittarius | `#F97316` |
| Earth | Taurus, Virgo, Capricorn | `#84CC16` |
| Air | Gemini, Libra, Aquarius | `#38BDF8` |
| Water | Cancer, Scorpio, Pisces | `#A78BFA` |

### Glassmorphic Pattern

```
bg-white/5 backdrop-blur-md border border-white/10 rounded-xl
hover:bg-white/8 transition-all duration-300
```

### Typography

| Usage | Font | Weight |
|-------|------|--------|
| Sign names, headings | Playfair Display | 400-500 |
| Body, horoscope content | Satoshi | 300-400 |
| Labels | Satoshi | 500 |

### Night Mode

Activated via `data-mode="night"` on `<html>`. Zustand syncs to `document.documentElement.dataset.mode`. 600ms crossfade transition.

---

## 12. Environment Variables

### Required (Both Vercel Projects)

| Variable | Purpose |
|----------|---------|
| `OPENAI_API_KEY` | OpenAI API access |
| `UPSTASH_REDIS_REST_URL` | Redis connection |
| `UPSTASH_REDIS_REST_TOKEN` | Redis auth |
| `CRON_SECRET` | Auth for cron + refresh endpoints |

### Sprint 2 Additions

| Variable | Purpose | Status |
|----------|---------|--------|
| `RESEND_API_KEY` | Email delivery via Resend | Needs Resend + Vercel integration install |
| `UNSUBSCRIBE_SECRET` | HMAC token for unsubscribe links | Agent generates via `openssl rand -hex 32` |

### Feature Flags

| Flag | Default | Purpose |
|------|---------|---------|
| `FEATURE_FLAG_USE_REDIS_CACHE` | `true` | Redis caching |
| `FEATURE_FLAG_USE_SCHEMA_MARKUP` | `true` | JSON-LD structured data |
| `FEATURE_FLAG_USE_TIMEZONE_CONTENT` | `true` | Timezone-aware generation |
| `FEATURE_FLAG_USE_ENHANCED_SCHEMA_MARKUP` | `false` | Extended schema types |

### CI/CD Secrets (GitHub)

| Secret | Value |
|--------|-------|
| `VERCEL_TOKEN` | Vercel API token |
| `VERCEL_ORG_ID` | `team_Rzq7CDbcuKfoNn4pJFUAZztO` |
| `VERCEL_API_PROJECT_ID` | `prj_rWJqgnyvBJZOIUA2R0BvpY5wzZ5E` |
| `VERCEL_FRONTEND_PROJECT_ID` | `prj_4Sha6rIf48CT3llWeOMMnPFqLHYS` |

---

## 13. Critical Pitfalls (Will Burn You)

| # | Pitfall | How to Avoid |
|---|---------|-------------|
| 1 | **Tailwind v3 ONLY** | `postcss.config.mjs` uses `tailwindcss` (v3). CSS must use `@tailwind base/components/utilities`. NEVER use `@import "tailwindcss"` (v4 syntax). V4 silently produces zero CSS. |
| 2 | **Never manually prepend `horoscope-prod:`** | `safelyStoreInRedis`/`safelyRetrieveForUI` handle namespacing. Double-prefix = silent data loss. |
| 3 | **Vercel 10s timeout** | Hobby plan hard limit. Never batch-generate all signs or batch-send emails in one function. |
| 4 | **Edge runtime** | NEVER add `export const runtime = 'edge'` to routes using OpenAI SDK. It crashes. OG routes are edge (fine — they don't use OpenAI). |
| 5 | **node-fetch** | NEVER import it. Not in dependencies. Next.js has built-in fetch. |
| 6 | **Two Vercel projects** | API routes only deploy to API project. Frontend build EXCLUDES API routes. |
| 7 | **Non-www redirect** | `gettodayshoroscope.com` 308s to `www.`. Always use `www.` in URLs. |
| 8 | **Visual regression** | Sprint 3 of Session 1 required 7 hotfix PRs. ALWAYS screenshot before/after UI changes. Revert to git history rather than forward-fixing. |
| 9 | **Single generator** | ALL generation through `horoscope-generator.ts`. Never create a second OpenAI client. |
| 10 | **Redis manual serialization** | `automaticDeserialization: false`. All reads/writes go through safe helpers. |
| 11 | **`ignoreBuildErrors: true`** | TypeScript errors don't fail the build. Pre-existing type errors exist. Don't introduce new ones. |

---

## 14. Sprint History

### Sprint 1: SEO P0 (April 1, 2026) — COMPLETE

**PRs shipped:** #27 (SEO P0), #29 (UI polish)
**What was built:**
- AutoResearch-optimized homepage content (H1, intro, FAQ, schema)
- 24 programmatic monthly horoscope pages
- E-E-A-T author persona (Elena Vasquez) with About page
- Sitemap expanded from 13 → 38 URLs
- BreadcrumbList schema on all pages
- Shared constants (`zodiac.ts`, `faqs.ts`) eliminating 6+ file duplication
- FAQSection split: server component (JSON-LD crawlable) + client accordion
- Duplicate hero removed, button styling fixed, quote text sized

**CE Review:** 9-agent review completed. All P1/P2 findings addressed before merge.
**Sitemap:** Submitted to Google Search Console. 38 pages discovered.
**Elite Product Review:** Scored 5.8/10. Top findings: competing CTAs (4/10), zero trust signals (3/10), client-rendered cards (loading spinner before content).

### Sprint 2: Personal Philosophy Engine — PLANNED

**Plan:** `docs/plans/2026-04-01-002-feat-philosophy-engine-plan.md`
**Requirements:** `docs/brainstorms/2026-04-01-homepage-redesign-email-sharing-requirements.md`
**Squad handoff:** `docs/plans/2026-04-01-sprint2-squad-handoff.md`

**13 units across 5 phases:**

| Phase | What | Units |
|-------|------|-------|
| 1. Content | 50+ philosophers, 500+ verified quotes | 1-2 |
| 2. Homepage | Sign picker → philosopher grid (live preview) → reading | 3-6 |
| 3. Email | Soft gate, Resend delivery, daily cron, unsubscribe | 7-9 |
| 4. Sharing | Branded OG quote cards, Web Share API | 10-11 |
| 5. Agent API | `/api/guidance` JSON endpoint + MCP server | 12-13 |

**3 squads with zero file overlap:**

| Squad | Focus | Units |
|-------|-------|-------|
| A (Content + Backend) | Philosophers, quotes, generation, email, API | 1, 2, 4, 7, 9, 12 |
| B (Frontend) | Zustand, homepage flow, reading, gate, share | 3, 5, 6, 8, 11 |
| C (Sharing + Agent) | OG quote cards, MCP server | 10, 13 |

### Sprint 3: Growth Engine — FUTURE

- Auto-generated video content (Remotion) → TikTok, Reels, X, Facebook
- Daily archive pages (`/[sign]/daily/[date]/`) — 4,380 pages/year for long-tail SEO
- Reading history / personal philosophical journal
- Scheduling + analytics for social posting

---

## 15. Key Decisions Made

| Decision | Rationale |
|----------|-----------|
| **AI-transparent positioning** | Honest about AI. "We trained an AI on philosophers" is a feature, not a secret. Avoids trust erosion. |
| **Soft email gate** | Show preview before requiring email. Users taste value first → higher conversion. |
| **50+ philosophers, all free** | Go wide on roster. No paywall. Build audience first, monetize later. |
| **Live preview on philosopher tap** | Uses pre-generated sample quotes (instant, free) not OpenAI calls (slow, expensive). |
| **Resend free tier** | $0, 100 emails/day. Simplest API. Built for Vercel. Upgrade to $20/mo at 100+ subscribers. |
| **Full reading in email** | Email IS the product for subscribers. Daily inbox habit > site clicks. |
| **Branded quote cards for sharing** | Philosopher quote is the most shareable atomic unit. Beautiful card drives curiosity. |
| **Public API + MCP server** | Dual-audience: humans (website + email) and agents (API + MCP). Philosophical grounding for both. |
| **Categorized philosopher grid** | 6 traditions: Stoicism, Eastern, Science, Poetry, Spiritual, Modern. With one-line descriptions. |
| **Inline scroll-reveal for flow** | No page transitions. Steps expand inline with Framer Motion. Reading unfolds. |

---

## 16. File Reference (Complete)

### Content Pipeline
| File | Purpose |
|------|---------|
| `src/utils/horoscope-generator.ts` | SINGLE generation function. OpenAI call + validation |
| `src/utils/horoscope-prompts.ts` | Sign personalities, format rotation, philosopher assignment, banned words |
| `src/utils/verified-quotes.ts` | 140+ quotes with sources (expanding to 500+ in Sprint 2) |
| `src/utils/astro-context.ts` | Mercury retrograde dates, moon phases |
| `src/utils/monthly-content.ts` | Monthly metadata, slug validation, prompt additions |

### Constants
| File | Purpose |
|------|---------|
| `src/constants/zodiac.ts` | VALID_SIGNS, SIGN_META, isValidSign — single source |
| `src/constants/faqs.ts` | FAQ content shared by FAQSection + SchemaMarkupServer |
| `src/constants/author.ts` | Elena Vasquez persona data |
| `src/constants/index.ts` | Feature flags, ZODIAC_SIGNS (title case — legacy) |

### Pages
| File | Purpose |
|------|---------|
| `src/app/page.tsx` | Homepage — HeroIntro + HoroscopeDisplay + FAQSection |
| `src/app/horoscope/[sign]/page.tsx` | Sign detail page (ISR, OG tags) |
| `src/app/horoscope/[sign]/monthly/[monthYear]/page.tsx` | Monthly horoscope |
| `src/app/horoscope/[sign]/SignPageClient.tsx` | Client component — fetch, share |
| `src/app/about/author/page.tsx` | Author persona page |
| `src/app/sitemap.ts` | 38-URL sitemap |
| `src/app/robots.ts` | Robots.txt with sitemap reference |
| `src/app/layout.tsx` | Root layout — metadata, fonts, schema, analytics |

### Components
| File | Purpose |
|------|---------|
| `src/components/zodiac/HoroscopeDisplay.tsx` | Client: 12-card grid (removed hero, replaced by HeroIntro) |
| `src/components/zodiac/ZodiacCard.tsx` | Client: card + modal expansion |
| `src/components/zodiac/SignPicker.tsx` | Client: horizontal sign selector |
| `src/components/zodiac/EmailCapture.tsx` | Client: email form → /api/subscribe |
| `src/components/seo/HeroIntro.tsx` | Server: H1 + intro copy + CTA |
| `src/components/seo/FAQSection.tsx` | Server: FAQ schema + accordion wrapper |
| `src/components/seo/FAQAccordion.tsx` | Client: accordion toggle |
| `src/components/seo/SchemaMarkupServer.tsx` | Server: JSON-LD schemas |
| `src/components/layout/Header.tsx` | Client: fixed header, date, mode toggle |
| `src/components/ModeToggle.tsx` | Client: day/night switch |
| `src/components/VideoBanner.tsx` | Client: lazy video, intersection observer |

### API Routes
| File | Purpose |
|------|---------|
| `src/app/api/horoscope/route.ts` | GET: fetch/generate horoscope |
| `src/app/api/cron/daily-horoscope/route.ts` | GET: daily batch generation (CRON_SECRET) |
| `src/app/api/horoscope/refresh/route.ts` | GET: force regenerate (CRON_SECRET) |
| `src/app/api/subscribe/route.ts` | POST: email capture → Redis |
| `src/app/api/og/[sign]/route.tsx` | GET: dynamic OG image (edge) |
| `src/app/api/debug/ping/route.ts` | GET: health check |
| `src/app/api/debug/redis/route.ts` | GET: cache inspection |

### Utils
| File | Purpose |
|------|---------|
| `src/utils/redis.ts` | Upstash client singleton |
| `src/utils/redis-helpers.ts` | safelyStoreInRedis, safelyRetrieveForUI |
| `src/utils/cache-keys.ts` | Key builders for Redis |
| `src/utils/cache.ts` | withCache wrapper |
| `src/utils/horoscope-service.ts` | Client-side fetch helpers |
| `src/utils/feature-flags.ts` | isFeatureEnabled helper |
| `src/utils/timezone-utils.ts` | Timezone detection |
| `src/lib/utils.ts` | capitalize, cn, getColorFromString, formatDate |

### Config
| File | Purpose |
|------|---------|
| `next.config.js` | API project config (ignoreBuildErrors) |
| `next.config.frontend.js` | Frontend config (standalone, rewrites) |
| `tailwind.config.js` | Satoshi + Playfair Display fonts |
| `postcss.config.mjs` | Tailwind v3 + autoprefixer |
| `vercel.json` | API project — cron, function config |
| `vercel.frontend.json` | Frontend — build script, rewrites |
| `.github/workflows/deploy.yml` | CI/CD pipeline |
| `scripts/frontend-build.sh` | Frontend build (excludes API routes) |

---

## 17. How to Work on This Project

### Local Development

```bash
cd ~/Desktop/horoscope-ai-app
vercel env pull .env.local    # Pull env vars from Vercel
npm run dev                    # Start dev server
```

### Useful Commands

```bash
# Check API health
curl https://api.gettodayshoroscope.com/api/debug/ping

# Test a sign
curl https://api.gettodayshoroscope.com/api/horoscope?sign=aries | python3 -m json.tool

# Flush cache (regenerate all signs)
curl -H "Authorization: Bearer $CRON_SECRET" https://api.gettodayshoroscope.com/api/cron/daily-horoscope

# Run tests
npm test
```

### Branching

```bash
# Create a new branch
git fetch origin && git checkout -b feat/{squad}/{unit}-{slug} origin/main

# Push and create PR
git push -u origin HEAD
gh pr create --title "feat: ..." --body "..."

# Merge (after CI + CE Review)
gh pr merge --squash --auto
```

### Enforcement Hooks

Global hooks at `~/.claude/hooks/enforcement/` enforce:
- No commits/pushes on `main`
- `/watch-ci` required after every push/PR/merge
- `/ce:review` required before merge (bypass with `--no-review` for trivial changes)
- Squad mismatch detection on commits

---

## 18. What to Build Next

**Immediate: Sprint 2** — Execute the plan at `docs/plans/2026-04-01-002-feat-philosophy-engine-plan.md` using the squad assignments in `docs/plans/2026-04-01-sprint2-squad-handoff.md`.

**Start with Phase 1 (Units 1-2):** Expand the philosopher roster and quote bank. This has zero dependencies and unblocks everything else. Squad A owns this.

**Then Phase 2 (Units 3-6):** Homepage redesign. Squads A and B work in parallel — A extends the generator, B builds the frontend flow.

**Prerequisites before Phase 3:** Install Resend + Vercel integration from Vercel dashboard (one click, auto-configures API key).

**The vision:** A personal philosophy engine that serves humans and agents. Users build a council of their favorite thinkers. AI blends those voices with their sign daily. Email, sharing, and an MCP server create three distribution channels from one content engine. Auto-generated video content (Sprint 3) feeds TikTok, Reels, X, and Facebook as a background marketing engine.
