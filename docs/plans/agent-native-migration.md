# Agent-Native Migration Plan: Today's Horoscope

> **Status**: Approved — ready for execution
> **Created**: 2026-04-11
> **Principle**: Features are emergent behaviors from atomic tools, not code paths.
> **North Star**: "Can someone use this for something I never imagined?"

---

## Current State

A monolithic Next.js app where business logic is embedded in:
- `src/utils/` — prompt building, generation, caching, social posting
- `src/constants/` — philosopher data, zodiac metadata, quotes
- `src/app/api/` — 11 route handlers mixing orchestration + business logic
- `src/components/` — UI components tangled with state management
- `src/hooks/useMode.ts` — Zustand store mixing UI state + domain state

The Next.js app is the only consumer. Nothing is reusable outside it.

```
CURRENT: Monolith
┌─────────────────────────────────────────┐
│  Next.js App                            │
│  ┌───────────┐  ┌────────────────────┐  │
│  │ API Routes │  │ Components + State │  │
│  │ (11 mixed) │  │ (tangled)         │  │
│  ├───────────┤  └────────────────────┘  │
│  │ utils/    │                          │
│  │ prompts   │  ← ALL logic lives here  │
│  │ generator │                          │
│  │ cache     │                          │
│  │ social    │                          │
│  │ quotes    │                          │
│  └───────────┘                          │
└─────────────────────────────────────────┘
```

## Target State

Atomic tools exposed via MCP. Next.js app is one consumer. Agents, bots, CLIs,
social posting pipelines, email systems are all equal consumers.

```
TARGET: Agent-Native
┌──────────────────────────────────────┐
│  tools/                              │
│  ├── zodiac/                         │
│  │   ├── sign-profile.ts             │  ← "What is Aries like?"
│  │   └── sign-compatibility.ts       │  ← "Who matches with Scorpio?"
│  ├── philosopher/                    │
│  │   ├── registry-lookup.ts          │  ← "Who is Seneca? What tradition?"
│  │   ├── recommend-council.ts        │  ← "Suggest philosophers for Pisces"
│  │   └── assign-daily.ts            │  ← "Which philosopher for Aries today?"
│  ├── reading/                        │
│  │   ├── generate.ts                 │  ← "Generate reading for Aries + Seneca"
│  │   └── quote-bank.ts              │  ← "Get verified Seneca quotes"
│  ├── content/                        │
│  │   ├── format-social.ts            │  ← "Format reading for TikTok"
│  │   ├── format-share-card.ts        │  ← "Generate shareable image card"
│  │   ├── format-email.ts             │  ← "Format reading for email"
│  │   └── distribute.ts              │  ← "Post to Instagram + TikTok + X"
│  ├── audience/                       │
│  │   ├── subscribe.ts                │  ← "Add email subscriber"
│  │   ├── unsubscribe.ts              │  ← "Remove subscriber"
│  │   └── segment.ts                 │  ← "Get all Pisces subscribers"
│  └── cache/                          │
│      ├── reading-store.ts            │  ← "Cache reading, keyed on ALL inputs"
│      └── reading-retrieve.ts         │  ← "Get cached reading if fresh"
├── agents/                            │
│   ├── daily-publisher.md             │  ← "Generate + cache + email + social"
│   ├── social-poster.md               │  ← "Format + distribute content"
│   └── onboarding-guide.md           │  ← "Help user pick sign + council"
├── mcp-server.ts                      │  ← Exposes all tools via MCP
└── app/                               │  ← Next.js (one consumer of tools)
    ├── api/ (thin wrappers)           │
    └── components/ (UI only)          │
```

---

## Domain Verb Inventory

Every action in the problem space, mapped to an atomic tool:

### Zodiac Domain
| Verb | Tool | Input | Output |
|------|------|-------|--------|
| Look up a sign | `zodiac:sign-profile` | `{ sign }` | `{ personality, voice, element, dateRange, avoidPatterns }` |
| Check compatibility | `zodiac:sign-compatibility` | `{ sign, candidates? }` | `{ bestMatch, reasoning }` |

### Philosopher Domain
| Verb | Tool | Input | Output |
|------|------|-------|--------|
| Look up a philosopher | `philosopher:lookup` | `{ name }` | `{ name, tradition, bio, era, category }` |
| List by tradition | `philosopher:list` | `{ tradition?, era? }` | `{ philosophers[] }` |
| Recommend for sign | `philosopher:recommend` | `{ sign, count? }` | `{ recommended[], reasoning }` |
| Assign daily | `philosopher:assign-daily` | `{ sign, council[], date? }` | `{ philosopher, reason }` |

### Reading Domain
| Verb | Tool | Input | Output |
|------|------|-------|--------|
| Generate reading | `reading:generate` | `{ sign, philosopher, format? }` | `{ message, quote, quoteAuthor, peacefulThought, bestMatch }` |
| Get verified quote | `reading:quote-bank` | `{ philosopher, count? }` | `{ quotes[] }` |
| Get writing format | `reading:format-template` | `{ date? }` | `{ formatName, structure }` |

### Content Domain
| Verb | Tool | Input | Output |
|------|------|-------|--------|
| Format for platform | `content:format` | `{ reading, platform }` | `{ formatted, metadata }` |
| Generate share card | `content:share-card` | `{ sign, quote, author, style? }` | `{ imageUrl OR svgMarkup }` |
| Distribute | `content:distribute` | `{ content, platforms[], schedule? }` | `{ results[] }` |

### Audience Domain
| Verb | Tool | Input | Output |
|------|------|-------|--------|
| Subscribe | `audience:subscribe` | `{ email, sign? }` | `{ success, subscriberId }` |
| Unsubscribe | `audience:unsubscribe` | `{ email }` | `{ success }` |
| Segment | `audience:segment` | `{ sign?, tradition? }` | `{ subscribers[] }` |

### Cache Domain
| Verb | Tool | Input | Output |
|------|------|-------|--------|
| Store reading | `cache:store` | `{ key (auto from inputs), reading, ttl }` | `{ stored, key }` |
| Retrieve reading | `cache:retrieve` | `{ sign, philosopher, date }` | `{ reading OR null }` |
| Invalidate | `cache:invalidate` | `{ pattern }` | `{ cleared }` |

---

## Emergent Capabilities (What This Unlocks)

Compositions the agent can discover that we never explicitly build:

| User/Agent Says | Tool Composition | Never Built As Feature |
|----------------|------------------|----------------------|
| "Generate daily readings and post to all platforms" | `philosopher:assign-daily` → `reading:generate` → `content:format` × N → `content:distribute` | Daily publisher agent |
| "What would Seneca say to a Scorpio having a bad week?" | `zodiac:sign-profile` + `reading:generate(scorpio, seneca)` | On-demand philosophical advice |
| "Recommend a council for someone new to philosophy" | `philosopher:recommend` + `philosopher:lookup` × N | Onboarding recommender |
| "Send a push notification to all Aries subscribers" | `audience:segment(aries)` + `content:format(push)` | Targeted notifications |
| "Create a TikTok series: each sign debates Nietzsche" | `zodiac:sign-profile` × 12 + `reading:generate(*, nietzsche)` × 12 + `content:format(tiktok)` × 12 | Content series generator |
| "Which philosopher has the most resonant quotes for water signs?" | `zodiac:sign-profile(cancer,scorpio,pisces)` + `reading:quote-bank` × all + scoring | Cross-domain analytics |
| "Set up a Telegram bot that gives daily readings" | All reading tools + `content:format(telegram)` | Telegram bot |

---

## Extraction Sequence

Order matters — later tools depend on earlier ones.

### Phase 1: Foundation (Day 1)

**Extract the data layer — what exists, what is it, where is it.**

| Tool | Extracts From | Current Location |
|------|--------------|-----------------|
| `zodiac:sign-profile` | `SIGN_PERSONALITIES` + `SIGN_META` | `horoscope-prompts.ts` + `constants/zodiac.ts` |
| `philosopher:lookup` | `PHILOSOPHERS` array | `constants/philosophers.ts` |
| `philosopher:list` | `PHILOSOPHERS` filtered by tradition | `constants/philosophers.ts` |
| `reading:quote-bank` | `VERIFIED_QUOTES` | `verified-quotes.ts` |

**Also on Day 1 (hygiene):**
- Fix philosopher taxonomy (Epicurus → Epicureanism, Socrates/Plato/Aristotle → Classical)
- Delete dead files (`horoscope-generator 2.ts`, `verified-quotes 2.ts`)
- Remove `ignoreBuildErrors: true` from next.config.js
- Fix `maxDuration` (10 → 30)
- Fix web-vitals imports (getCLS → onCLS)
- Delete broken legacy components (Header.tsx, ZodiacCard.tsx in /components/)

**Test**: Each tool works independently via CLI/test. `philosopher:lookup("Seneca")` returns
correct data without needing any other tool to have run.

### Phase 2: Intelligence (Day 2)

**Extract the decision-making layer — what should happen, for whom, when.**

| Tool | Extracts From | Current Location |
|------|--------------|-----------------|
| `philosopher:recommend` | New — sign personality → philosopher affinity scoring | Does not exist yet |
| `philosopher:assign-daily` | `getPhilosopherAssignment()` + council rotation | `horoscope-generator.ts` |
| `reading:format-template` | `WRITING_FORMATS` daily rotation | `horoscope-prompts.ts` |
| `zodiac:sign-compatibility` | Element-based matching logic | `horoscope-prompts.ts` |

**Test**: `philosopher:assign-daily({ sign: "aries", council: ["Seneca", "Feynman"], date: "2026-04-11" })`
returns `{ philosopher: "Seneca", reason: "Day rotation index 0" }` — no reading generated,
no cache touched, no API called.

### Phase 3: Generation (Day 3)

**Extract the core generation — the reading itself.**

| Tool | Extracts From | Current Location |
|------|--------------|-----------------|
| `reading:generate` | `buildHoroscopePrompt()` + `generateHoroscope()` | `horoscope-prompts.ts` + `horoscope-generator.ts` |
| `cache:store` | Redis write logic | `redis-helpers.ts` + `cache.ts` |
| `cache:retrieve` | Redis read logic + key generation | `cache.ts` + `cache-keys.ts` |

**Key change**: `reading:generate` takes explicit inputs (sign, philosopher, format).
The cache keys on ALL inputs automatically — no more "forgot to include philosopher in the key."

**The API routes become thin**:
```typescript
// api/horoscope/route.ts — AFTER migration
// 1. Parse inputs
// 2. cache:retrieve(inputs)
// 3. If miss: philosopher:assign-daily → reading:generate → cache:store
// 4. Return
// No business logic in the route itself
```

**Test**: `reading:generate({ sign: "aries", philosopher: "Seneca", format: "scene-insight-question" })`
produces a complete reading object. Works from CLI, API route, cron job, or Telegram bot equally.

### Phase 4: Distribution (Day 4)

**Extract the output layer — how readings reach users.**

| Tool | Extracts From | Current Location |
|------|--------------|-----------------|
| `content:format` | New — reading → platform-specific format | `social-posting.ts` (partial) |
| `content:share-card` | New — generates visual share card from reading | Does not exist |
| `content:distribute` | `postVideoToSocial()` | `social-posting.ts` |
| `audience:subscribe` | Subscribe logic | `api/subscribe/route.ts` |
| `audience:unsubscribe` | Unsubscribe logic | `api/unsubscribe/route.ts` |
| `audience:segment` | New — query subscribers by sign/tradition | Does not exist |

**Also on Day 4:**
- Add rate limiting to `audience:subscribe`
- Build the share card generator (constellation icon + quote + dark bg)
- Wire Ayrshare through `content:distribute`

### Phase 5: Wire Up + Ship (Day 5)

**Reconnect the Next.js app as a consumer of tools.**

- API routes become thin wrappers calling tools
- HomeFlow state simplified — `council-manager` handles lifecycle
- Remove duplicate routes (`/api/guidance`, `/api/openai-enhanced`, `/api/openai-test`)
- Fix remaining P1s from wave audit (contrast, a11y, meta tags)
- `philosopher:recommend` powers the "suggested council" UI (fixes 54-card overwhelm)
- MCP server exposes all tools for agents/bots

---

## File Structure After Migration

```
src/
├── tools/                          # Atomic tools (the verbs)
│   ├── zodiac/
│   │   ├── sign-profile.ts         # Sign personality, voice, element
│   │   ├── sign-profile.test.ts
│   │   ├── sign-compatibility.ts   # Element-based matching
│   │   └── sign-compatibility.test.ts
│   ├── philosopher/
│   │   ├── registry.ts             # Single source of truth (data + taxonomy)
│   │   ├── registry.test.ts
│   │   ├── lookup.ts               # Query single philosopher
│   │   ├── list.ts                 # Filter by tradition/era
│   │   ├── recommend.ts            # Sign → suggested council
│   │   ├── recommend.test.ts
│   │   ├── assign-daily.ts         # Council rotation for today
│   │   └── assign-daily.test.ts
│   ├── reading/
│   │   ├── generate.ts             # Core AI generation
│   │   ├── generate.test.ts
│   │   ├── quote-bank.ts           # Verified quotes access
│   │   ├── quote-bank.test.ts
│   │   └── format-template.ts      # Writing format rotation
│   ├── content/
│   │   ├── format.ts               # Reading → platform format
│   │   ├── format.test.ts
│   │   ├── share-card.ts           # Generate visual card
│   │   ├── share-card.test.ts
│   │   └── distribute.ts           # Post to platforms via Ayrshare
│   ├── audience/
│   │   ├── subscribe.ts
│   │   ├── unsubscribe.ts
│   │   └── segment.ts
│   └── cache/
│       ├── store.ts                # Redis write, auto-keyed
│       ├── retrieve.ts             # Redis read
│       └── invalidate.ts
├── mcp-server.ts                   # Exposes all tools via MCP protocol
├── app/                            # Next.js (consumer of tools)
│   ├── api/                        # Thin route wrappers
│   │   ├── horoscope/route.ts      # cache:retrieve → reading:generate → cache:store
│   │   ├── subscribe/route.ts      # audience:subscribe (with rate limit)
│   │   ├── unsubscribe/route.ts    # audience:unsubscribe
│   │   └── cron/daily-horoscope/route.ts  # Daily publisher agent composition
│   ├── page.tsx
│   └── horoscope/[sign]/
├── components/                     # UI only — no business logic
│   ├── home/
│   ├── zodiac/
│   ├── icons/
│   └── layout/
├── hooks/
│   └── useMode.ts                  # UI state only (theme, view preferences)
└── agents/                         # Agent definitions
    ├── daily-publisher.md           # Generates + caches + emails + posts
    ├── social-poster.md             # Formats + distributes content
    └── onboarding-guide.md          # Helps users build their council
```

---

## What Gets Deleted

| File | Reason |
|------|--------|
| `src/utils/horoscope-generator.ts` | Replaced by `tools/reading/generate.ts` + `tools/philosopher/assign-daily.ts` |
| `src/utils/horoscope-generator 2.ts` | Dead duplicate |
| `src/utils/horoscope-prompts.ts` | Split into `tools/zodiac/sign-profile.ts` + `tools/reading/format-template.ts` |
| `src/utils/horoscope-service.ts` | Thin wrapper — replaced by direct tool calls |
| `src/utils/social-posting.ts` | Replaced by `tools/content/format.ts` + `tools/content/distribute.ts` |
| `src/utils/verified-quotes.ts` | Replaced by `tools/reading/quote-bank.ts` |
| `src/utils/verified-quotes 2.ts` | Dead duplicate |
| `src/utils/cache.ts` | Replaced by `tools/cache/` |
| `src/utils/cache-keys.ts` | Cache keys derived from tool inputs automatically |
| `src/utils/redis-helpers.ts` | Absorbed into `tools/cache/store.ts` |
| `src/utils/feature-flags.ts` | Most flags become dead after refactor; remaining move to env |
| `src/constants/philosophers.ts` | Replaced by `tools/philosopher/registry.ts` |
| `src/constants/zodiac.ts` | Replaced by `tools/zodiac/sign-profile.ts` |
| `src/app/api/guidance/route.ts` | Duplicate of /api/horoscope — removed |
| `src/app/api/openai-enhanced/route.ts` | Dead/test route |
| `src/app/api/openai-test/route.ts` | Dead/test route |
| `src/components/HoroscopeDisplay.tsx` | Dead legacy component |
| `src/components/ZodiacCard.tsx` | Dead legacy component (broken import) |
| `src/components/Header.tsx` | Dead legacy component (broken import) |
| `src/utils/web-vitals.ts` | Broken imports, replace with onCLS/etc. or remove |

---

## P0 Resolution Map

Every P0 from the 5-wave audit, mapped to which migration phase resolves it:

| P0 | Resolution | Phase |
|----|-----------|-------|
| #1 Philosopher miscategorization | `philosopher:registry` with validated taxonomy | Phase 1 |
| #2 Cache key ignores philosophers | `cache:store` auto-keys on all inputs | Phase 3 |
| #3 ignoreBuildErrors | Remove flag, fix errors exposed | Phase 1 |
| #4 Function timeout 10s | Fix vercel.json | Phase 1 |
| #5 No rate limiting on subscribe | `audience:subscribe` with built-in rate limit | Phase 4 |
| #6 Cron no Redis fallback | Daily publisher agent uses tools with error handling | Phase 4 |
| #7 Edit council state bug | UI state separated from domain state | Phase 5 |
| #8 web-vitals broken | Delete or fix | Phase 1 |
| #9 Email gate visibility | UX fix during Phase 5 wiring | Phase 5 |
| #10 No share card | `content:share-card` tool | Phase 4 |
| #11 No guided philosopher path | `philosopher:recommend` tool | Phase 2 |
| #12 Broken legacy imports | Delete dead files | Phase 1 |
| #13 Duplicate dead files | Delete | Phase 1 |

---

## Success Criteria

After migration, these must all be true:

1. **Every tool works from CLI**: `npx ts-node tools/reading/generate.ts --sign aries --philosopher Seneca` produces a reading
2. **MCP server exposes all tools**: An agent with access to the MCP server can generate, format, and distribute content without touching Next.js
3. **Next.js routes are < 20 lines each**: They parse inputs, call tools, return responses
4. **No business logic in components**: Components render data, call tools via API, manage UI state only
5. **Zero P0s from the 5-wave audit**: All 13 resolved
6. **Agent can compose unforeseen features**: "Generate a reading for every sign and format as a weekly email digest" works without new code
