---
title: "feat: Product & Design Overhaul — 20-Point Remediation"
type: feat
status: active
date: 2026-03-31
origin: 6-agent expert review (design director, product strategist, UX researcher, content strategist, conversion optimizer, brand strategist)
---

# Product & Design Overhaul

## Overview

6 expert review agents (design director, CPO, UX researcher, content strategist, CRO specialist, brand strategist) audited the live site and codebase. This plan addresses all 20 prioritized actions across 4 parallel squads.

## Problem Frame

The content engine is A-tier (sign-specific voices, verified quotes, format rotation). But the product shell is pre-MVP: zero retention mechanics, broken sign pages, contradictory brand copy, 82MB video payload, no analytics, no growth loops. The brand says "celestial guidance" while the product delivers Seneca and Feynman.

## Squad Architecture

```
Squad A: Content & Prompts          Squad B: Infrastructure & Growth
==========================          ================================
5.  Fix misattributed quotes        1.  Fix sign page 404s
13. Tighten prompts (40-60 words)   3.  Add analytics
18. Add planetary/transit context    4.  PWA manifest + install prompt
                                    8.  Push notifications
                                    9.  Shareable OG image generation
                                    10. Reading streak counter
                                    17. Email capture + daily digest

Squad C: Frontend & Design          Squad D: SEO & New Pages
==========================          ========================
2.  Rewrite hero copy               15. 66 compatibility pages
6.  Single-sign default view        16. Weekly forecast content
7.  Element-based accent colors     19. Premium tier (Stripe + paywall)
11. Night mode visual design
12. Shrink hero, remove video banners
14. Fix accessibility (focus trap, keyboard, motion)
20. Display serif typeface
```

## Implementation Units

### Squad A: Content & Prompts

- [ ] **A1: Fix 5 misattributed quotes in verified-quotes.ts**
  - Remove Plato "Be kind, for everyone you meet..." (Ian Maclaren)
  - Remove Socrates "Strong minds discuss ideas..." (Eleanor Roosevelt)
  - Remove Socrates "The secret of change..." (Dan Millman novel)
  - Remove/fix Dispenza "The best way to predict the future..." (Peter Drucker)
  - Remove Nietzsche duplicate (lines 97-98 vs 100-101)
  - Replace each with a verified quote from the same philosopher
  - Files: src/utils/verified-quotes.ts

- [ ] **A2: Tighten prompt system**
  - Change word count target from 40-80 to 40-60
  - Expand banned word list: add "radiant", "vibrant", "manifest", "align", "resonate", "ignite", "illuminate", "nurture", "unfold"
  - Add bad-example field to each sign personality
  - Strengthen peaceful thought: "ONE sentence for 10pm, 15-25 words, descending energy only"
  - Add quote-message coherence instruction
  - Files: src/utils/horoscope-prompts.ts

- [ ] **A3: Add planetary/transit/moon context**
  - Create src/utils/astro-context.ts with getAstroContext(date)
  - Hardcode 2026 Mercury retrograde dates, moon phases, major transits
  - Inject into prompt as optional ASTROLOGICAL CONTEXT section
  - Files: src/utils/astro-context.ts (new), src/utils/horoscope-prompts.ts

### Squad B: Infrastructure & Growth

- [ ] **B1: Fix sign page 404s**
  - Diagnose: the frontend Vercel project (horoscope-ai-frontend) needs the /horoscope/[sign] routes deployed
  - The API project has the routes but the frontend project serves gettodayshoroscope.com
  - May need to deploy sign pages to the frontend project or configure routing
  - Files: src/app/horoscope/[sign]/page.tsx, vercel.frontend.json

- [ ] **B2: Add analytics**
  - Add Vercel Analytics (built-in, zero config)
  - Add custom events: sign_selected, reading_opened, share_tapped, night_mode_toggled, streak_day
  - Files: src/app/layout.tsx, package.json

- [ ] **B3: PWA manifest + service worker**
  - Create public/manifest.json with app name, icons, theme colors
  - Create public/sw.js service worker for offline cache of last reading
  - Add manifest link to layout.tsx
  - Add "Add to Home Screen" prompt after first sign selection
  - Files: public/manifest.json (new), public/sw.js (new), src/app/layout.tsx

- [ ] **B4: Push notifications**
  - Service worker push subscription
  - Prompt after sign selection (not on first load)
  - Store subscription in localStorage (server-side push infra deferred)
  - Daily notification format: "[Sign symbol] [Sign]: [first sentence]"
  - Files: public/sw.js, src/components/zodiac/PushPrompt.tsx (new)

- [ ] **B5: Shareable OG image generation**
  - Create src/app/api/og/[sign]/route.tsx using @vercel/og (Satori)
  - Element-specific gradient backgrounds
  - Sign symbol + name + pull quote + date + watermark URL
  - Update /horoscope/[sign] metadata to use og:image pointing to this endpoint
  - Set twitter:card to summary_large_image
  - Files: src/app/api/og/[sign]/route.tsx (new), src/app/horoscope/[sign]/page.tsx

- [ ] **B6: Reading streak counter**
  - Add streak state to Zustand store: lastReadDate, streakCount
  - Increment on daily read, reset if day is missed
  - Display streak badge on user's sign card ("Day 7")
  - Files: src/hooks/useMode.ts, src/components/zodiac/ZodiacCard.tsx

- [ ] **B7: Email capture + daily digest**
  - Simple email input component below reading: "Get your daily [sign] reading by email"
  - Store emails in Upstash Redis (no email service integration yet — just capture)
  - Files: src/components/zodiac/EmailCapture.tsx (new), src/app/api/subscribe/route.ts (new)

### Squad C: Frontend & Design

- [ ] **C1: Rewrite hero copy**
  - Replace "Today's Horoscope" h1 with "Your sign is not a prediction. It is a lens."
  - Replace subtitle with philosopher-forward copy
  - Remove "celestial guidance" from all surfaces
  - Files: src/components/zodiac/HoroscopeDisplay.tsx, src/app/layout.tsx (meta description)

- [ ] **C2: Single-sign default view**
  - Sign picker selection navigates to /horoscope/[sign] instead of reordering grid
  - Return visitors with saved sign go directly to their sign page
  - Grid becomes "Browse all signs" secondary view
  - Files: src/components/zodiac/SignPicker.tsx, src/components/zodiac/HoroscopeDisplay.tsx

- [ ] **C3: Element-based accent colors**
  - Fire signs (Aries/Leo/Sag): amber-orange #F97316
  - Earth signs (Taurus/Virgo/Cap): lime-green #84CC16
  - Air signs (Gemini/Libra/Aquarius): sky-blue #38BDF8
  - Water signs (Cancer/Scorpio/Pisces): violet #A78BFA
  - Apply as 3px left border on cards + subtle tint on sign picker
  - Files: src/components/zodiac/ZodiacCard.tsx, tailwind.config.js

- [ ] **C4: Night mode visual design**
  - Add data-mode="day|night" to body element
  - Define CSS custom properties for night: deeper background, dimmer text, violet accents, slower animations
  - Add 600ms crossfade transition between modes
  - Files: src/app/globals.css, src/hooks/useMode.ts, src/app/layout.tsx

- [ ] **C5: Card redesign — remove videos, increase content density**
  - Remove VideoBanner from collapsed cards
  - Remove fixed h-[480px], use auto height with min-h-[280px]
  - Show 3-4 sentences of horoscope instead of 1
  - Switch from modal overlay to inline accordion expand
  - Increase glass opacity from 0.03 to 0.05
  - Files: src/components/zodiac/ZodiacCard.tsx, src/components/VideoBanner.tsx

- [ ] **C6: Accessibility fixes**
  - Add role="dialog", aria-modal="true", aria-label to expanded card
  - Add focus trap (trap focus inside modal when open)
  - Add tabIndex={0} and onKeyDown to cards for keyboard access
  - Add prefers-reduced-motion media query check
  - Increase touch targets to 44x44px minimum (mode toggle, read more button)
  - Fix footer text contrast (text-indigo-300/60 → text-indigo-200/80)
  - Files: src/components/zodiac/ZodiacCard.tsx, src/components/ModeToggle.tsx

- [ ] **C7: Typography — remove Geist, add display serif**
  - Remove Geist font imports from layout.tsx
  - Set Tailwind fontFamily.sans to Satoshi only
  - Add Playfair Display (free) for sign names: font-display class
  - Apply to: sign name h2 on cards, sign page h1, hero heading
  - Introduce weight contrast: sign names font-medium, labels font-medium
  - Files: src/app/layout.tsx, tailwind.config.js, src/components/zodiac/ZodiacCard.tsx

### Squad D: SEO & New Pages

- [ ] **D1: 66 compatibility pages**
  - Create src/app/compatibility/[pair]/page.tsx
  - Dynamic route: /compatibility/aries-scorpio (alphabetical order)
  - generateStaticParams for all 66 combinations
  - Content: element analysis, daily compatibility tip (from API), famous couples
  - generateMetadata for SEO (title, description, OG tags)
  - ISR with revalidate: 3600
  - Files: src/app/compatibility/[pair]/page.tsx (new), src/app/compatibility/[pair]/layout.tsx (new)

- [ ] **D2: Weekly forecast content**
  - Create weekly prompt variant in horoscope-prompts.ts
  - Add /horoscope/[sign]/weekly route
  - Weekly summary: 150-200 words, key themes, best days
  - Generate on Monday, cache for 7 days
  - Files: src/app/horoscope/[sign]/weekly/page.tsx (new), src/utils/horoscope-prompts.ts

- [ ] **D3: Premium tier scaffolding**
  - Create pricing page /pricing with tier comparison
  - Add "Unlock extended reading" teaser below free reading
  - Stripe integration deferred — just design the conversion points
  - Files: src/app/pricing/page.tsx (new), src/components/zodiac/PremiumTeaser.tsx (new)

## Risks

| Risk | Mitigation |
|------|------------|
| Sign page 404 may be a Vercel project routing issue (frontend vs API project) | Investigate both projects' routing configs first |
| OG image generation requires @vercel/og package | Already in Next.js ecosystem, low risk |
| Push notifications require HTTPS + service worker | Site is already HTTPS on Vercel |
| 66 compatibility pages is a lot of content | Use generateStaticParams + ISR, generate content lazily |
| OpenAI quota may be hit during bulk generation | Generate one sign at a time, cache aggressively |
