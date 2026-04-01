---
title: "fix: Horoscope App Production Remediation"
type: fix
status: active
date: 2026-03-31
---

# Horoscope App Production Remediation

## Overview

10 parallel review agents (architect, engineer, PM, QA, design/UX, 5 user personas) audited gettodayshoroscope.com and found 6 P0s, 10 P1s, and 8 P2s. This plan addresses all P0s and critical P1s across three parallel squads with zero file overlap.

## Problem Frame

The app's new prompt system (sign-specific voices, format rotation, philosopher assignment) exists in code but users see old cached content that violates every rule the system defines. Additionally, debug endpoints are publicly exposed (security/cost risk), the refresh flow is broken, quotes are AI-fabricated, and 82MB of video autoplays on page load.

## Requirements Trace

- R1. New prompt system content must reach users (flush cache + regenerate)
- R2. All philosopher quotes must be real, verified, correctly attributed
- R3. Debug/generation endpoints must require authentication
- R4. Single generation function used by all code paths
- R5. Refresh route must actually work (no node-fetch, no double-prefix)
- R6. Users can find and bookmark their sign
- R7. Page weight reduced from 82MB to <10MB
- R8. Individual sign pages exist for SEO and sharing
- R9. Sitemap reflects only real pages
- R10. TypeScript checking re-enabled in builds

## Scope Boundaries

- No user accounts or auth system (localStorage preference only)
- No natal chart / Big 3 support (future phase)
- No email digest or push notifications (future phase)
- No PWA manifest (future phase)
- No test suite creation (separate sprint)

## Key Technical Decisions

- **Hardcoded quote bank over AI-generated quotes**: AI fabricates 6-7 of 12 quotes daily. A curated bank of 10+ verified quotes per philosopher eliminates this entirely. The prompt instructs the model to select from the bank rather than generate.
- **Single `generateHoroscope()` in shared module**: Three divergent generation functions with different prompts is the root cause of content inconsistency. One function, one prompt system, imported everywhere.
- **Remove debug endpoints entirely**: Securing them with auth adds complexity. They're development tools that shouldn't exist in production. The `/api/debug/redis` and `/api/debug/ping` endpoints can stay (read-only, no cost exposure). Remove `/api/debug/generate`, `/api/debug/regenerate-horoscopes`, `/api/debug/route.ts`, `/api/debug/assets`.
- **Static poster images instead of autoplay video**: Replace 82MB of .mp4 files with compressed poster frames (~50KB each). Add video playback only on hover/tap. Total weight: ~600KB vs 82MB.
- **ISR over force-dynamic**: The page content changes once daily. Use ISR with 1-hour revalidation instead of `force-dynamic` on every request.

## High-Level Technical Design

> *Directional guidance for review, not implementation specification.*

```
Squad A (Content Pipeline)         Squad B (Security/Infra)         Squad C (Frontend/Growth)
========================          ========================         ========================

1. Verified quote bank             1. Remove debug endpoints        1. Video optimization
   src/utils/verified-quotes.ts       Delete: debug/generate           Extract poster frames
                                      Delete: debug/regenerate         Intersection observer
2. Consolidate generation             Delete: debug/route.ts
   src/utils/horoscope-generator.ts   Delete: debug/assets          2. Sign preference
   (single function, single prompt)                                    Birthday picker
                                   2. Fix CORS                        localStorage persistence
3. Fix refresh route                  Single approach in middleware    Auto-scroll to sign
   Direct function call               Remove per-route CORS
   Remove node-fetch                  Export OPTIONS handler        3. Sign pages
   Fix namespace prefix                                               /horoscope/[sign]/page.tsx
                                   3. Re-enable TS checking           OG meta tags
4. Flush cache + regenerate           next.config.js                   Share button
   Clear all Redis keys               Fix type errors first
   Trigger cron endpoint                                            4. Fix sitemap
                                   4. Fix OPTIONS handlers             Remove fake pages
5. Delete dead code                   Export OPTIONS from routes       Add real sign pages
   6+ dead component files
   Dead utility functions
```

## Implementation Units

### Squad A: Content Pipeline

- [ ] **Unit A1: Build verified quote bank**

**Goal:** Replace AI-fabricated quotes with a curated, verified quote database

**Requirements:** R2

**Dependencies:** None (can start immediately)

**Files:**
- Create: `src/utils/verified-quotes.ts`
- Modify: `src/utils/horoscope-prompts.ts` (reference quote bank in prompt)

**Approach:**
- Create a TypeScript module exporting a `VERIFIED_QUOTES` record keyed by philosopher name
- Each philosopher gets 10-15 verified quotes with source citations
- Quotes must be under 120 characters for card display
- The `buildHoroscopePrompt()` function references specific quotes from the bank rather than asking OpenAI to generate/recall quotes
- `getPhilosopherAssignment()` selects the philosopher; the prompt includes 3-4 verified quotes for that philosopher and instructs the model to pick the most relevant one

**Patterns to follow:**
- Existing `SIGN_PERSONALITIES` record structure in `horoscope-prompts.ts`

**Test scenarios:**
- Happy path: Each philosopher has at least 10 quotes in the bank
- Happy path: All quotes are under 120 characters
- Edge case: `getPhilosopherAssignment` for all 12 signs on a given date returns 12 unique philosophers
- Edge case: Quote bank covers all philosophers in the rotation array

**Verification:**
- Every quote in the bank is traceable to a published source
- No AI can fabricate a quote — the model selects from a provided list

---

- [ ] **Unit A2: Consolidate to single generation function**

**Goal:** Replace 3 divergent generation functions with one shared module

**Requirements:** R4

**Dependencies:** A1 (quote bank must exist for the prompt to reference it)

**Files:**
- Create: `src/utils/horoscope-generator.ts`
- Modify: `src/app/api/horoscope/route.ts` (import from generator)
- Modify: `src/app/api/cron/daily-horoscope/route.ts` (import from generator)
- Delete: `src/app/api/debug/regenerate-horoscopes/route.ts`
- Delete: `src/app/api/debug/regenerate-horoscopes.js`
- Delete: `src/app/api/debug/generate/route.ts`

**Approach:**
- Extract `generateHoroscope(sign, type)` into `horoscope-generator.ts`
- Single OpenAI call using `buildHoroscopePrompt()` with verified quote bank
- Validate required fields, normalize data types, filter self-matches from best_match
- Both API route and cron job import this single function
- Remove the old generation code from debug endpoints entirely

**Patterns to follow:**
- Current `generateHoroscope` in `src/app/api/horoscope/route.ts` (newest version)
- `normalizeHoroscopeData` from `redis-helpers.ts`

**Test scenarios:**
- Happy path: `generateHoroscope('aries', 'daily')` returns object with all required fields
- Happy path: `quote_author` is always from VALID_AUTHORS list
- Edge case: Sign not in own best_match list
- Error path: Missing OpenAI API key throws descriptive error
- Error path: OpenAI returns malformed JSON — function throws, does not cache bad data
- Integration: Cron route and main route both produce identical data shapes

**Verification:**
- Only one `generateHoroscope` function exists in the codebase
- `grep -r "new OpenAI" src/app/api/` returns only `horoscope-generator.ts` import usage

---

- [ ] **Unit A3: Fix refresh route**

**Goal:** Make the refresh/regeneration flow actually work

**Requirements:** R5

**Dependencies:** A2 (must use consolidated generator)

**Files:**
- Modify: `src/app/api/horoscope/refresh/route.ts`

**Approach:**
- Remove `import fetch from 'node-fetch'` (not in deps, Next.js has built-in fetch)
- Replace HTTP self-call to `/api/debug/regenerate-horoscopes` with direct function call to `generateHoroscope` from the shared generator module
- Fix the double-namespace bug: remove manual `horoscope-prod:` prefix from Redis key lookup — use `safelyRetrieveForUI` which handles namespacing internally
- Add basic auth check (require CRON_SECRET or remove the endpoint if not needed)

**Patterns to follow:**
- `safelyRetrieveForUI` usage in `cache.ts`

**Test scenarios:**
- Happy path: Refresh regenerates all 12 signs and verification reports them as cached
- Edge case: Redis key lookup finds data without double-prefix
- Error path: OpenAI failure during refresh returns error response, does not crash

**Verification:**
- `grep -r "node-fetch" src/` returns zero results
- `grep -r "horoscope-prod:\${cacheKey}" src/` returns zero results (no manual prefix)

---

- [ ] **Unit A4: Flush cache and regenerate**

**Goal:** Clear stale content and populate Redis with new-prompt horoscopes

**Requirements:** R1

**Dependencies:** A1, A2, A3 (all pipeline fixes must be deployed first)

**Files:**
- No file changes — operational action after deploy

**Approach:**
- After deploying A1-A3, trigger the cron endpoint to regenerate all 12 signs
- Verify each sign's response uses the new voice (no "Dear [Sign]", no banned words)
- Verify each quote is from the verified bank

**Test scenarios:**
- Happy path: All 12 signs return content matching new prompt rules
- Happy path: No two signs share the same philosopher quote
- Edge case: Regeneration while old cache exists overwrites cleanly

**Verification:**
- Fetch all 12 signs from live API — none start with "Dear", none contain "tapestry"/"canvas"/"celestial"
- All 12 quotes appear in `verified-quotes.ts`

---

- [ ] **Unit A5: Delete dead code**

**Goal:** Remove 6+ dead component/utility files that create maintenance hazard

**Requirements:** Codebase hygiene

**Dependencies:** A2 (debug endpoint deletion happens there)

**Files:**
- Delete: `src/components/HoroscopeDisplay.tsx` (dead — active version in `zodiac/`)
- Delete: `src/components/ZodiacCard.tsx` (dead — active version in `zodiac/`)
- Delete: `src/components/Header.tsx` (dead — active version in `layout/`)
- Delete: `src/components/ModeProvider.tsx` (dead — Zustand store is active)
- Delete: `src/contexts/ModeContext.tsx` (dead — Zustand store is active)
- Delete: `src/components/OpenAITester.tsx` (debug component, never imported)
- Delete: `src/lib/redis.ts` (dead — `src/utils/redis.ts` is active)
- Delete: `src/utils/timezone.ts` (dead — `timezone-utils.ts` is active)

**Test expectation:** none — pure deletion of unused files

**Verification:**
- `npm run build` succeeds (no broken imports)
- No component imports from deleted paths

---

### Squad B: Security & Infrastructure

- [ ] **Unit B1: Remove dangerous debug endpoints**

**Goal:** Eliminate publicly exposed endpoints that can trigger OpenAI costs and overwrite cache

**Requirements:** R3

**Dependencies:** None (can start immediately)

**Files:**
- Delete: `src/app/api/debug/route.ts` (exposes OpenAI key status, env vars)
- Delete: `src/app/api/debug/generate/route.ts` (triggers OpenAI generation, no auth)
- Delete: `src/app/api/debug/assets/route.ts` (exposes filesystem structure)
- Keep: `src/app/api/debug/ping/route.ts` (harmless health check)
- Keep: `src/app/api/debug/redis/route.ts` (read-only cache inspection)

**Approach:**
- Delete the endpoint files entirely
- Remove any imports or references to deleted endpoints
- The regenerate endpoint deletion is handled in A2

**Test scenarios:**
- Happy path: `/api/debug/ping` returns 200
- Happy path: `/api/debug/redis` returns cache status
- Error path: `/api/debug/generate` returns 404 (deleted)
- Error path: `/api/debug` returns 404 (deleted)

**Verification:**
- `curl https://api.gettodayshoroscope.com/api/debug/generate` returns 404
- No endpoint can trigger OpenAI calls without CRON_SECRET

---

- [ ] **Unit B2: Fix CORS — single approach**

**Goal:** Eliminate the triple-layer CORS conflict

**Requirements:** Correct API behavior

**Dependencies:** None

**Files:**
- Modify: `middleware.ts` (sole CORS handler)
- Modify: `src/app/api/horoscope/route.ts` (remove local `addCorsHeaders`, remove dead `applyCorsHeaders` import)
- Modify: `src/app/api/cron/daily-horoscope/route.ts` (remove local `addCorsHeaders`)
- Modify: `src/utils/cors-service.ts` (simplify or delete if middleware handles everything)

**Approach:**
- Middleware is the single CORS authority for all `/api/*` routes
- Remove all per-route CORS header setting
- Export an explicit `OPTIONS` function from routes that need preflight (or let middleware handle it)
- Use specific allowed origins (not `*`) with credentials support

**Test scenarios:**
- Happy path: Allowed origin gets correct CORS headers
- Happy path: OPTIONS preflight returns 204 with CORS headers
- Edge case: Unknown origin gets `*` without credentials
- Error path: No duplicate `Access-Control-Allow-Origin` headers in response

**Verification:**
- `grep -r "addCorsHeaders\|applyCorsHeaders" src/app/api/` returns zero results
- `curl -I -H "Origin: https://gettodayshoroscope.com" https://api.gettodayshoroscope.com/api/horoscope?sign=aries` shows exactly one `Access-Control-Allow-Origin` header

---

- [ ] **Unit B3: Re-enable TypeScript checking + fix type errors**

**Goal:** Restore the build-time safety net

**Requirements:** R10

**Dependencies:** A5 (dead code deletion removes most type errors)

**Files:**
- Modify: `next.config.js` (remove `ignoreBuildErrors` and `ignoreDuringBuilds`)
- Modify: Various files with type errors exposed by re-enabling

**Approach:**
- Remove `typescript: { ignoreBuildErrors: true }` and `eslint: { ignoreDuringBuilds: true }`
- Run `npm run build` and fix all errors
- Most errors will be in dead code (handled by A5) or type mismatches in AllHoroscopesContext

**Test scenarios:**
- Happy path: `npm run build` succeeds with zero type errors
- Happy path: `npm run lint` succeeds

**Verification:**
- `grep -r "ignoreBuildErrors\|ignoreDuringBuilds" next.config.js` returns zero results
- CI build passes

---

- [ ] **Unit B4: Secure cron endpoint**

**Goal:** Prevent unauthorized OpenAI cost exposure via cron endpoint

**Requirements:** R3

**Dependencies:** None

**Files:**
- Modify: `src/app/api/cron/daily-horoscope/route.ts`

**Approach:**
- Remove the `isFrontendOrigin` bypass — Origin header is spoofable
- Require `CRON_SECRET` in Authorization header for all requests
- Remove the `true` fallback when CRON_SECRET is not set — if no secret, deny all
- The Vercel cron scheduler automatically sends the CRON_SECRET header

**Test scenarios:**
- Happy path: Request with valid CRON_SECRET returns 200
- Error path: Request without CRON_SECRET returns 401
- Error path: Request with wrong CRON_SECRET returns 401
- Error path: Request with spoofed Origin but no CRON_SECRET returns 401

**Verification:**
- `curl https://api.gettodayshoroscope.com/api/cron/daily-horoscope` returns 401

---

### Squad C: Frontend & Growth

- [ ] **Unit C1: Video optimization — poster images + lazy loading**

**Goal:** Reduce page weight from 82MB to <5MB

**Requirements:** R7

**Dependencies:** None (can start immediately)

**Files:**
- Modify: `src/components/zodiac/ZodiacCard.tsx` (poster image, intersection observer)
- Modify: `src/components/zodiac/HoroscopeDisplay.tsx` (hero video optimization)
- Create: `public/images/posters/` (12 poster images extracted from video first frames)

**Approach:**
- Extract a single frame from each zodiac video as a compressed JPEG poster (~50KB each)
- Default to showing the poster image, not autoplay video
- Use Intersection Observer to load video only when card is in viewport AND user hovers/taps
- Hero space video: use compressed poster with play-on-scroll behavior
- Consider removing videos entirely and using CSS gradient animations (saves 99% bandwidth)

**Test scenarios:**
- Happy path: Page loads with poster images, no video downloads until interaction
- Edge case: Mobile — videos never autoplay, poster images only
- Happy path: Hero section shows poster, video loads on scroll into view

**Verification:**
- Network tab shows <5MB total page weight on initial load
- Lighthouse performance score improves significantly

---

- [ ] **Unit C2: Sign preference — find and bookmark your sign**

**Goal:** Users can select their sign and see it prominently on return visits

**Requirements:** R6

**Dependencies:** None

**Files:**
- Create: `src/components/zodiac/SignPicker.tsx`
- Modify: `src/components/zodiac/HoroscopeDisplay.tsx` (show picker, reorder grid)
- Modify: `src/hooks/useMode.ts` (add sign preference to Zustand store, persist to localStorage)

**Approach:**
- Add a sign picker component (12 zodiac symbols in a horizontal scroll row below the hero)
- On first visit: show picker prominently with "What's your sign?" prompt
- On selection: save to localStorage via Zustand store, scroll to and highlight the user's card
- On return visits: user's sign card appears first/highlighted, picker is collapsed but accessible
- Optional: birthday input that auto-detects sign

**Test scenarios:**
- Happy path: Selecting Aries saves to localStorage, Aries card appears first on next visit
- Happy path: Sign picker shows all 12 signs with correct symbols
- Edge case: No sign selected — grid shows default order
- Edge case: localStorage cleared — reverts to default with picker shown

**Verification:**
- Return to site after selecting a sign — that sign's card is first/highlighted

---

- [ ] **Unit C3: Individual sign pages**

**Goal:** Create `/horoscope/[sign]` pages for SEO and sharing

**Requirements:** R8

**Dependencies:** C2 (sign preference component can be reused)

**Files:**
- Create: `src/app/horoscope/[sign]/page.tsx`
- Create: `src/app/horoscope/[sign]/layout.tsx` (OG meta tags)
- Modify: `src/components/zodiac/ZodiacCard.tsx` (add share button, link to sign page)

**Approach:**
- Dynamic route `/horoscope/[sign]` renders a full-page reading for one sign
- Use `generateMetadata` for sign-specific title, description, and OG tags
- Add a share button (Web Share API on mobile, copy-link fallback on desktop)
- The expanded card modal gets a "View full page" link to the sign page
- Use ISR with 1-hour revalidation (content changes once daily)

**Test scenarios:**
- Happy path: `/horoscope/aries` renders Aries reading with correct meta tags
- Edge case: `/horoscope/invalid` returns 404
- Happy path: OG image and description present for social sharing
- Happy path: Share button copies URL or opens native share sheet

**Verification:**
- Each sign page is accessible and renders the daily reading
- Social media preview shows sign-specific title and description

---

- [ ] **Unit C4: Fix sitemap**

**Goal:** Sitemap reflects only pages that actually exist

**Requirements:** R9

**Dependencies:** C3 (sign pages must exist before adding them to sitemap)

**Files:**
- Modify: `src/app/sitemap.ts`

**Approach:**
- Remove references to `/horoscopes`, `/about`, `/contact` (don't exist)
- Add `/horoscope/aries` through `/horoscope/pisces` (created in C3)
- Keep `/` as the primary page
- Set `changeFrequency: 'daily'` and `priority: 0.8` for sign pages

**Test scenarios:**
- Happy path: Sitemap XML contains only existing pages
- Happy path: All 12 sign pages are in the sitemap
- Edge case: No 404 pages in sitemap

**Verification:**
- Every URL in `sitemap.xml` returns 200

---

## System-Wide Impact

- **Cache invalidation:** Flushing Redis cache affects all users simultaneously — must regenerate immediately after flush
- **CORS change:** Moving to middleware-only CORS affects all API consumers — verify frontend still works
- **Dead code deletion:** 8 files removed — verify no hidden imports
- **Video removal:** Visual change — poster images must maintain the cosmic aesthetic
- **Sign pages:** New routes need Vercel config to serve correctly on both frontend and API projects

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| Cache flush leaves users with no horoscopes temporarily | Regenerate immediately after flush, verify all 12 signs before announcing |
| Video poster images look worse than video | Extract high-quality frames, add subtle CSS animation (shimmer/gradient) |
| Re-enabling TypeScript exposes many errors | Delete dead code first (A5), then fix remaining errors incrementally |
| Vercel 10s timeout on batch generation | Generate signs individually, not in batch. Each sign is ~3s. |
| Quote bank too small for daily variety | 10-15 quotes per philosopher x 12 philosophers = 120-180 total, sufficient for months of rotation |

## Squad Dependency Graph

```
Squad A (Content)          Squad B (Security)        Squad C (Frontend)
=================          ==================        ==================
A1 (quote bank)            B1 (remove debug)         C1 (video optimize)
    |                      B2 (fix CORS)             C2 (sign preference)
A2 (consolidate gen)       B4 (secure cron)              |
    |                          |                     C3 (sign pages)
A3 (fix refresh)           B3 (re-enable TS)             |
    |                      (depends on A5)           C4 (fix sitemap)
A4 (flush + regen)                                   (depends on C3)
    |
A5 (delete dead code)
```

All three squads can start simultaneously. The only cross-squad dependency is B3 (re-enable TS) depending on A5 (dead code deletion).
