# Today's Horoscope — Philosophy Engine

A personal philosophy engine where users pick their zodiac sign, select up to 5 philosophers from 54 thinkers across 9 traditions, and receive daily personalized readings. Not predictions — philosophy that meets you where you are.

**Live:** [www.gettodayshoroscope.com](https://www.gettodayshoroscope.com) | **API:** [api.gettodayshoroscope.com](https://api.gettodayshoroscope.com)

## Architecture

Agent-native architecture: 18 atomic tools in `src/tools/`, composed by thin API routes. MCP server exposes 12 tools to external agents.

- **Stack:** Next.js 15.5.14, TypeScript, Tailwind CSS, Upstash Redis, OpenAI (gpt-4o-mini), Resend, Ayrshare
- **Hosting:** Vercel (two projects — API + Frontend)
- **Tests:** 120 tool tests, zero mocks, 0.8s

See [`docs/HANDOFF.md`](./docs/HANDOFF.md) for the full architecture, tool tree, and development guide.
See [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) for system diagrams and data flow.

## Getting Started

```bash
npm install
cp .env.example .env.local  # Fill in API keys (or: vercel env pull .env.local)
npm run dev
```

Build: `npx next build` (must pass with zero errors)

MCP server: `cd packages/mcp-server && npm run build && npm start`

Tests: `npm test` (120 tests, 0.8s)

## Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `OPENAI_API_KEY` | Yes | AI generation |
| `UPSTASH_REDIS_REST_URL` | Yes (prod) | Cache + subscribers + rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | Yes (prod) | Redis auth |
| `RESEND_API_KEY` | For email | Daily email sending |
| `CRON_SECRET` | For cron | Secures /api/cron/daily-horoscope |
| `AYRSHARE_API_KEY` | For social | Multi-platform posting |

Redis is lazy-initialized — app won't crash without it, just won't cache.

## Deployment

Two Vercel projects deploy from this repo via CI/CD (`.github/workflows/deploy.yml`):
- **API** (`api.gettodayshoroscope.com`) — `next build`
- **Frontend** (`www.gettodayshoroscope.com`) — `scripts/frontend-build.sh`

## Documentation

| Doc | Purpose |
|-----|---------|
| [`docs/HANDOFF_2026-04-29_AUDIT.md`](./docs/HANDOFF_2026-04-29_AUDIT.md) | **START HERE** — comprehensive audit + PRD-vs-reality gap + prioritized next steps + domain-expert team brief for next session |
| [`docs/HANDOFF.md`](./docs/HANDOFF.md) | Prior sprint's video-work handoff — useful as code-level reference, partially stale on production state |
| [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) | System diagrams, data flow, constraints |
| [`docs/PROJECT_CONTEXT.md`](./docs/PROJECT_CONTEXT.md) | Full context — design system, SEO, competitive positioning |
| [`docs/AGENT_HANDOFF.md`](./docs/AGENT_HANDOFF.md) | Historical (pre-migration) — retained for design/SEO reference |

## Domain Architecture

Two Vercel projects from one repo:
- **Frontend**: `https://www.gettodayshoroscope.com`
- **Backend API**: `https://api.gettodayshoroscope.com`

Locally, both run on the same server (`npm run dev`). In production, the frontend build excludes API routes and proxies them via Vercel rewrites.
