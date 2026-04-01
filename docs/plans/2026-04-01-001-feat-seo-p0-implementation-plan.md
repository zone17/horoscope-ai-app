---
title: "feat: SEO P0 — Apply Optimized Content, Monthly Pages, Author Persona, Sitemap"
type: feat
status: active
date: 2026-04-01
origin: docs/autoresearch-seo-handoff.md
---

# feat: SEO P0 — Apply Optimized Content, Monthly Pages, Author Persona, Sitemap

## Overview

Apply the AutoResearch-optimized SEO content to the live site, build the programmatic monthly horoscope page structure, create an E-E-A-T author persona, and expand the sitemap. The site has DR 0, zero organic traffic, and zero indexed programmatic pages — every day without indexable long-tail pages is lost compounding time.

## Problem Frame

The site is live and functional but invisible to search engines. The AutoResearch proof of concept improved SEO content scoring from 45.5 to 68.5, but the optimized content sits in a JSON file (`.autoresearch/seo-content.json`) rather than on the actual site. Meanwhile, the only indexable pages are 1 home + 12 sign pages + 1 pricing = 14 URLs. The handoff document specifies a 7,164-page programmatic strategy; this plan covers the first wave: 12 monthly pages targeting `[sign] horoscope [month] [year]` — near-zero competition keywords people are searching for right now.

Research confirms: Google does not penalize AI content (19.1% of top results contain AI content), but DOES penalize thin templated pages. Each page must have 300-600 words of unique content. Entity-based SEO (author persona) is now more important than keyword density.

## Requirements Trace

- R1. Apply AutoResearch-optimized meta title, description, H1, intro copy, FAQs, and schema to live components
- R2. Build `/[sign]/monthly/[month-year]/` route generating 12 unique monthly pages for April 2026
- R3. Create named author persona with About page for E-E-A-T compliance
- R4. Expand sitemap to include monthly pages and About page
- R5. Add BreadcrumbList schema to all pages
- R6. Add FAQPage schema with AutoResearch-optimized FAQ content to homepage
- R7. Each monthly page must have 300-600 words of unique generated content, Article schema with datePublished/dateModified, canonical URL, and internal links to sign hub

## Scope Boundaries

- **NOT building**: daily programmatic pages (`/[sign]/daily/[date]/`), compatibility pages, weekly topic pages, email sending service — these are P1-P3
- **NOT changing**: content generation pipeline, horoscope-generator.ts, horoscope-prompts.ts, Redis caching logic
- **NOT optimizing**: sign page meta descriptions (that's a separate AutoResearch run)
- **NOT submitting** to Google Search Console — that requires manual browser auth (user will do this)
- **NOT creating** TikTok/Pinterest content — that's a marketing task, not a code task

## Context & Research

### Relevant Code and Patterns

- `src/app/layout.tsx` — root metadata (title, description) to update with AutoResearch values
- `src/app/page.tsx` — homepage, currently just Header + HoroscopeDisplay + footer. Needs hero intro copy and FAQ section
- `src/app/horoscope/[sign]/page.tsx` — sign page pattern to follow for monthly pages (ISR, generateMetadata, generateStaticParams)
- `src/components/seo/SchemaMarkupServer.tsx` — existing JSON-LD schemas (WebSite, Organization, Service, FAQ, ItemList, Article). FAQ content needs replacing with AutoResearch version. BreadcrumbList to add
- `src/app/sitemap.ts` — currently outputs 13 URLs (home + 12 signs). Must expand
- `src/components/zodiac/EmailCapture.tsx` — existing email CTA component, copy to update
- `.autoresearch/seo-content.json` — the optimized content to apply

### Key Constraints

- **Tailwind v3 ONLY** — use `@tailwind` directives, not `@import "tailwindcss"`
- **Vercel 10s timeout** — monthly page generation must be per-sign, never batch
- **Two Vercel projects** — pages go to frontend project, API routes go to API project
- **No edge runtime** on routes using OpenAI SDK
- **ISR pattern** — use `revalidate = 3600` consistent with existing pages

### SEO Research Findings

- Target keywords: `[sign] horoscope april 2026` — people searching NOW, near-zero KD
- 300-600 words minimum per page to avoid thin content penalty
- Article schema with datePublished/dateModified required per programmatic page
- Named author persona needed for E-E-A-T (Google Dec 2025 update extended expertise requirements)
- Canonical URLs must be set correctly on every page
- BreadcrumbList schema improves search result appearance

## Key Technical Decisions

- **Monthly content generation via OpenAI**: Monthly horoscopes will use the existing `horoscope-generator.ts` pipeline with a `type: 'monthly'` parameter, cached in Redis with 30-day TTL. This reuses the proven content system (voice personalities, philosopher rotation, verified quotes) rather than building a separate generator. Rationale: the content differentiation IS the product — monthly pages must have the same quality as daily pages.

- **Static params for current + next month only**: `generateStaticParams` will produce pages for the current month and next month (April + May 2026). Older months are still accessible via ISR on-demand. Rationale: avoids building hundreds of pages at deploy time while ensuring the two most-searched months are pre-rendered.

- **Author persona as data constant, not CMS**: The author persona (name, bio, credentials, image) will be defined as a TypeScript constant in `src/constants/author.ts` and referenced across pages. Rationale: no CMS exists, the persona is stable, and a constant is the simplest thing that works.

- **FAQ section as a new component on homepage**: Rather than modifying HoroscopeDisplay (which is a complex client component), add a new `FAQSection` server component rendered after HoroscopeDisplay in `page.tsx`. Rationale: keeps the FAQ server-rendered (better for SEO) and avoids touching the fragile zodiac card UI.

- **Hero intro copy added to homepage**: Add a new `HeroIntro` server component before HoroscopeDisplay. Rationale: HoroscopeDisplay is a client component that loads data on mount — the intro copy should be immediately visible (server-rendered) before the loading spinner.

## Open Questions

### Resolved During Planning

- **Should monthly pages call OpenAI at build time?** No — use ISR. The first visitor triggers generation, subsequent visitors get cached. This avoids build-time API costs and timeout risks.
- **Where does the author persona image come from?** Use a placeholder SVG initially. The user can add a real image later.
- **Should we backfill past months?** Not in P0. Only April + May 2026.

### Deferred to Implementation

- Exact monthly prompt wording — will extend `buildHoroscopePrompt` with a monthly type, but exact phrasing discovered during implementation
- Whether monthly horoscopes need a separate Redis TTL key pattern — likely `horoscope-prod:horoscope:sign=X&type=monthly&month=april-2026`

## High-Level Technical Design

> *This illustrates the intended approach and is directional guidance for review, not implementation specification. The implementing agent should treat it as context, not code to reproduce.*

```
Homepage (page.tsx)
├── Header
├── HeroIntro (NEW — server component, AutoResearch intro_copy)
├── HoroscopeDisplay (existing client component, unchanged)
├── FAQSection (NEW — server component, AutoResearch FAQs + FAQPage schema)
└── Footer

Monthly Page (/[sign]/monthly/[month-year]/page.tsx)
├── Breadcrumb nav (Home > [Sign] > Monthly > [Month Year])
├── H1: "[Sign] Horoscope [Month] [Year] — Monthly Philosophical Guidance"
├── Monthly content (300-600 words, generated via horoscope-generator.ts)
├── Author attribution (links to /about/author)
├── Internal links (back to sign hub, other months)
├── EmailCapture
└── Article + BreadcrumbList schema

About Author (/about/author/page.tsx)
├── Author name, bio, credentials, philosophy
├── Links to homepage and sign pages
└── Person schema

Sitemap expansion:
  Existing: / + 12 sign pages = 13 URLs
  Adding: 12 monthly (April) + 12 monthly (May) + /about/author = 37 URLs total
```

## Implementation Units

- [ ] **Unit 1: Apply AutoResearch Content to Root Metadata + Homepage**

**Goal:** Update the site's title, meta description, and H1 to the AutoResearch-optimized values. Add hero intro copy and FAQ section to homepage.

**Requirements:** R1, R6

**Dependencies:** None

**Files:**
- Modify: `src/app/layout.tsx` (metadata.title, metadata.description)
- Modify: `src/app/page.tsx` (add HeroIntro and FAQSection components)
- Create: `src/components/seo/HeroIntro.tsx`
- Create: `src/components/seo/FAQSection.tsx`
- Test: `__tests__/components/seo/HeroIntro.test.tsx`
- Test: `__tests__/components/seo/FAQSection.test.tsx`

**Approach:**
- Read optimized values from `.autoresearch/seo-content.json` and hardcode them into the components (not dynamic loading — these are build-time constants)
- HeroIntro: server component rendering the `intro_copy` as a `<section>` with appropriate heading structure
- FAQSection: server component rendering 4 FAQs as expandable accordion + inline FAQPage JSON-LD schema
- Both components use existing Tailwind classes consistent with the cosmic dark theme

**Patterns to follow:**
- `src/components/seo/SchemaMarkupServer.tsx` for JSON-LD rendering pattern
- Existing page styling in `src/app/horoscope/[sign]/page.tsx` for text sizing and spacing

**Test scenarios:**
- Happy path: HeroIntro renders intro copy text and heading
- Happy path: FAQSection renders all 4 FAQs with question and answer text
- Happy path: FAQSection includes valid FAQPage JSON-LD script tag
- Edge case: FAQ accordion toggles expand/collapse correctly

**Verification:**
- Homepage shows new H1, intro copy, and FAQ section
- View source contains updated meta title and description
- FAQPage JSON-LD is present in page source

---

- [ ] **Unit 2: Update Schema Markup — BreadcrumbList + Improved FAQ**

**Goal:** Add BreadcrumbList schema to all pages. Replace existing generic FAQ schema with AutoResearch-optimized FAQ content.

**Requirements:** R5, R6

**Dependencies:** Unit 1

**Files:**
- Modify: `src/components/seo/SchemaMarkupServer.tsx` (add BreadcrumbList, update FAQ content)
- Modify: `src/app/horoscope/[sign]/page.tsx` (pass breadcrumb data)
- Test: `__tests__/components/seo/SchemaMarkupServer.test.tsx`

**Approach:**
- Add BreadcrumbList schema generator that accepts a path array (e.g., `[{name: "Home", url: "/"}, {name: "Aries", url: "/horoscope/aries"}]`)
- Replace the 3 hardcoded FAQ Q&As in SchemaMarkupServer with the 4 AutoResearch-optimized FAQs
- BreadcrumbList renders in SchemaMarkupServer for the homepage; sign pages pass their own breadcrumb path

**Patterns to follow:**
- Existing schema rendering pattern in `SchemaMarkupServer.tsx`

**Test scenarios:**
- Happy path: BreadcrumbList JSON-LD renders with correct items for homepage
- Happy path: BreadcrumbList renders with sign-specific path for sign pages
- Happy path: FAQ schema contains all 4 AutoResearch Q&As
- Edge case: BreadcrumbList handles single-item path (homepage only)

**Verification:**
- Google's Rich Results Test validates BreadcrumbList and FAQPage schemas
- Schema appears in page source for both homepage and sign pages

---

- [ ] **Unit 3: Author Persona + About Page**

**Goal:** Create a named author persona for E-E-A-T and an About page that establishes authority.

**Requirements:** R3

**Dependencies:** None (can run parallel with Units 1-2)

**Files:**
- Create: `src/constants/author.ts`
- Create: `src/app/about/author/page.tsx`
- Test: `__tests__/app/about/author/page.test.tsx`

**Approach:**
- Define author constant with: name, title, bio (2-3 paragraphs about philosophical approach to astrology), credentials, image placeholder path
- About page renders author info with Person schema JSON-LD
- Page is server-rendered, ISR with long revalidation (86400s — content rarely changes)
- Include internal links to homepage and all 12 sign pages
- Style consistent with existing pages (dark cosmic theme, Satoshi/Playfair fonts)

**Patterns to follow:**
- `src/app/horoscope/[sign]/page.tsx` for page structure, metadata generation, and styling

**Test scenarios:**
- Happy path: About page renders author name, title, and bio
- Happy path: Person schema JSON-LD is present with correct author fields
- Happy path: Page includes internal links to homepage and all 12 sign pages
- Integration: `generateMetadata` returns correct title, description, and canonical URL

**Verification:**
- `/about/author` renders and passes Lighthouse SEO audit
- Person schema validates in Google Rich Results Test

---

- [ ] **Unit 4: Monthly Horoscope Page Route**

**Goal:** Build the `/[sign]/monthly/[month-year]/` dynamic route that generates unique monthly horoscopes.

**Requirements:** R2, R7

**Dependencies:** Unit 3 (for author attribution)

**Files:**
- Create: `src/app/horoscope/[sign]/monthly/[monthYear]/page.tsx`
- Modify: `src/utils/horoscope-generator.ts` (add monthly generation type — minimal change, extend existing function)
- Create: `src/utils/monthly-content.ts` (monthly-specific prompt additions and month metadata)
- Test: `__tests__/app/horoscope/monthly/page.test.tsx`
- Test: `__tests__/utils/monthly-content.test.tsx`

**Approach:**
- Route pattern: `/horoscope/aries/monthly/april-2026`
- `generateStaticParams` produces all 12 signs × 2 months (April + May 2026) = 24 paths
- Page calls `generateHoroscope(sign, 'monthly')` with month context injected into the prompt
- Monthly prompt extension: "Write a monthly philosophical horoscope for [Sign] for [Month] [Year]. This should be 300-500 words covering the month's themes, challenges, and growth opportunities through a philosophical lens."
- Content cached in Redis with key pattern: `horoscope:sign=[sign]&type=monthly&month=[month-year]`
- 30-day TTL (monthly content doesn't change)
- ISR with `revalidate = 86400` (daily — in case of cache miss or first generation)
- Page includes: H1, monthly content, author attribution (link to about page), breadcrumb nav, internal links to sign hub and other months, Article schema with datePublished
- Each sign's monthly horoscope is genuinely unique — different philosopher, different voice, different format — because it goes through the same content pipeline

**Patterns to follow:**
- `src/app/horoscope/[sign]/page.tsx` for page structure, metadata, static params
- `src/utils/horoscope-generator.ts` for generation pattern
- `src/utils/horoscope-prompts.ts` for prompt building pattern

**Test scenarios:**
- Happy path: Page renders monthly horoscope content for a valid sign and month
- Happy path: `generateMetadata` returns title "[Sign] Horoscope [Month] [Year]", description, canonical URL, OG tags
- Happy path: `generateStaticParams` returns 24 paths (12 signs × 2 months)
- Happy path: Article schema includes datePublished matching the month
- Edge case: Invalid month-year slug returns 404
- Edge case: Invalid sign returns 404
- Edge case: Future month beyond May 2026 returns 404 at build time but generates on-demand via ISR
- Integration: Monthly generation calls OpenAI with monthly-specific prompt and caches result in Redis

**Verification:**
- `/horoscope/aries/monthly/april-2026` renders with 300+ words of unique content
- All 12 sign monthly pages render with distinct content
- Redis contains cached monthly horoscopes after first generation
- Article schema validates in Google Rich Results Test

---

- [ ] **Unit 5: Expand Sitemap**

**Goal:** Add monthly pages and about page to the sitemap for search engine discovery.

**Requirements:** R4

**Dependencies:** Units 3 and 4

**Files:**
- Modify: `src/app/sitemap.ts`
- Test: `__tests__/app/sitemap.test.tsx`

**Approach:**
- Add monthly page URLs for April + May 2026 (24 URLs) with `changeFrequency: 'monthly'`, `priority: 0.7`
- Add `/about/author` with `changeFrequency: 'yearly'`, `priority: 0.3`
- Keep existing URLs unchanged
- Total URLs: 13 existing + 24 monthly + 1 about = 38

**Patterns to follow:**
- Existing `src/app/sitemap.ts` structure

**Test scenarios:**
- Happy path: Sitemap includes all 38 URLs
- Happy path: Monthly pages have correct URL format `/horoscope/[sign]/monthly/[month-year]`
- Happy path: About page URL is included
- Edge case: No duplicate URLs in sitemap output

**Verification:**
- `/sitemap.xml` renders with 38 entries
- All URLs in sitemap return 200 status

---

- [ ] **Unit 6: Update Email CTA Copy + Sign Descriptions**

**Goal:** Apply AutoResearch-optimized email CTA copy and sign descriptions.

**Requirements:** R1

**Dependencies:** None (can run parallel)

**Files:**
- Modify: `src/components/zodiac/EmailCapture.tsx` (update CTA text)
- Modify: `src/components/zodiac/ZodiacCard.tsx` (update sign descriptions if applicable)

**Approach:**
- Replace email CTA heading/body with AutoResearch-optimized copy: "Your morning philosophy, delivered to your inbox"
- Review ZodiacCard to determine if sign descriptions from `seo-content.json` should be applied (these may be used as alt text or card descriptions)

**Test expectation: none** — copy-only changes with no behavioral logic

**Verification:**
- Email capture section shows updated CTA text
- Visual regression check: components render correctly with new copy

## System-Wide Impact

- **Sitemap**: Expanding from 13 to 38 URLs. Search engines will discover new pages on next crawl.
- **Redis cache**: New key pattern for monthly horoscopes. No conflict with existing daily keys.
- **Build time**: Adding 24 statically generated pages increases build time slightly (~12-24s).
- **OpenAI usage**: First visit to each monthly page triggers one OpenAI call (~$0.002). 24 pages = ~$0.05 total.
- **Content generation**: Monthly pages use the same pipeline as daily — no new OpenAI instantiation, no separate generator.
- **Unchanged invariants**: Daily horoscope generation, sign pages, compatibility pages, cron job, Redis TTL for daily content, PWA, analytics — all untouched.

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| Monthly generation exceeds Vercel 10s timeout | Generate per-sign (not batch). Same pattern as daily — ~3s per sign |
| Monthly content too short (<300 words) | Prompt explicitly requests 300-500 words. Post-validation check in implementation |
| AutoResearch FAQ content doesn't match brand voice | Content was validated during AutoResearch — "philosophical guidance, not predictions" positioning preserved |
| New pages not indexed quickly | Sitemap expansion + ISR ensures pages are crawlable. Indexing timeline is Google's — typically 2-8 weeks for new domains |
| Author persona feels fake | Keep it honest — "AI-powered philosophical guidance curated by [name]" rather than pretending to be a human astrologer |

## Sources & References

- **Origin document:** [docs/autoresearch-seo-handoff.md](docs/autoresearch-seo-handoff.md)
- **Optimized content:** [.autoresearch/seo-content.json](.autoresearch/seo-content.json)
- **Project context:** [docs/PROJECT_CONTEXT.md](docs/PROJECT_CONTEXT.md)
- Related patterns: Existing sign page at `src/app/horoscope/[sign]/page.tsx`
- SEO research: Google E-E-A-T Dec 2025 update, programmatic SEO case studies (Omnius 3,035% signup growth, 500%+ traffic growth patterns)
