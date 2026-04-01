# AutoResearch SEO Optimization — Agent Handoff Document

**Date:** April 1, 2026
**Project:** gettodayshoroscope.com
**Branch:** `feat/solo/autoresearch-seo-optimization`
**Status:** Proof of concept complete. Ready for implementation.

---

## What Was Proven

AutoResearch (Karpathy's autonomous experiment loop, implemented as a Claude Code skill) was run against the site's SEO content. Results:

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| SEO Content Score | 45.50/100 | 68.50/100 | **+50.5%** |
| Experiments | 0 | 10 | 6 kept, 4 reverted |
| Cost | — | $0.27 | ~$0.03/experiment |
| Time | — | 6 minutes | Zero human intervention |

### What AutoResearch Autonomously Improved
1. **H1**: "Today's Horoscope" → "Today's Philosophical Horoscope" (added differentiator)
2. **Intro copy**: Generic 2 sentences → compelling 4-sentence value prop with CTA ("Read your sign below and meet the day with clarity")
3. **Added 4 FAQs** — rich snippet opportunity for Google (FAQPage schema)
4. **Added 3 related links** — weekly horoscope, compatibility guide, zodiac elements
5. **Added email CTA**: "Your morning philosophy, delivered to your inbox"
6. **Added schema types**: FAQPage + BreadcrumbList (on top of existing WebSite + CreativeWork)
7. **Preserved brand voice** — "philosophical guidance, not predictions" positioning maintained

### Optimized Content Location
- `.autoresearch/seo-content.json` — the optimized SEO content config
- `.autoresearch/experiments.jsonl` — full experiment log
- `.autoresearch/state.json` — current state (baseline: 68.50, 10 experiments, 6 kept)
- `.autoresearch/program.md` — research goal and constraints
- `.autoresearch/eval_seo.py` — the scoring eval (9 dimensions, 0-100 scale)

---

## Using /autoresearch on This Project

The `/autoresearch` skill is installed globally at `~/.claude/skills/autoresearch/`. It can be invoked from any Claude Code session.

### Running More Experiments
```bash
# From the horoscope project root:
cd ~/Desktop/horoscope-ai-app

# Run a single experiment:
AUTORESEARCH_PROJECT_ROOT="$PWD" bash ~/.claude/skills/autoresearch/scripts/orchestrator.sh

# Or via the skill:
/autoresearch run

# Check status:
/autoresearch status

# Schedule overnight runs (7 min intervals):
/autoresearch schedule
```

### Applying Optimized Content to the Site

The optimized `seo-content.json` contains content that should be applied to the actual site components:

| JSON Field | Apply To | File |
|------------|----------|------|
| `title` | Page title meta tag | `src/app/layout.tsx` → `metadata.title` |
| `meta_description` | Meta description | `src/app/layout.tsx` → `metadata.description` |
| `h1` | Main heading | `src/components/zodiac/HoroscopeDisplay.tsx` or `src/app/page.tsx` |
| `intro_copy` | Hero section text | `src/app/page.tsx` or new hero component |
| `faqs` | New FAQ section | New component: `src/components/seo/FAQSection.tsx` |
| `email_cta` | Email capture copy | `src/components/zodiac/EmailCapture.tsx` |
| `related_links` | Footer/sidebar links | New component or update `src/app/page.tsx` |
| `schemas` | JSON-LD structured data | `src/components/seo/SchemaMarkup.tsx` — add FAQPage + BreadcrumbList |
| `sign_descriptions` | Zodiac card descriptions | `src/components/zodiac/ZodiacCard.tsx` |

### Extending AutoResearch to Other Surfaces

You can run `/autoresearch init` targeting different files for different optimization goals:

| Target | File | Metric | Value |
|--------|------|--------|-------|
| Homepage SEO | `.autoresearch/seo-content.json` | SEO score (eval_seo.py) | Done — 68.50 |
| Sign page meta descriptions | New target per sign | SEO score variant | Next priority |
| Email signup copy | Email CTA component text | Signup conversion rate | Needs traffic first |
| Individual sign content quality | Horoscope generation prompts | Content quality score | Future |

---

## SEO Keyword Strategy (From Research)

### Current State
- Domain Rating: 0
- Organic traffic: 0
- Organic keywords: 0
- Referring domains: 8

### The Strategy: Programmatic SEO at Scale

**Do NOT target head terms** ("horoscope today" = 1.5M/mo, KD 96). The site can't rank for these with DR 0.

**DO target date-specific and topic-specific long-tail** — near-zero competition per page, compounding at scale.

### Page Generation Matrix

| Page Type | Formula | Year 1 Total | Competition |
|-----------|---------|-------------|-------------|
| Daily per sign | 12 signs × 365 days | 4,380 pages | Near zero |
| Weekly per topic | 12 signs × 52 weeks × 4 topics | 2,496 pages | Very low |
| Monthly per sign | 12 signs × 12 months | 144 pages | Low |
| Compatibility | 12 × 12 pairs | 144 pages | Low |
| **Total** | | **~7,164 pages** | |

### URL Structure to Build

```
/[sign]/                          ← Evergreen sign hub (authority builder)
/[sign]/daily/[date]/             ← Programmatic daily pages (long-tail traffic)
/[sign]/weekly/[week-date]/       ← Programmatic weekly pages
/[sign]/monthly/[month-year]/     ← Monthly pages (highest near-term SEO value)
/[sign]/love-horoscope/           ← Topic hub (love)
/[sign]/career-horoscope/         ← Topic hub (career)
/[sign]/compatibility/[sign-2]/   ← Compatibility pages
/horoscope/[date]/                ← All-signs daily digest
```

### Priority Keywords (Targetable Now)

**Tier 1 — Start immediately (monthly keywords):**
- `[sign] horoscope april 2026` (people searching NOW)
- `[sign] horoscope may 2026` (start publishing NOW for May)
- `[sign] horoscope june 2026`

**Tier 2 — Long-tail daily:**
- `[sign] horoscope today [full date]`
- `what does [sign] horoscope say today`
- `is today a good day for [sign]`

**Tier 3 — Topic-specific:**
- `[sign] love horoscope this week`
- `[sign] career horoscope april 2026`
- `[sign] money horoscope this week`
- `[sign] horoscope for singles`

**Tier 4 — Compatibility (low competition, specific intent):**
- `aries and gemini compatibility`
- `[sign] and [sign] compatibility today`

### Technical SEO Requirements

Every programmatic page must have:
- `Article` schema with `datePublished` and `dateModified`
- Unique title: `[Sign] Horoscope [Date] — Philosophical Daily Guidance`
- Unique meta description (150-160 chars)
- 300-600 words of content (under 150 = thin content penalty)
- Internal links back to sign hub page
- Canonical URL set correctly
- Sitemap inclusion (auto-generated, submitted to Search Console)

### Content Quality for E-E-A-T

Google's December 2025 update extended expertise requirements. For astrology:
- Create a named astrologer author persona with an About page
- Consistently attribute content to that persona
- The site's "philosophical, not predictions" positioning is actually an E-E-A-T advantage — it's more defensible than generic fortune-telling

---

## Traffic Channels (Beyond SEO)

### TikTok (Fastest to First Visitors)

- AstroClub hit $90K MRR primarily through TikTok daily horoscope posts (~1M views)
- Format: 15-30 second video, text overlay on aesthetic background, one sign per video
- Post daily, link to site in bio
- Expected: traffic within week 1

### Pinterest (Compounds Over Time)

- Pins drive traffic for months (vs hours on TikTok/Instagram)
- Astrology is in Pinterest's 2025 "Predicts" trends
- Format: vertical pin (1000×1500px) with zodiac graphic + horoscope summary
- Target: 1 pin per sign per week = 48+ pins/month
- Link each pin to that sign's page on the site

### Traffic Projection

| Timeline | Monthly Visitors | Primary Source |
|----------|-----------------|----------------|
| Month 1 | 0-50 | TikTok/social |
| Month 2-3 | 100-400 | First long-tail indexing |
| Month 4-6 | 500-2,000 | Date-specific pages + monthly keywords |
| Month 6-12 | 2,000-10,000 | Scaled programmatic + growing DR |

---

## Implementation Priority (What to Build Next)

### P0 — This Week
1. **Apply autoresearch-optimized content** to live site (title, meta, H1, intro, FAQs, schema)
2. **Submit sitemap** to Google Search Console
3. **Create 12 April monthly pages** (`/[sign]/monthly/april-2026/`)
4. **Start TikTok** — daily horoscope videos

### P1 — Next 2 Weeks
5. **Build programmatic daily URL structure** — `/[sign]/daily/[date]/`
6. **Create named astrologer author persona** + About page
7. **Create 12 May monthly pages** (people start searching in mid-April)
8. **Start Pinterest** — weekly pins per sign
9. **Add FAQPage schema** to homepage (from autoresearch results)
10. **Add BreadcrumbList schema** to all pages

### P2 — Month 1
11. **Build compatibility pages** (144 pages, low-competition keywords)
12. **Add topic hubs** — love/career/money horoscope pages per sign
13. **Run autoresearch on each sign's meta description** (12 optimization runs)
14. **Set up Google Search Console tracking** for keyword impressions

### P3 — Month 2+
15. **Scale programmatic daily archive** (backfill 30 days of past horoscopes)
16. **Run autoresearch on email signup copy** (once traffic supports A/B testing)
17. **Build weekly horoscope pages** by topic
18. **Analyze Search Console data** — double down on keywords showing impressions

---

## AutoResearch Architecture (For Reference)

The `/autoresearch` skill uses an **inverted control flow**:

```
launchd (schedule) → orchestrator.sh (deterministic bash) → claude -p (creative step only)
```

- Claude is called ONLY for deciding what modification to make
- All loop control, eval, keep/revert, state management is deterministic bash
- Each experiment is a separate `claude -p` invocation (no session accumulation)
- Cost: ~$0.03/experiment at Sonnet, ~$0.01 at Haiku
- State persisted in `.autoresearch/` directory (state.json, experiments.jsonl, config.json)
- Telegram notifications auto-configured from `~/.claude/channels/telegram/`

### Running AutoResearch on New Targets

To optimize a new surface (e.g., sign page meta descriptions):
1. Create a new target file (JSON or text) representing the content to optimize
2. Create an eval script that scores the target file (outputs a single number)
3. Run `/autoresearch init` or manually create config.json + state.json
4. Run `/autoresearch run` or `/autoresearch schedule` for overnight optimization

---

## Sources

### AutoResearch Proof
- 10 experiments on `.autoresearch/seo-content.json`
- Eval: `eval_seo.py` (9 dimensions: title, meta, H1, intro, sign descriptions, internal linking, CTAs, freshness, schema)
- Results: `.autoresearch/experiments.jsonl`

### SEO Research
- Ahrefs keyword data (horoscope volume/difficulty)
- Surfer SEO astrology affiliate case study (30K sessions via programmatic SEO)
- AstroClub TikTok growth ($90K MRR)
- Pinterest Predicts 2025 astrology trends
- Google E-E-A-T December 2025 update requirements
- 20+ sources across Clicks.so, KeySearch, SEOpital, Keywords Everywhere, Digital Piloto, SERPs Growth
