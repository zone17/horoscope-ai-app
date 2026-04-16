# Architecture: Today's Horoscope — Agent-Native Philosophy Engine

> **Last updated**: 2026-04-15
> **Canonical handoff**: [`docs/HANDOFF.md`](./HANDOFF.md)

---

## System Overview

Today's Horoscope is built on an **agent-native architecture**: 18 atomic tools in `src/tools/` are the source of truth for all business logic. API routes and the cron job are thin composers (under 60 lines each). An MCP server exposes 12 tools to external agents.

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
                    │ Pages (ISR)     │  │ /api/horoscope      │
                    │ Components      │  │ /api/cron/daily-    │
                    │ Rewrites→API    │  │     horoscope       │
                    │                 │  │ /api/og/[sign]      │
                    └─────────────────┘  │ /api/subscribe      │
                                         │ /api/unsubscribe    │
  MCP Agent ────────────────────────────>│                     │
  (packages/mcp-server)                  └──────────┬──────────┘
                                                    │
                                         ┌──────────▼──────────┐
                                         │   Upstash Redis     │
                                         │  (cache + subs +    │
                                         │   rate limiting)    │
                                         └──────────┬──────────┘
                                                    │
                                         ┌──────────▼──────────┐
                                         │   OpenAI API        │
                                         │  (gpt-4o-mini)      │
                                         └─────────────────────┘
```

---

## Tool Architecture (`src/tools/`)

Every tool is independently useful. You can call `getSignProfile('aries')` without generating a reading. API routes compose tools; they never contain business logic.

```
src/tools/
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
│   ├── keys.ts                     ← Cache key derivation (includes philosopher)
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
```

---

## Reading Generation Flow

```
User picks sign (Aries) + philosophers (Seneca, Alan Watts, Rumi)
  ↓
/api/horoscope?sign=aries&philosophers=Seneca,Alan+Watts,Rumi
  ↓
1. assignDaily({ sign, council, date })
   → Selects today's philosopher from the user's council
  ↓
2. retrieve({ sign, philosopher, date, council })
   → Checks personalized cache key, then daily-key fallback
   → Cache hit? Return immediately
  ↓
3. generateReading({ sign, philosopher, date })
   → Sign profile (voice, avoidPatterns) + writing format (rotates daily)
   → Verified quotes from quote-bank
   → OpenAI gpt-4o-mini with JSON response format
   → Validates output (author check, quote verification, self-match filter)
  ↓
4. store({ sign, philosopher, date, council, reading })
   → Cache key includes ALL inputs
  ↓
5. toSnakeCase(reading) → Response
```

---

## Two Vercel Projects

The codebase deploys to two Vercel projects from one repo:

| Project | Domain | Serves | Build |
|---------|--------|--------|-------|
| `horoscope-ai-api` | api.gettodayshoroscope.com | API routes, cron, OG images | `next build` |
| `horoscope-ai-frontend` | www.gettodayshoroscope.com | Pages, components, assets | `scripts/frontend-build.sh` |

The frontend build script moves `src/app/api/` out before building, then restores it. API routes are proxied via Vercel rewrites in `vercel.frontend.json`.

CI/CD (`.github/workflows/deploy.yml`) deploys both in parallel on merge to main, then runs health checks.

---

## MCP Server

`packages/mcp-server/src/index.ts` — 12 tools via MCP protocol.

Pure data tools (zodiac, philosopher) run locally. Generation and audience tools delegate to the API.

Tools: `zodiac_sign_profile`, `zodiac_sign_compatibility`, `philosopher_lookup`, `philosopher_list`, `philosopher_recommend`, `reading_generate`, `content_format`, `content_share_card`, `audience_subscribe`, `audience_unsubscribe`, `daily_publish`

---

## Legacy Utils (Migration Incomplete)

Old files in `src/utils/` still have active consumers. The tools in `src/tools/` are the canonical implementations, but these old files remain until all consumers are migrated:

| Old File | Replaced By |
|----------|-------------|
| `horoscope-generator.ts` | `tools/reading/generate.ts` |
| `horoscope-prompts.ts` | `tools/zodiac/sign-profile.ts` + `tools/reading/format-template.ts` |
| `horoscope-service.ts` | Direct API fetch |
| `cache-keys.ts` | `tools/cache/keys.ts` |
| `redis-helpers.ts` | `tools/cache/store.ts` + `tools/cache/retrieve.ts` |
| `feature-flags.ts` | No replacement yet (deeply embedded) |

---

## Key Constraints

| Constraint | Detail |
|-----------|--------|
| **Tailwind v3 only** | PostCSS uses `tailwindcss` (v3). Never use `@import "tailwindcss"` (v4). |
| **Function timeout 30s** | Set in `vercel.json`. Hobby plan max. |
| **No edge runtime on OpenAI routes** | OpenAI SDK crashes on edge. OG routes are edge (fine). |
| **Redis lazy-init** | App won't crash without Redis — just won't cache. |
| **Build must pass** | `ignoreBuildErrors` was removed. Build fails on real errors. |
