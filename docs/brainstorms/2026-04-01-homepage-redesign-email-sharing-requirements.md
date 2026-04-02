---
date: 2026-04-01
topic: homepage-redesign-philosopher-engine
---

# Personal Philosophy Engine — Homepage Redesign + Philosopher Selection + Email + Sharing

## Problem Frame

The current product generates unique philosophical horoscopes daily but has no defensible edge — anyone can ask ChatGPT for a philosophical horoscope. The product also has no growth loop (no email delivery, no sharing, no viral mechanics), a cluttered homepage with competing CTAs (scored 4/10 on Decision Architecture), and hides its AI nature behind a fake persona.

**The insight:** The moat isn't the horoscope. It's **personalized philosopher selection**. Let users pick their 3-5 favorite philosophers/spiritual leaders from a curated roster of 50+. Every morning, the AI blends those chosen voices with the user's zodiac sign and the day's energy to deliver guidance that ChatGPT can't replicate — because it doesn't know your philosophers, your sign, or your journey over time.

**The positioning shift:** From "a horoscope site" to "a personal philosophy engine." AI-transparent, philosophy-forward. "We gave an AI the world's greatest thinkers and asked it one question every morning: what does YOUR sign need to hear today?"

## User Flow

```
┌─────────────────────────────────────────┐
│           FIRST VISIT                    │
│                                          │
│  "We trained an AI on 50+ of the        │
│   world's greatest philosophers          │
│   so it could guide you every morning."  │
│                                          │
│  Step 1: What's your sign?               │
│  [12 sign buttons]                       │
│            │                             │
│            ▼                             │
│  Step 2: Build your council              │
│  Categorized philosopher grid            │
│  (Stoicism, Eastern, Science,            │
│   Poetry, Spiritual, Modern)             │
│                                          │
│  Tap a philosopher → live preview        │
│  updates below showing YOUR sign +       │
│  THEIR voice. Feels alive.               │
│                                          │
│  "YOUR COUNCIL (3/5)"                    │
│  [Seneca ✓] [Feynman ✓] [Rumi ✓]       │
│            │                             │
│            ▼                             │
│  Step 3: Soft gate                       │
│  Preview: 2 sentences + quote from       │
│  your selected philosopher               │
│                                          │
│  "Your reading is ready.                 │
│   Where should we send it?"              │
│  [email] [Unlock]                        │
│            │                             │
│            ▼                             │
│  Step 4: Full reading revealed           │
│  Blends your sign + your philosophers    │
│  + Share button (branded quote card)     │
│  + "Get this every morning" ✓            │
│                                          │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│          RETURN VISIT                    │
│  (sign + philosophers + email stored)    │
│                                          │
│  "Good morning, Aries."                 │
│  "Guided by Seneca, Feynman & Rumi"     │
│                                          │
│  [Full personalized reading]             │
│  [Share] [Edit council] [Other signs]    │
│                                          │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│          SHARE → ACQUISITION             │
│                                          │
│  Share button → branded quote card       │
│  (quote + philosopher + sign + gradient) │
│            │                             │
│            ▼                             │
│  Recipient sees beautiful card in        │
│  iMessage / X / Instagram / Facebook     │
│            │                             │
│            ▼                             │
│  Taps link → First Visit flow            │
│  Thought: "I want MY philosophers"       │
│                                          │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│          DAILY EMAIL                     │
│                                          │
│  Subject: Your Aries reading • Apr 2     │
│  "Guided by Seneca, Feynman & Rumi"     │
│                                          │
│  Full personalized reading               │
│  Philosopher quote + attribution         │
│  [Share your reading →]                  │
│  [Read other signs →]                    │
│  [Edit your philosophers →]              │
│  [Unsubscribe]                           │
│                                          │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│     SPRINT 2 (future): VIDEO ENGINE      │
│     (background, no user-facing UI)      │
│                                          │
│  Daily quotes → auto-generate videos     │
│  → auto-post to TikTok, Reels, X, FB    │
│  → viewers click → First Visit flow      │
│                                          │
│  12 signs × multiple philosophers =      │
│  hundreds of unique videos per month     │
│                                          │
└─────────────────────────────────────────┘
```

## Requirements

**Homepage Redesign**

- R1. Replace the 12-card grid homepage with a step-by-step flow: sign picker → philosopher selection → soft gate → personalized reading
- R2. First visit shows all steps sequentially. Each step transitions smoothly (not a page reload — inline expansion or scroll-to-reveal)
- R3. Return visit (sign + philosophers + email in localStorage/Zustand): skip straight to personalized reading with greeting
- R4. "Browse all signs" and "Edit your council" links available from the reading view
- R5. Homepage copy is AI-transparent and philosophy-forward: "We trained an AI on 50+ of the world's greatest philosophers so it could guide you every morning"
- R6. Remove the ZodiacCard inline modal and the 12-card HoroscopeDisplay grid
- R7. Keep FAQ section at bottom of homepage
- R8. Keep existing sign pages (`/horoscope/[sign]`) as ungated, SEO-indexable pages for organic search traffic

**Philosopher Selection**

- R9. Curated roster of 50+ philosophers/spiritual leaders/thinkers, each with verified quotes (10+ per thinker)
- R10. Philosophers organized by tradition: Stoicism, Eastern Wisdom, Science & Wonder, Poetry & Soul, Spiritual Leaders, Modern Thinkers (6 categories)
- R11. Each philosopher shown as a tappable card with name, one-line description, and tradition tag
- R12. Tapping a philosopher instantly updates a live reading preview below the grid — shows the user's sign + selected philosophers' voice blended together
- R13. Users select 3-5 philosophers to form their "council"
- R14. Selected philosophers stored in localStorage/Zustand (no account needed)
- R15. Philosopher selections also stored in Redis alongside subscriber data for email personalization
- R16. "Edit your council" available from reading view and email — returns to philosopher grid with current selections highlighted
- R17. All philosophers available to all users (free — no paywall, monetize later)

**Soft-Gated Email Capture**

- R18. After philosopher selection, show a reading preview (2 sentences + quote from one of their selected philosophers)
- R19. Email gate: "Your reading is ready. Where should we send it?" with email input + unlock button
- R20. On email submit: full reading revealed inline + subscriber stored in Redis with sign + philosopher selections
- R21. Return visitors (email already captured) see full reading immediately — no gate

**Email Delivery**

- R22. Daily email sent via Resend after horoscope generation
- R23. Email contains: full personalized reading, philosopher quote with attribution, share link, read-other-signs link, edit-philosophers link, unsubscribe link
- R24. Unsubscribe link in every email (CAN-SPAM compliance) — removes subscriber from Redis
- R25. Resend requires DNS verification for `gettodayshoroscope.com` (DKIM/SPF records)
- R26. Subject line: "Your [Sign] reading • [Date]" with "Guided by [Philosopher 1], [Philosopher 2] & [Philosopher 3]" as preview text

**Social Sharing**

- R27. Share button on reading (homepage and sign pages) using Web Share API with clipboard fallback
- R28. Share generates a branded OG quote card: philosopher quote, author attribution, sign symbol, element gradient background, date, site URL (1200x630)
- R29. New dynamic OG endpoint `/api/og/[sign]/quote` that renders the day's actual quote text
- R30. Shared link includes sign param so the first-visit flow pre-selects that sign

**Content Engine Expansion**

- R31. Expand verified quote bank from 140+ quotes (14 philosophers) to 500+ quotes (50+ philosophers)
- R32. Each new philosopher needs: name, tradition category, one-line description, and 10+ verified source-cited quotes
- R33. Generation pipeline (horoscope-generator.ts) updated to accept user's philosopher selections and blend their voices into the reading
- R34. If a user has selected philosophers, the daily reading draws from THEIR selected pool. If no selection (SEO visitors on sign pages), use the existing rotation

**Agent-Native Access**

- R35. Public JSON API endpoint `GET /api/guidance?sign=[sign]&philosophers=[comma-separated]` returns today's personalized reading as structured JSON (sign, reading, quote, philosopher, date, peaceful_thought)
- R36. API works without authentication for read access — philosophical guidance should be freely accessible to any agent
- R37. Response includes both the full reading and a short version (1-2 sentences) for agents that want a brief grounding
- R38. Packaged MCP server that any Claude Code user can install — calls the guidance API and injects philosophical grounding into agent sessions
- R39. MCP server configurable with sign and philosopher preferences (stored in MCP config, not requiring the website)
- R40. Agent access documented with clear API reference — developers and agent builders can integrate without visiting the site
- R41. Same content engine serves humans (website + email) and agents (API + MCP) — one generation pipeline, multiple delivery formats

**Brand Positioning**

- R42. AI-transparent: "We trained an AI on the world's greatest philosophers so it could be your personal guide every morning"
- R43. De-emphasize Elena Vasquez persona on homepage. Keep about page as background context
- R44. Position: AI is the delivery mechanism, philosophy is the value. The council of philosophers is the product
- R45. Dual-audience positioning: "For humans and their AI agents" — philosophical grounding for anyone (or anything) that thinks

## Success Criteria

- Email capture rate: >5% of homepage visitors who reach the email gate enter their email
- Philosopher selection completion: >70% of users who start selecting philosophers pick at least 3
- Return visit rate: >20% of email subscribers return to the site within 7 days
- Share rate: >2% of readers who see the share button tap it
- Daily email open rate: >40%
- Homepage bounce rate decreases vs current
- API adoption: >10 unique agent callers within first month of MCP server publication
- API response time: <500ms for cached readings, <5s for generation

## Scope Boundaries

- NOT building daily archive pages in this sprint (Sprint 2)
- NOT building video generation / auto-posting pipeline in this sprint (Sprint 2)
- NOT building user accounts or login — localStorage + Redis is sufficient
- NOT building a settings/preferences page beyond the philosopher grid
- NOT implementing premium tier or payments — everything is free for now
- NOT sending email to existing Redis subscribers retroactively
- NOT changing the core OpenAI generation call structure — extending it to accept philosopher selections

## Key Decisions

- **Personalized philosopher selection is the moat**: This is what ChatGPT can't replicate — a persistent relationship between you, your sign, and your chosen thinkers that evolves daily
- **50+ philosophers, all free**: Go wide on the roster. No paywall on philosopher selection. Build the audience first, monetize later
- **Soft gate over hard gate**: Show preview content before requiring email. Users taste the personalized reading, then commit their email to unlock the full version
- **AI-transparent positioning**: Honest about AI generation. "We trained an AI on philosophers" is a feature, not a secret
- **Live preview on philosopher selection**: Tapping a philosopher instantly shows how their voice blends with your sign. This is the cutting-edge UX — the product feels alive and responsive
- **Resend for email delivery**: Simplest API, free tier (100/day), built for Vercel
- **Full reading in email**: The email IS the product for subscribers. Building the daily inbox habit > driving site clicks
- **Branded quote cards for sharing**: Philosopher quote is the most shareable unit. Beautiful card with quote + sign + gradient drives curiosity ("what would MY philosophers say?")
- **Video engine is Sprint 2**: Ship the user-facing product first, then build the automated marketing pipeline

## Dependencies / Assumptions

- Resend account + DNS verification for gettodayshoroscope.com (manual step)
- `RESEND_API_KEY` environment variable added to Vercel
- 50+ philosopher quote bank needs to be sourced and verified — significant content work
- Existing daily cron job hooks into email sending
- Vercel hobby plan 10s timeout — emails sent individually, may need queue for scale
- localStorage/Zustand already stores userSign — extend to store philosopher selections

## Outstanding Questions

### Resolve Before Planning

- None — all product decisions resolved during brainstorm

### Deferred to Planning

- [Affects R33][Technical] How to modify the prompt builder to accept user's philosopher selections while preserving the existing rotation for non-personalized requests
- [Affects R12][Needs research] Best approach for the live preview — should it call OpenAI on each philosopher tap (expensive, slow) or use pre-generated sample quotes per philosopher (fast, static)?
- [Affects R22][Technical] How to handle Vercel 10s timeout when sending emails to many subscribers
- [Affects R31][Content] Strategy for sourcing and verifying 350+ new quotes for 36+ new philosophers — manual curation vs automated sourcing with human verification
- [Affects R29][Technical] Whether to extend existing `/api/og/[sign]` or create new `/api/og/[sign]/quote` endpoint
- [Affects R2][Needs research] Animation/transition approach for the step-by-step flow — inline expansion, scroll-reveal, or page sections

## Next Steps

→ `/ce:plan` for structured implementation planning
