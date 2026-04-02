---
title: "feat: Personal Philosophy Engine — Homepage Redesign, Philosopher Selection, Email, Sharing, Agent API"
type: feat
status: active
date: 2026-04-01
origin: docs/brainstorms/2026-04-01-homepage-redesign-email-sharing-requirements.md
---

# feat: Personal Philosophy Engine

## Overview

Transform gettodayshoroscope.com from a static horoscope grid into a personal philosophy engine. Users pick their sign and 3-5 favorite philosophers, then receive daily AI-generated guidance that blends those philosophers' voices with their zodiac temperament. The same content engine serves humans (website + email) and agents (JSON API + MCP server).

## Problem Frame

The current product has no defensible moat — anyone can ask ChatGPT for a philosophical horoscope. The homepage shows 12 equal cards with 3 competing CTAs (scored 4/10 on Decision Architecture). Email capture exists but is buried and never sends. No sharing mechanics. No growth loops. The product hides its AI nature behind a fake persona.

The moat is **personalized philosopher selection**. ChatGPT can't remember your philosophers, blend them with your sign daily, build a relationship over time, or generate branded shareable content from it. (see origin: docs/brainstorms/2026-04-01-homepage-redesign-email-sharing-requirements.md)

## Requirements Trace

All 45 requirements from the origin document organized into implementation phases:

**Phase 1 — Content:** R9, R10, R31, R32 (philosopher roster, quotes, categories)
**Phase 2 — Homepage:** R1-R8, R11-R17, R20-R21, R33-R34, R42-R45 (redesign, philosopher selection, generation pipeline, positioning)
**Phase 3 — Email:** R18-R26 (soft gate, Resend delivery, unsubscribe)
**Phase 4 — Sharing:** R27-R30 (share button, OG quote cards)
**Phase 5 — Agent API:** R35-R41 (JSON endpoint, MCP server)

## Scope Boundaries

- NOT building daily archive pages (`/[sign]/daily/[date]/`)
- NOT building video generation or auto-posting pipeline
- NOT building user accounts or login
- NOT building premium tier or payments
- NOT changing the core OpenAI model or call structure
- NOT refactoring the Redis double-prefix key pattern (self-consistent, works in practice)

## Context & Research

### Relevant Code and Patterns

- `src/utils/horoscope-generator.ts` — single OpenAI callsite. Extended for monthly type in Sprint 1. Extend again with `philosophers?: string[]` param
- `src/utils/horoscope-prompts.ts` — `VALID_AUTHORS` array (12 philosophers in rotation), `getPhilosopherAssignment()` uses `(signIndex + dayOffset) % 12`. Two extra philosophers (Krishnamurti, Socrates) have quotes but aren't in rotation pool
- `src/utils/verified-quotes.ts` — `Record<string, VerifiedQuote[]>` with 140+ quotes across 14 philosophers. Each quote has `text`, `source`, `author`
- `src/hooks/useMode.ts` — Zustand store persists `userSign`, `mode`, `streakCount`, `lastReadDate`. Extend with `selectedPhilosophers`
- `src/app/api/subscribe/route.ts` — POST stores `subscriber:{email}` hash + `subscribers:{sign}` set in Redis. No dedup check needed (SADD is idempotent)
- `src/app/api/og/[sign]/route.tsx` — Edge runtime, `ImageResponse` from `next/og`. 1200x630. Element gradient backgrounds. No dynamic quote text currently
- `src/components/zodiac/SignPicker.tsx` — exists but navigates to `/horoscope/[sign]`. Needs adaptation to stay on homepage
- `src/constants/zodiac.ts` — single source for `VALID_SIGNS`, `SIGN_META`, `isValidSign`
- Redis client: `automaticDeserialization: false`, manual JSON stringify/parse via `safelyStoreInRedis`/`safelyRetrieveForUI`

### Institutional Learnings

- **Vercel 10s timeout** — hobby plan hard limit. Never batch-generate or batch-send. Use `waitUntil()` for background email sends (see origin plan R22 + external research)
- **Two Vercel projects** — OG image endpoint must be in API project (`api.gettodayshoroscope.com`), not frontend
- **Tailwind v3 ONLY** — use `@tailwind` directives, utility classes. Never `@import "tailwindcss"` (v4)
- **Visual regression risk** — Sprint 3 of previous session required 7 hotfix PRs after UI changes. Screenshot before/after for all visual changes
- **Single generator** — all generation goes through `horoscope-generator.ts`. Never create a second OpenAI client

### External References

- **Resend:** `waitUntil()` for background sends in Next.js 15+. Batch with `Promise.all()`. DNS verification (SPF/DKIM) required for custom domain. Free tier: 100 emails/day
- **MCP Server:** `@modelcontextprotocol/server` TypeScript SDK. `StdioServerTransport` for local. Tool names must be `snake_case`. Package as `{name}-mcp` on npm
- **OG Images:** Satori renders JSX to PNG. Supports flexbox + gradients (no CSS Grid). Load fonts as ArrayBuffer from Google Fonts. Auto-cached on Vercel CDN

## Key Technical Decisions

- **Philosopher selections stored in Zustand + Redis:** Zustand provides instant client-side access for return visits. Redis stores selections alongside subscriber data so the email cron can generate personalized content. Zustand is the read path, Redis is the persistence path. (Rationale: no user accounts — localStorage is the session, Redis is the backend)

- **Live preview uses pre-generated sample quotes, not OpenAI calls:** Tapping a philosopher in the selection grid shows a static sample quote from that philosopher's verified bank, not a real-time OpenAI generation. (Rationale: OpenAI calls are $0.002 each and take 2-3s — unacceptable for interactive UI. Pre-generated samples are instant and free)

- **Soft gate is inline expansion, not page transition:** After sign + philosopher selection, the reading preview and email gate appear inline on the same page via scroll-reveal. No route change. (Rationale: page transitions reset scroll position and break the flow feeling. Inline expansion with Framer Motion feels like the reading is unfolding)

- **Email sending hooks into existing cron, not a separate job:** The daily cron at `/api/cron/daily-horoscope` already generates all 12 signs. After generation, it triggers email sends via `waitUntil()`. (Rationale: one cron job, one trigger point. Avoids timing coordination between separate jobs)

- **New `/api/guidance` endpoint separate from `/api/horoscope`:** The agent-facing API is a new route with a simpler contract (sign + philosophers → reading JSON). It reuses `generateHoroscope` internally but has its own response shape optimized for agents. (Rationale: `/api/horoscope` has a complex envelope with `cached`, `batchGenerated`, `timezoneAware` fields that agents don't need. Clean separation avoids breaking existing clients)

- **Philosopher data in a new `src/constants/philosophers.ts` file:** The 50+ philosopher roster (name, tradition, description, sample quote) lives in a typed constant separate from `verified-quotes.ts`. (Rationale: `verified-quotes.ts` stores the full quote bank; `philosophers.ts` stores metadata for the selection UI. Different concerns, different files)

## Open Questions

### Resolved During Planning

- **Live preview approach:** Use pre-generated sample quotes (one featured quote per philosopher from the verified bank). Instant, free, no API calls
- **Soft gate animation:** Inline scroll-reveal with Framer Motion. No route change
- **OG quote endpoint:** New route at `src/app/api/og/[sign]/quote/route.tsx` alongside existing `src/app/api/og/[sign]/route.tsx`. Same edge runtime pattern, adds quote text rendering
- **Email sending within 10s timeout:** Use `waitUntil()` to send emails in background after the cron response returns. Send individually (not batch) to stay within Resend rate limits

### Deferred to Implementation

- Exact philosopher roster — the 50+ names, descriptions, and tradition categorization will be determined during content authoring
- Resend DNS record values — provided by Resend dashboard after account setup
- Optimal email send timing — midnight UTC initially, timezone-aware later
- MCP server npm package name — needs availability check

## High-Level Technical Design

> *This illustrates the intended approach and is directional guidance for review, not implementation specification.*

```
┌─────────────────────────────────────────────────────────────┐
│                    CONTENT LAYER                             │
│                                                              │
│  philosophers.ts ─── 50+ thinkers with metadata             │
│         │            (name, tradition, description,          │
│         │             sampleQuote)                           │
│         │                                                    │
│  verified-quotes.ts ─ 500+ quotes with source citations     │
│         │              (extends existing 140 → 500+)         │
│         │                                                    │
│  horoscope-prompts.ts ─ buildHoroscopePrompt() extended     │
│         │                to accept philosopher[] override     │
│         │                                                    │
│  horoscope-generator.ts ─ generateHoroscope() extended      │
│                           with philosophers?: string[]       │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
┌──────────────┐ ┌──────────┐ ┌──────────────┐
│  HOMEPAGE    │ │  EMAIL   │ │  AGENT API   │
│              │ │          │ │              │
│ Sign picker  │ │ Resend   │ │ /api/guidance│
│ Philosopher  │ │ Daily    │ │ JSON response│
│   grid       │ │ cron     │ │              │
│ Soft gate    │ │ Full     │ │ MCP server   │
│ Full reading │ │ reading  │ │ (npm pkg)    │
│ Share button │ │ + quote  │ │              │
└──────┬───────┘ └────┬─────┘ └──────────────┘
       │              │
       ▼              ▼
┌──────────────────────────┐
│  SHARING LAYER           │
│                          │
│  /api/og/[sign]/quote    │
│  Branded quote card      │
│  (Satori → PNG)          │
│                          │
│  Web Share API +         │
│  clipboard fallback      │
└──────────────────────────┘
```

## Phased Delivery

### Phase 1: Content Foundation
Units 1-2. Ship the expanded philosopher roster and quote bank. No UI changes. Unblocks all subsequent phases.

### Phase 2: Homepage Redesign
Units 3-6. The big UX change: sign picker → philosopher grid with live preview → reading display. Remove old card grid.

### Phase 3: Email Delivery
Units 7-9. Resend integration, soft email gate, daily cron email sends, unsubscribe.

### Phase 4: Social Sharing
Units 10-11. Branded OG quote cards, share button with Web Share API.

### Phase 5: Agent-Native API
Units 12-13. Public JSON guidance endpoint, MCP server package.

## Implementation Units

### Phase 1: Content Foundation

- [ ] **Unit 1: Philosopher Roster**

**Goal:** Create the 50+ philosopher/thinker metadata constant with tradition categories.

**Requirements:** R9, R10, R17

**Dependencies:** None

**Files:**
- Create: `src/constants/philosophers.ts`
- Test: `__tests__/constants/philosophers.test.ts`

**Approach:**
- Define `Philosopher` interface: `name`, `tradition` (enum: Stoicism | EasternWisdom | ScienceWonder | PoetrySoul | SpiritualLeaders | ModernThinkers), `description` (one line), `sampleQuote` (one featured quote for the selection UI)
- Export `PHILOSOPHERS` array of 50+ entries, `TRADITIONS` enum, and helper functions: `getPhilosophersByTradition()`, `getPhilosopher(name)`
- Include current 14 + expand with: Rumi, Maya Angelou, Thich Nhat Hanh, Bruce Lee, Carl Jung, Khalil Gibran, Ralph Waldo Emerson, Mary Oliver, Terence McKenna, Ram Dass, Carl Sagan, Marie Curie, Simone de Beauvoir, James Baldwin, Fyodor Dostoevsky, Herman Hesse, Confucius, Sun Tzu, Laozi (distinct from Lao Tzu if needed), Epictetus, Zhuangzi, Pema Chödrön, Eckhart Tolle, Brené Brown, Viktor Frankl, Albert Camus, Jean-Paul Sartre, Simone Weil, Hannah Arendt, bell hooks, Audre Lorde, Hafiz, Rabindranath Tagore, Kahlil Gibran, Pablo Neruda, David Foster Wallace, and more

**Patterns to follow:**
- `src/constants/zodiac.ts` for the typed constant pattern with `as const`
- `src/constants/faqs.ts` for the simple export structure

**Test scenarios:**
- Happy path: `PHILOSOPHERS` array has 50+ entries
- Happy path: Every philosopher has all required fields (name, tradition, description, sampleQuote)
- Happy path: `getPhilosophersByTradition('Stoicism')` returns only Stoic philosophers
- Edge case: `getPhilosopher('nonexistent')` returns null/undefined
- Happy path: All 6 traditions have at least 5 philosophers each

**Verification:**
- `PHILOSOPHERS.length >= 50`
- All traditions represented with 5+ entries each
- Type-checks clean

---

- [ ] **Unit 2: Expand Verified Quote Bank**

**Goal:** Expand the verified quote bank from 140+ quotes (14 philosophers) to 500+ quotes (50+ philosophers), each with source citations.

**Requirements:** R31, R32

**Dependencies:** Unit 1 (need philosopher list)

**Files:**
- Modify: `src/utils/verified-quotes.ts`
- Modify: `src/utils/horoscope-prompts.ts` (update `VALID_AUTHORS` array to include all 50+ philosophers)
- Test: `__tests__/utils/verified-quotes.test.ts`

**Approach:**
- Add 10+ verified, source-cited quotes for each new philosopher to the `VERIFIED_QUOTES` record
- Update `VALID_AUTHORS` in `horoscope-prompts.ts` to include all 50+ philosopher names
- Each quote must have: `text`, `source` (book/speech/letter with date), `author`
- Source from public domain texts, published collections, and well-attributed works
- Krishnamurti and Socrates already have quotes but aren't in the rotation — add them to `VALID_AUTHORS`

**Patterns to follow:**
- Existing `VERIFIED_QUOTES` structure in `src/utils/verified-quotes.ts`

**Test scenarios:**
- Happy path: Every philosopher in `PHILOSOPHERS` constant has a matching entry in `VERIFIED_QUOTES`
- Happy path: Every philosopher has at least 10 verified quotes
- Happy path: Every quote has `text`, `source`, and `author` fields populated
- Edge case: No quote exceeds 300 characters (reasonable display length)
- Integration: `getQuotesForPrompt(philosopher)` returns valid quotes for each new philosopher

**Verification:**
- `Object.keys(VERIFIED_QUOTES).length >= 50`
- All quotes have source citations
- No empty arrays for any philosopher

---

### Phase 2: Homepage Redesign

- [ ] **Unit 3: Extend Zustand Store for Philosopher Selections**

**Goal:** Add philosopher selection persistence to the Zustand store alongside existing userSign and mode.

**Requirements:** R14, R15

**Dependencies:** Unit 1

**Files:**
- Modify: `src/hooks/useMode.ts`
- Test: `__tests__/hooks/useMode.test.ts`

**Approach:**
- Add `selectedPhilosophers: string[]` (array of philosopher names, max 5)
- Add `email: string | null` (persisted locally for return-visit gate bypass)
- Add `setPhilosophers(philosophers: string[])`, `setEmail(email: string)` actions
- Persist to localStorage via existing Zustand `persist` middleware
- When `selectedPhilosophers` changes, also store to Redis via a POST to `/api/subscribe` (if email exists)

**Patterns to follow:**
- Existing `userSign` / `setUserSign` pattern in `useMode.ts`

**Test scenarios:**
- Happy path: `setPhilosophers(['Seneca', 'Feynman'])` persists to state and survives page reload
- Happy path: `setEmail('test@test.com')` persists
- Edge case: Setting more than 5 philosophers truncates to first 5
- Edge case: Setting 0 philosophers clears the array

**Verification:**
- Zustand store contains new fields
- localStorage has philosopher and email data after setting

---

- [ ] **Unit 4: Extend Generation Pipeline for Philosopher Override**

**Goal:** Allow `generateHoroscope` to accept user's philosopher selections and blend their voices into the reading.

**Requirements:** R33, R34

**Dependencies:** Unit 2

**Files:**
- Modify: `src/utils/horoscope-generator.ts` (add `philosophers?: string[]` to `GenerateHoroscopeOptions`)
- Modify: `src/utils/horoscope-prompts.ts` (extend `buildHoroscopePrompt` to accept philosopher override)
- Test: `__tests__/utils/horoscope-generator.test.ts`

**Approach:**
- When `options.philosophers` is provided and non-empty, override the default `getPhilosopherAssignment()` rotation with a random pick from the user's list (seeded by date for consistency)
- The prompt builder already accepts a philosopher name — the change is in how that name is selected
- Cache key must include philosopher selections: `horoscope:sign=X&type=daily&philosophers=feynman,seneca` so personalized readings don't overwrite the default rotation
- When no philosophers provided (SEO visitors, existing sign pages), behavior is unchanged — existing rotation continues

**Patterns to follow:**
- Existing monthly type extension pattern in `horoscope-generator.ts`

**Test scenarios:**
- Happy path: `generateHoroscope('aries', 'daily', { philosophers: ['Seneca'] })` uses Seneca (not the default rotation)
- Happy path: Default call `generateHoroscope('aries')` still uses the rotation — no regression
- Happy path: Personalized reading is cached separately from default reading
- Edge case: Invalid philosopher name falls back to default rotation
- Edge case: Empty philosophers array falls back to default rotation

**Verification:**
- Personalized readings use the specified philosopher
- Default readings unchanged
- Different cache keys for personalized vs default

---

- [ ] **Unit 5: Homepage Sign Picker + Philosopher Selection Grid**

**Goal:** Replace the 12-card grid with a step-by-step flow: sign picker → categorized philosopher grid with live preview.

**Requirements:** R1, R2, R5, R6, R7, R8, R11, R12, R13, R16, R42, R43, R44, R45

**Dependencies:** Units 1, 3

**Files:**
- Create: `src/components/home/SignStep.tsx` (12 sign buttons, server component possible)
- Create: `src/components/home/PhilosopherStep.tsx` (categorized grid with live preview, client component)
- Create: `src/components/home/PhilosopherCard.tsx` (individual philosopher card)
- Create: `src/components/home/ReadingPreview.tsx` (live preview that updates when philosophers are tapped)
- Create: `src/components/home/HomeFlow.tsx` (orchestrates the step flow, client component)
- Modify: `src/app/page.tsx` (replace HoroscopeDisplay with HomeFlow)
- Test: `__tests__/components/home/HomeFlow.test.tsx`

**Approach:**
- `HomeFlow` is the orchestrating client component. It manages flow state: `pickSign` → `pickPhilosophers` → `reading`
- Return visitors (Zustand has sign + email): skip to `reading` state immediately
- `SignStep`: 12 buttons in a 4x3 grid. Tap sets sign in Zustand, advances to `pickPhilosophers`
- `PhilosopherStep`: Categorized grid grouped by 6 traditions. Each `PhilosopherCard` shows name + tradition tag + one-line description. Tapping highlights (selected state) and updates `ReadingPreview` below the grid with that philosopher's `sampleQuote` + sign context
- `ReadingPreview`: Shows "YOUR COUNCIL (N/5)" counter + a sample reading preview blending selected philosopher quotes with the user's sign. Uses Framer Motion `AnimatePresence` for smooth transitions when philosophers are added/removed
- Homepage copy updated to AI-transparent: "We trained an AI on 50+ of the world's greatest philosophers..."
- HoroscopeDisplay import removed from page.tsx. FAQ section stays
- Existing sign pages (`/horoscope/[sign]`) unchanged — they remain ungated SEO landing pages
- All components use existing glassmorphic pattern: `bg-white/5 backdrop-blur-md border border-white/10 rounded-xl`

**Patterns to follow:**
- `src/components/zodiac/SignPicker.tsx` for the sign button pattern
- `src/components/zodiac/ZodiacCard.tsx` for glassmorphic card styling and Framer Motion
- `src/components/seo/FAQAccordion.tsx` for client component with state pattern

**Test scenarios:**
- Happy path: First visit shows sign picker with 12 buttons
- Happy path: Tapping a sign advances to philosopher grid
- Happy path: Philosopher grid shows all 6 tradition categories
- Happy path: Tapping a philosopher highlights it and updates the live preview
- Happy path: Selecting 3-5 philosophers enables the "Continue" action
- Happy path: Return visitor with stored sign + email sees reading immediately
- Edge case: Selecting more than 5 philosophers shows a "max reached" indicator
- Edge case: Deselecting a philosopher updates the preview and counter

**Verification:**
- Homepage renders the step flow instead of the card grid
- First-time visitors can pick sign and philosophers
- Return visitors see their reading immediately
- All components render in the cosmic dark theme

---

- [ ] **Unit 6: Reading Display + Brand Positioning**

**Goal:** Build the full reading display that shows after philosopher selection (first visit) or immediately (return visit).

**Requirements:** R3, R4, R20, R21, R22

**Dependencies:** Units 4, 5

**Files:**
- Create: `src/components/home/ReadingDisplay.tsx` (full reading view, client component)
- Modify: `src/components/home/HomeFlow.tsx` (add reading state)
- Test: `__tests__/components/home/ReadingDisplay.test.tsx`

**Approach:**
- `ReadingDisplay` receives sign + philosophers from Zustand, calls the horoscope API with philosopher override
- Shows: personalized greeting ("Good morning, Aries"), philosopher council display ("Guided by Seneca, Feynman & Rumi"), full reading text, philosopher quote with attribution, peaceful thought
- Below the reading: "Browse all signs" link, "Edit your council" link (returns to philosopher grid)
- Loading state while API fetches: skeleton with the user's sign and philosopher names visible
- The brand positioning headline "We trained an AI on 50+ of the world's greatest philosophers..." appears in the HeroIntro component (update existing)

**Patterns to follow:**
- `src/app/horoscope/[sign]/SignPageClient.tsx` for data fetching + rendering pattern
- Existing glassmorphic card style for the reading container

**Test scenarios:**
- Happy path: Reading display fetches and renders personalized horoscope
- Happy path: Philosopher attribution shows the selected council
- Happy path: "Browse all signs" link navigates correctly
- Happy path: "Edit your council" returns to philosopher grid step
- Error path: API failure shows friendly error with retry

**Verification:**
- Personalized reading renders for a sign + philosopher combination
- Reading content reflects the selected philosophers (not the default rotation)

---

### Phase 3: Email Delivery

- [ ] **Unit 7: Resend Integration + Email Template**

**Goal:** Set up Resend SDK and build the daily email template.

**Requirements:** R22, R23, R25, R26

**Dependencies:** None (can start in parallel with Phase 2)

**Files:**
- Create: `src/utils/email.ts` (Resend client, send function, template)
- Create: `src/utils/email-template.ts` (HTML email template builder)
- Test: `__tests__/utils/email.test.ts`

**Approach:**
- Install `resend` package
- Create Resend client with `RESEND_API_KEY` env var
- Email template: simple HTML (not React Email — avoid Tailwind rendering overhead per external research). Inline CSS only
- Template includes: sign symbol + name, "Guided by [philosophers]", full reading text, philosopher quote + attribution, share link, read-other-signs link, edit-philosophers link, unsubscribe link
- Subject line: "Your [Sign] reading • [Date]"
- Preview text: "Guided by [Philosopher 1], [Philosopher 2] & [Philosopher 3]"
- `from: 'readings@gettodayshoroscope.com'` (requires DNS verification — manual step)

**Patterns to follow:**
- External research Resend pattern for Next.js 15

**Test scenarios:**
- Happy path: `sendDailyEmail(subscriber)` constructs correct email with sign, philosophers, reading, and quote
- Happy path: Email template includes unsubscribe link with correct subscriber token
- Edge case: Subscriber with no philosopher selections gets default rotation reading
- Error path: Resend API failure is caught and logged (not thrown)

**Verification:**
- Email sends successfully via Resend (test with personal email)
- HTML renders correctly in major email clients (Gmail, Apple Mail)

---

- [ ] **Unit 8: Soft Email Gate on Homepage**

**Goal:** Add the email capture step between philosopher selection and full reading reveal.

**Requirements:** R18, R19, R20, R21

**Dependencies:** Units 5, 7

**Files:**
- Create: `src/components/home/EmailGate.tsx` (soft gate component)
- Modify: `src/components/home/HomeFlow.tsx` (add gate step between philosopher selection and reading)
- Modify: `src/app/api/subscribe/route.ts` (accept philosopher selections in POST body)
- Test: `__tests__/components/home/EmailGate.test.tsx`

**Approach:**
- After philosopher selection, show a 2-sentence reading preview + one quote from their selected philosopher (teaser)
- Below the teaser: "Your full reading is ready. Where should we send it?" with email input + "Unlock" button
- On submit: POST to `/api/subscribe` with email + sign + philosophers. Store all in Redis. Set email in Zustand. Reveal full reading inline (Framer Motion expand)
- Return visitors (email in Zustand): skip gate entirely
- Gate is a client component — inline in the flow, not a modal or page

**Patterns to follow:**
- `src/components/zodiac/EmailCapture.tsx` for the form pattern
- Existing `/api/subscribe/route.ts` for Redis storage

**Test scenarios:**
- Happy path: Email gate shows teaser preview + email input after philosopher selection
- Happy path: Valid email submission reveals full reading and stores to Redis
- Happy path: Return visitor (email in Zustand) never sees the gate
- Edge case: Invalid email shows inline validation error
- Edge case: Submission while loading is prevented (debounce)
- Integration: Redis contains email + sign + philosophers after submission

**Verification:**
- New visitors see the gate; return visitors don't
- Email + philosopher selections persist in Redis

---

- [ ] **Unit 9: Daily Email Cron**

**Goal:** Send personalized daily emails to all subscribers after horoscope generation.

**Requirements:** R22, R24

**Dependencies:** Units 7, 8

**Files:**
- Modify: `src/app/api/cron/daily-horoscope/route.ts` (add email sending after generation)
- Create: `src/app/api/unsubscribe/route.ts` (GET endpoint for one-click unsubscribe)
- Test: `__tests__/api/cron/daily-horoscope.test.ts`

**Approach:**
- After generating all 12 signs in the cron job, iterate over all subscribers in Redis
- For each subscriber: get their sign + philosopher selections, fetch (or generate) their personalized reading, send email via Resend
- Use `waitUntil()` to send emails in background (cron response returns immediately after generation)
- Send individually (not batch) per Vercel timeout constraint. Each `resend.emails.send()` is ~200ms
- Unsubscribe endpoint: `GET /api/unsubscribe?email=X&token=Y` removes from Redis. Token is a simple HMAC of the email + a secret
- At scale (100+ subscribers), may need to split sends across multiple cron invocations or use Resend batch API

**Patterns to follow:**
- Existing cron job pattern in `src/app/api/cron/daily-horoscope/route.ts`
- `waitUntil()` pattern from external research

**Test scenarios:**
- Happy path: Cron generates horoscopes then sends emails to all subscribers
- Happy path: Each subscriber gets a personalized email matching their sign + philosophers
- Happy path: Unsubscribe link removes subscriber from Redis
- Error path: Single email failure doesn't block other sends
- Edge case: Subscriber with deleted email (bounced) is handled gracefully
- Integration: `waitUntil()` allows cron to return 200 while emails send in background

**Verification:**
- Subscribers receive daily emails after cron runs
- Unsubscribe works via one-click link

---

### Phase 4: Social Sharing

- [ ] **Unit 10: Branded OG Quote Card**

**Goal:** Dynamic OG image endpoint that renders the day's philosopher quote as a branded card.

**Requirements:** R28, R29

**Dependencies:** Unit 4 (needs personalized generation to have quotes)

**Files:**
- Create: `src/app/api/og/[sign]/quote/route.tsx` (edge runtime)
- Test: manual visual verification (OG images aren't unit-testable)

**Approach:**
- Edge runtime using `ImageResponse` from `next/og`
- Accept query params: `?q=[quote]&a=[author]&date=[date]`
- Render: sign symbol + sign name + date at top, quote text (centered, Playfair Display), philosopher attribution, element gradient background, site URL watermark
- Use existing element color map from `src/app/api/og/[sign]/route.tsx`
- Load Playfair Display font as ArrayBuffer from Google Fonts
- Flexbox layout only (no CSS Grid — Satori limitation)
- Auto-cached on Vercel CDN via URL params as cache keys

**Patterns to follow:**
- `src/app/api/og/[sign]/route.tsx` for the existing OG pattern
- External research quote card template

**Test scenarios:**
- Test expectation: none — OG images verified visually via browser preview

**Verification:**
- `/api/og/aries/quote?q=The+impediment+to+action&a=Marcus+Aurelius&date=2026-04-02` returns a valid PNG
- Image renders correctly with quote text, attribution, and gradient

---

- [ ] **Unit 11: Share Button**

**Goal:** Add a share button to the reading display that shares the branded quote card.

**Requirements:** R27, R30

**Dependencies:** Units 6, 10

**Files:**
- Create: `src/components/home/ShareButton.tsx`
- Modify: `src/components/home/ReadingDisplay.tsx` (add share button)
- Modify: `src/app/horoscope/[sign]/SignPageClient.tsx` (update existing share to use new OG card)
- Test: `__tests__/components/home/ShareButton.test.tsx`

**Approach:**
- Use Web Share API (`navigator.share`) with fallback to clipboard copy
- Share data: title = "[Sign] Horoscope • [Date]", text = the philosopher quote, URL = sign page URL (which shows the new OG quote card as preview)
- Update sign page `generateMetadata` to use `/api/og/[sign]/quote` for the OG image (with today's quote + philosopher as params)
- Shared link pre-selects the sign in the first-visit flow via URL param

**Patterns to follow:**
- `src/app/horoscope/[sign]/SignPageClient.tsx` for existing `navigator.share` pattern

**Test scenarios:**
- Happy path: Share button triggers Web Share API on supported browsers
- Happy path: Clipboard fallback works when Web Share API unavailable
- Happy path: Shared URL includes sign parameter for pre-selection
- Edge case: Long quote text is truncated in share text (not in OG image)

**Verification:**
- Sharing on mobile shows the branded quote card in the share sheet preview
- Shared link opens to the correct sign's first-visit flow

---

### Phase 5: Agent-Native API

- [ ] **Unit 12: Public Guidance API**

**Goal:** JSON endpoint for agents to get philosophical guidance.

**Requirements:** R35, R36, R37, R40

**Dependencies:** Unit 4

**Files:**
- Create: `src/app/api/guidance/route.ts`
- Test: `__tests__/api/guidance.test.ts`

**Approach:**
- `GET /api/guidance?sign=[sign]&philosophers=[comma-separated]`
- Public, no auth (philosophical guidance should be freely accessible)
- Response: `{ sign, reading, short (first 2 sentences), quote, philosopher, date, peaceful_thought }`
- Reuses `generateHoroscope` internally with philosopher override
- Cache-friendly: same Redis caching as the main horoscope endpoint
- Rate limiting: basic IP-based throttle (10 requests/minute) to prevent abuse

**Patterns to follow:**
- `src/app/api/horoscope/route.ts` for the route handler pattern

**Test scenarios:**
- Happy path: `GET /api/guidance?sign=aries` returns JSON with all expected fields
- Happy path: `GET /api/guidance?sign=aries&philosophers=seneca,feynman` returns personalized reading
- Happy path: Response includes both `reading` (full) and `short` (2 sentences) fields
- Edge case: Invalid sign returns 400 with clear error message
- Edge case: Invalid philosopher name is ignored (falls back to default rotation for that slot)
- Error path: OpenAI failure returns 503 with retry-after header

**Verification:**
- API returns valid JSON for all 12 signs
- Personalized readings reflect the specified philosophers

---

- [ ] **Unit 13: MCP Server Package**

**Goal:** Publishable MCP server that injects philosophical grounding into Claude Code sessions.

**Requirements:** R38, R39, R41

**Dependencies:** Unit 12

**Files:**
- Create: `packages/mcp-server/package.json`
- Create: `packages/mcp-server/tsconfig.json`
- Create: `packages/mcp-server/tsup.config.ts`
- Create: `packages/mcp-server/src/index.ts`
- Create: `packages/mcp-server/README.md`
- Test: `packages/mcp-server/__tests__/server.test.ts`

**Approach:**
- Separate package in `packages/mcp-server/` — publishable to npm independently
- Uses `@modelcontextprotocol/server` TypeScript SDK with `StdioServerTransport`
- Exposes one tool: `get_daily_guidance` with params: `sign` (required), `philosophers` (optional comma-separated)
- Calls `https://api.gettodayshoroscope.com/api/guidance` under the hood
- Config file at `~/.config/horoscope-mcp/config.json` stores user's sign and philosopher preferences
- Tool names are `snake_case` per MCP spec
- Package name: `horoscope-philosophy-mcp` (check npm availability)

**Patterns to follow:**
- External research MCP server pattern (TypeScript SDK, tsup build, stdio transport)

**Test scenarios:**
- Happy path: MCP server starts and exposes `get_daily_guidance` tool
- Happy path: Calling `get_daily_guidance({ sign: 'aries' })` returns philosophical reading as text content
- Happy path: Config file is read for default sign and philosophers
- Edge case: Missing config file uses no defaults (requires sign param)
- Error path: API unreachable returns graceful error message

**Verification:**
- Server starts via `npx horoscope-philosophy-mcp`
- Tool appears in Claude Code's tool list when configured as MCP server

---

## System-Wide Impact

- **Content generation:** `generateHoroscope` gains a philosopher override path. Default behavior unchanged. Cache keys now vary by philosopher selections — more cache entries but same TTL
- **Redis data model:** `subscriber:{email}` hash gains a `philosophers` field (JSON array). `subscribers:{sign}` sets unchanged. New cache keys for personalized horoscopes
- **Homepage:** Complete replacement of the rendering layer. HoroscopeDisplay + ZodiacCard no longer rendered on homepage (still used on sign pages? No — sign pages use their own server components)
- **API surface:** New `/api/guidance` public endpoint. Existing `/api/horoscope` unchanged. New `/api/og/[sign]/quote` for dynamic quote cards. Updated `/api/subscribe` accepts philosopher selections
- **Build time:** Minimal impact — no new static pages (homepage is ISR)
- **Bundle size:** New homepage components replace old ones. Net change should be neutral or smaller (removing HoroscopeDisplay's 12-card parallel fetch logic)
- **Unchanged invariants:** Sign pages, monthly pages, sitemap, FAQ section, existing cron generation, daily TTL caching, OG sign images

## Risks & Dependencies

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| 50+ philosopher quote sourcing is slow | High | Blocks all phases | Start content work immediately. Ship Phase 1 as soon as 30+ philosophers are ready, expand to 50+ incrementally |
| Resend DNS verification delayed | Medium | Blocks Phase 3 | Set up Resend account and DNS records before starting Phase 3 code. Use Resend's free subdomain (`*.resend.dev`) for testing |
| Homepage redesign breaks existing SEO | Low | High | Sign pages (`/horoscope/[sign]`) are unchanged. Homepage was not a ranked page (DR 0). Monthly pages unchanged |
| Vercel 10s timeout on email sends at scale | Medium | Medium | `waitUntil()` extends function lifetime. At 100+ subscribers, split into chunks across multiple cron hits |
| MCP server npm name taken | Low | Low | Check availability before building. Fall back to `gettodayshoroscope-mcp` or similar |
| Visual regression on homepage redesign | Medium | Medium | Screenshot before/after. Keep sign pages and monthly pages untouched |

## Operational / Rollout Notes

- **Resend DNS setup** (manual, before Phase 3): Add SPF and DKIM records to gettodayshoroscope.com DNS. Verify in Resend dashboard
- **Environment variables:** Add `RESEND_API_KEY` to both Vercel projects. Add `UNSUBSCRIBE_SECRET` for HMAC token generation
- **MCP server publishing** (Phase 5): Publish to npm. Add to Claude Code MCP server listings/docs. Write installation instructions in README
- **Monitoring:** Track email open rates in Resend dashboard. Monitor `/api/guidance` usage for agent adoption. Track philosopher selection distribution (which philosophers are most popular?)

## Sources & References

- **Origin document:** [docs/brainstorms/2026-04-01-homepage-redesign-email-sharing-requirements.md](docs/brainstorms/2026-04-01-homepage-redesign-email-sharing-requirements.md)
- **Prior plan:** [docs/plans/2026-04-01-001-feat-seo-p0-implementation-plan.md](docs/plans/2026-04-01-001-feat-seo-p0-implementation-plan.md)
- **Project context:** [docs/PROJECT_CONTEXT.md](docs/PROJECT_CONTEXT.md)
- Related PRs: #27 (SEO P0), #29 (UI polish)
- External: Resend docs (resend.com/docs), MCP TypeScript SDK (github.com/modelcontextprotocol/typescript-sdk), Vercel OG docs (vercel.com/docs/og-image-generation)
