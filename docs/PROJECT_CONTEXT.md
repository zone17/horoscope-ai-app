# Project Context: gettodayshoroscope.com

> **Last updated**: 2026-03-31
> **Status**: Active development — production remediation + product overhaul in progress

## 1. What This Is

A daily AI-generated horoscope web app that delivers **philosophical guidance** (not fortune-telling) personalized by zodiac sign. Each sign gets a distinct writing voice, a verified philosopher quote, and a rotating format that changes daily.

**Live URLs:**
- Frontend: https://gettodayshoroscope.com (Vercel project: `horoscope-ai-frontend`)
- API: https://api.gettodayshoroscope.com (Vercel project: `horoscope-ai-api`)
- Repo: https://github.com/zone17/horoscope-ai-app

**Brand positioning:** "A philosopher in your corner. Every morning." — daily philosophy, personalized by the lens you were born with. Not a fortune teller, not a wellness app, not a prediction machine.

## 2. Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | Next.js 15.5.14 | App Router, ISR (revalidate: 3600) |
| Language | TypeScript | `ignoreBuildErrors: true` (dead code type error in schema-generator.ts) |
| Styling | Tailwind CSS + Framer Motion | Dark cosmic theme, glassmorphism cards |
| State | Zustand (persisted) | Stores userSign, mode (day/night), streak |
| Cache | Upstash Redis | TTL-based, namespace `horoscope-prod:` |
| AI | OpenAI gpt-4o-mini-2024-07-18 | ~800 max tokens per horoscope |
| Deployment | Vercel (2 projects) | Hobby plan, 10s function timeout |
| Fonts | Satoshi (primary) + Playfair Display (display) | Geist removed |

## 3. Architecture

```
┌─────────────────────┐     ┌──────────────────────┐
│  gettodayshoroscope │     │ api.gettodayshoroscope│
│      .com           │────>│        .com           │
│  (frontend project) │     │   (API project)       │
│                     │     │                       │
│  - Home page        │     │  - /api/horoscope     │
│  - /horoscope/[sign]│     │  - /api/cron/daily    │
│  - /compatibility/* │     │  - /api/horoscope/    │
│  - /pricing         │     │      refresh          │
│  - Static assets    │     │  - /api/og/[sign]     │
└─────────────────────┘     │  - /api/subscribe     │
                            │  - /api/debug/ping    │
                            │  - /api/debug/redis   │
                            └──────────┬───────────┘
                                       │
                            ┌──────────▼───────────┐
                            │   Upstash Redis      │
                            │   (horoscope-prod)   │
                            └──────────┬───────────┘
                                       │
                            ┌──────────▼───────────┐
                            │   OpenAI API         │
                            │   (gpt-4o-mini)      │
                            └──────────────────────┘
```

### Key Data Flow
1. **Cron** (`/api/cron/daily-horoscope`) runs at midnight UTC, generates all 12 signs, caches in Redis
2. **API** (`/api/horoscope?sign=aries`) checks Redis cache first; on miss, generates via OpenAI and caches
3. **Frontend** fetches from API, renders cards. Sign pages use ISR (1-hour revalidation)

### Two Vercel Projects (Important!)
The codebase deploys to TWO separate Vercel projects:
- **horoscope-ai-api** (`prj_rWJqgnyvBJZOIUA2R0BvpY5wzZ5E`): Serves API routes at api.gettodayshoroscope.com. This is where most deployments go via `vercel deploy --prod`.
- **horoscope-ai-frontend** (`prj_4Sha6rIf48CT3llWeOMMnPFqLHYS`): Serves the frontend at gettodayshoroscope.com. This project needs separate deployment for frontend route changes (sign pages, compatibility pages, etc.).

To deploy to the correct project, update `.vercel/project.json` with the right `projectId` before running `vercel deploy --prod`.

## 4. Content System (The Differentiator)

### Sign-Specific Voice System (`src/utils/horoscope-prompts.ts`)
Each zodiac sign has a distinct writing personality:

| Sign | Voice | Anti-patterns |
|------|-------|--------------|
| Aries | Bold, direct coach | No "fiery phoenix", no greetings |
| Taurus | Unhurried porch friend, sensory details | No "steadfast", no bull metaphors |
| Gemini | Intellectually curious thought experiments | No twin/duality clichés |
| Cancer | Tender emotional intelligence | No shell/crab metaphors |
| Leo | Warm mentor with honest challenges | No flattery, no "king/queen" |
| Virgo | Precise, dry wit, unexpected depth | No "perfectionist" clichés |
| Libra | Elegant diplomat-poet | No scales/balance metaphors |
| Scorpio | Raw psychological intensity | No "sting", no "mysterious depths" |
| Sagittarius | Philosophical campfire wanderer | No "archer", no "aim your arrow" |
| Capricorn | Understated, hard-won authority | No "mountain goat", no "climb" |
| Aquarius | Visionary systems thinker | No "water bearer", no "rebel" |
| Pisces | Dreamlike, synesthetic fluidity | No "ocean depths", no "swimming" |

### Global Banned Words
"tapestry", "canvas", "journey", "embrace", "navigate", "celestial", "radiant", "vibrant", "manifest", "align", "resonate", "ignite", "illuminate", "nurture", "unfold", "Dear [Sign]"

### Writing Format Rotation
12 structural formats rotate daily per sign (scene, observation, paradox, three thoughts, mid-thought, reframe, parable, question, body-sensation, negation, younger-self, silence). Each sign gets a different format on the same day.

### Verified Quote Bank (`src/utils/verified-quotes.ts`)
140+ real, source-cited quotes from 14 philosophers. The AI SELECTS from the bank — it never generates or recalls quotes from memory. Philosopher assignment rotates daily so each sign gets a unique philosopher.

Philosophers: Alan Watts, Marcus Aurelius, Lao Tzu, Seneca, Albert Einstein, Epicurus, Friedrich Nietzsche, Plato, Richard Feynman, Aristotle, Dr. Joe Dispenza, Walter Russell, Socrates, Jiddu Krishnamurti

### Astrological Context (`src/utils/astro-context.ts`)
Injects Mercury retrograde periods, moon phases, and seasonal events into prompts when relevant.

## 5. Key Files

### Content Pipeline
| File | Purpose |
|------|---------|
| `src/utils/horoscope-prompts.ts` | Sign personalities, writing formats, philosopher rotation, prompt builder |
| `src/utils/verified-quotes.ts` | 140+ verified quotes with sources, selection helpers |
| `src/utils/horoscope-generator.ts` | Single generation function used by ALL code paths |
| `src/utils/astro-context.ts` | Mercury retrograde, moon phases, seasonal context |

### API Routes
| Route | Purpose | Auth |
|-------|---------|------|
| `/api/horoscope?sign=X` | Main endpoint — cache check → generate → return | None (public) |
| `/api/cron/daily-horoscope` | Batch generate all 12 signs | Requires CRON_SECRET |
| `/api/horoscope/refresh` | Force regenerate + verify cache | Requires CRON_SECRET |
| `/api/og/[sign]` | Dynamic OG image generation | None |
| `/api/subscribe` | Email capture for daily digest | None |
| `/api/debug/ping` | Health check | None |
| `/api/debug/redis` | Cache inspection | None |

### Frontend
| File | Purpose |
|------|---------|
| `src/app/page.tsx` | Home page (ISR, 1-hour revalidation) |
| `src/app/horoscope/[sign]/page.tsx` | Individual sign page with OG tags, share button |
| `src/app/horoscope/[sign]/weekly/page.tsx` | Weekly forecast page |
| `src/app/compatibility/[pair]/page.tsx` | 66 compatibility pages |
| `src/app/pricing/page.tsx` | Premium tier comparison |
| `src/components/zodiac/ZodiacCard.tsx` | Main card component |
| `src/components/zodiac/HoroscopeDisplay.tsx` | Grid layout + hero |
| `src/components/zodiac/SignPicker.tsx` | Sign selection (persists to localStorage) |
| `src/hooks/useMode.ts` | Zustand store: userSign, mode, streak |

### Config
| File | Purpose |
|------|---------|
| `vercel.json` | API project Vercel config (cron schedule) |
| `vercel.frontend.json` | Frontend project config |
| `vercel.backend.json` | Backend-specific config |
| `.vercel/project.json` | Currently active Vercel project ID |
| `next.config.js` | Next.js config (TS/ESLint build settings) |

## 6. Environment Variables (Vercel)

| Variable | Purpose | Required |
|----------|---------|----------|
| `OPENAI_API_KEY` | OpenAI API access | Yes |
| `UPSTASH_REDIS_REST_URL` | Redis connection | Yes |
| `UPSTASH_REDIS_REST_TOKEN` | Redis auth | Yes |
| `CRON_SECRET` | Auth for cron/refresh endpoints | Yes |
| `FEATURE_FLAG_USE_REDIS_CACHE` | Enable Redis caching | Yes (default: true) |
| `FEATURE_FLAG_USE_TIMEZONE_CONTENT` | Timezone-aware generation | No (default: false) |
| `FEATURE_FLAG_USE_SCHEMA_MARKUP` | SEO schema markup | No (default: true) |

Pull env vars locally: `vercel env pull .env.local`

## 7. Redis Cache Structure

Keys follow the pattern: `horoscope-prod:horoscope:date=YYYY-MM-DD&sign=X&type=daily`

Generated by `src/utils/cache-keys.ts`. The `safelyStoreInRedis` / `safelyRetrieveForUI` helpers in `redis-helpers.ts` handle namespace prefixing automatically — never manually prepend `horoscope-prod:`.

TTLs: Daily = 86400s, Weekly = 604800s

## 8. Common Pitfalls

| Pitfall | Details |
|---------|---------|
| **Double namespace prefix** | `safelyStoreInRedis` already adds `horoscope-prod:`. Never manually prepend it. The refresh route had this bug (fixed in PR #5). |
| **Vercel 10s timeout** | Hobby plan limits function execution to 10s. Batch generating all 12 signs sequentially takes ~36s. Generate one at a time. |
| **Two Vercel projects** | Frontend changes must deploy to BOTH projects. Update `.vercel/project.json` projectId before deploying. |
| **OpenAI quota** | The API key can run out of credits. Error manifests as 429 → 500 for all signs. Check billing at platform.openai.com. |
| **Stale cache** | After changing prompts/generation logic, old cached horoscopes persist until TTL expires. Flush by triggering the cron endpoint with CRON_SECRET. |
| **Edge runtime** | Do NOT add `export const runtime = 'edge'` to routes using the OpenAI SDK. It is incompatible with Vercel's edge runtime (fixed in PR #1). |
| **node-fetch** | Do NOT import `node-fetch`. Next.js has built-in fetch. The package is not in dependencies. |

## 9. Development History

### Sprint 1 (2026-03-31): Emergency Fix + Content Pipeline
- **PR #1-2**: Fixed edge runtime crash + Next.js CVE-2025-66478
- **PR #3**: New sign personality system (12 voices, format rotation, philosopher assignment)
- **PR #5**: Content pipeline remediation (verified quote bank, single generator, dead code cleanup, -2,105 lines)
- **PR #6**: Security (removed debug endpoints, fixed CORS, secured cron, re-enabled TS)
- **PR #7**: Frontend (video optimization, sign picker, sign pages, sitemap fix)

### Sprint 2 (2026-03-31): Product & Design Overhaul (in progress)
- 20-point remediation based on 6-expert review
- 4 parallel squads: Content, Infrastructure, Design, SEO
- Key deliverables: hero rewrite, element colors, night mode, PWA, push notifications, OG images, streaks, 66 compatibility pages, weekly forecasts, premium scaffolding

## 10. Review Findings Summary

16 agents total audited the app (10 in Wave 1, 6 in Wave 2). Key consensus findings:

| Finding | Severity | Status |
|---------|----------|--------|
| Stale cache serving old prompts | P0 | Fixed (PR #5 + regen) |
| Fabricated/misattributed quotes | P0 | Fixed (PR #5 verified bank) |
| Debug endpoints exposed in production | P0 | Fixed (PR #6) |
| Broken refresh route | P0 | Fixed (PR #5) |
| Sign pages 404 on production | P0 | In progress (Squad B) |
| Brand copy contradicts product voice | P1 | In progress (Squad C) |
| 82MB video payload | P1 | Fixed (PR #7 poster images) |
| Zero retention mechanics | P1 | In progress (Squad B: PWA, push, streaks) |
| No SEO pages beyond home | P1 | Fixed (Squad D: 92 URLs) |
| Accessibility failures (WCAG) | P1 | In progress (Squad C) |
| Content quality inconsistency across signs | P2 | In progress (Squad A) |
| No analytics | P2 | In progress (Squad B) |

## 11. Content Quality Benchmarks

From the content strategist's 12-sign audit:

| Tier | Signs | Notes |
|------|-------|-------|
| A- (strong) | Cancer, Scorpio, Pisces | Best voice differentiation and quote integration |
| B (good) | Aries, Virgo, Capricorn, Aquarius | Solid but room to improve |
| C+ (needs work) | Taurus, Leo, Gemini, Libra, Sagittarius | Model flattens distinct specs; need stronger negative examples |

Target: all signs at B+ or above via prompt tightening (Squad A).

## 12. Competitive Positioning

| Competitor | Their angle | Our angle | Our advantage |
|-----------|------------|-----------|---------------|
| Co-Star | Algorithmic, blunt, social | Philosophical, warm, mentorship | Content quality + verified quotes |
| The Pattern | Psychological profiling | Sign-specific philosophical voice | Simpler, more accessible |
| Sanctuary | Expert astrologers, premium | AI + philosopher curation | Free tier + unique content system |
| Chani | Inclusive, intersectional | Philosophical depth | Verified quote bank, format rotation |
| Newspapers | Generic, quick | Deep, sign-specific | 12 distinct voices vs 1 template |

**Whitespace we own:** "The thinking person's horoscope" — philosophical daily guidance that quotes real thinkers, not fortune-telling or personality profiling.

## 13. Future Roadmap (Post-Current Sprint)

| Priority | Feature | Notes |
|----------|---------|-------|
| P1 | Birth chart basics (Big 3: Sun/Moon/Rising) | Most requested by astrology enthusiasts |
| P1 | Actual email sending (daily digest) | Infra exists, needs email service |
| P1 | Stripe integration for premium tier | Scaffolding exists, needs payment flow |
| P2 | Reading history / journal | localStorage → Redis migration |
| P2 | Mobile app (React Native or Capacitor) | PWA covers most use cases first |
| P3 | Community features | Reflection prompts, user submissions |
| P3 | Audio narration of daily reading | 60-second voiced readings |
