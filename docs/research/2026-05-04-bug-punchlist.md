# Bug Punch List — Wave 1 Findings

> **Date**: 2026-05-04
> **Scope**: Live production (gettodayshoroscope.com) + V2 PR #92 preview
> **Agents**: Wave 1A (first-visit flow), 1B (sign pages), 1C (V2 API), 1D (mobile)
> **Method**: Headed Chrome via DevTools MCP. 35+ screenshots, 12 sign API responses sampled, 21 V2 readings stress-tested.
> **Headline**: V2 is merge-ready. Production v1 has multiple real bugs. Several architectural gaps exist independent of either.

---

## 0. The headline

**What's working** (be honest):
- All 12 sign API endpoints return 200 with unique, well-structured content.
- Readings are genuinely confrontational on most signs (Scorpio's *"You've built a whole architecture around one thing you won't say out loud"*; Libra's *"Someone you care about is wrong, and you know it"*).
- "Today guided by [Philosopher]" attribution is correctly absent on v1 production already.
- OG meta tags + dynamic OG images + sitemap all healthy.
- V2 preview validation: 0 em-dashes, 0 anti-tells, 0 AI-slop terms across 21 sampled readings. The auto-fail filters work.
- V2 council differentiation is real: Council A vs B for Aries showed 15% Jaccard overlap with different metaphor stacks.
- Layout renders cleanly across desktop + mobile + iPad. No horizontal scroll anywhere.

**What's broken** (the operator's "things are not functioning correctly" was right):
- Live v1 readings contain em-dashes in 9 of 12 signs and anti-tells like "permission to" in Virgo.
- No state persistence anywhere: localStorage / sessionStorage / cookies all empty after a reading.
- Daily archive route `/horoscope/{sign}/daily/{date}` returns HTTP 200 with a populated title but renders the 404 component as the body.
- Monthly archive route `/horoscope/{sign}/monthly/{month}` is a full 404.
- `/about`, `/privacy`, `/terms` all 404 — the homepage collects emails with no legal pages linked.
- SSR is empty for the reading body. Search engines see no reading content.
- Mobile email input is 14px (triggers iOS Safari focus-zoom on the primary conversion event), with no autocomplete / inputmode / name.
- Background videos on sign cards are gone (orphaned `VideoBanner` component, no page renders it).
- Multiple tap targets under the 44×44px iOS minimum.

---

## 1. P1 issues (ship-blocking or visitor-facing dead-ends)

### v1 bugs that V2 PR #92 fixes on merge

These will resolve the moment the PR ships. The merge is the fix. All confirmed clean in V2 preview validation (Wave 1C).

| # | Issue | Surface | V2 fix mechanism |
|---|---|---|---|
| 1.1 | Em-dashes / en-dashes in 9 of 12 sign readings (Aries, Taurus, Gemini, Cancer, Libra, Scorpio, Sagittarius, Aquarius, Pisces) | Live API `/api/horoscope?sign=*` | V2 auto-fail filter regex pre-cache. Validated 0 across 21 V2 readings. |
| 1.2 | Anti-tell "permission to" in Virgo reading body | Live cron output | V2 auto-fail filters explicit ban list catches this exact phrase. Validated 0 across 21 V2 readings. |
| 1.3 | Stock imagery convergence: "kettle" in Gemini + Virgo same day; "shoulder drop" in 4 of 12 peaceful_thoughts (Aries, Cancer, Libra, Capricorn) | Live cron output | V2 prompt's "no sensory image as the work; behavioral specificity required" rule + judge axis. |
| 1.4 | Anti-tell "Something you've been..." opener in Taurus | Live cron output | Banned in V2 prompt's anti-tell list. |

**Action: merge PR #92.** Production cron next tick will regenerate clean readings.

### Bugs the merge does NOT fix (separate work)

| # | Issue | Where | Fix |
|---|---|---|---|
| 1.5 | **Daily archive route is half-implemented**: `/horoscope/{sign}/daily/{date}` returns HTTP 200 with populated title but the body renders the "Cosmic Alignment Error" 404 component | Live | Either build the daily archive page properly or rewrite to a real 404. Right now it's the worst of both worlds — looks like a real page, dead-ends like a 404, search engines may have indexed it. |
| 1.6 | **Monthly archive route is fully 404**: `/horoscope/{sign}/monthly/{month}` | Live | Decide: build it, or remove links to it. The audit (§9) noted monthly pages use a separate legacy architecture; that architecture is broken now. |
| 1.7 | **`/about`, `/privacy`, `/terms` all 404 while homepage collects emails** | Live | Compliance risk. Even minimal legal pages need to exist before subscribing users. |
| 1.8 | **Zero state persistence**: localStorage / sessionStorage / cookies all empty after a reading completes | Live + V2 | The "council" architecture's whole premise is that the user's choices persist. They don't. Return visitors re-pick from scratch. Independent of V2 architecture; needs Zustand persistence or cookies wired up properly. |
| 1.9 | **SSR is empty for the reading body** on `/horoscope/{sign}` pages. Server-fetched HTML contains no reading text; reading hydrates client-side only | Live + V2 | Major SEO miss. Move the reading fetch to a Server Component with the API route. Per the audit, this is supposed to be a "well-optimized SEO" surface; for the reading content itself that claim doesn't hold. |
| 1.10 | **Mobile email input is 14px** → triggers iOS Safari focus-zoom on the primary conversion event | Live + V2 | One-line CSS fix: `font-size: 16px` on the email input. Single most damaging mobile UX bug on the site. |
| 1.11 | **Mobile email input has no `autocomplete`, `inputmode`, or `name`** → no iCloud / browser autofill, no email-optimized keyboard | Live + V2 | Three attribute additions. |
| 1.12 | **Background videos on sign cards are gone** (orphaned `VideoBanner` component, no page renders it) | Live + V2 | Operator's call: option A (homepage tiles), B (per-sign hero), or C (re-wire `HoroscopeDisplay` as `/horoscope` index). Awaiting your decision. |

---

## 2. P2 issues (broken but workaround exists)

### V1 production

| # | Issue | Where | Fix |
|---|---|---|---|
| 2.1 | "Build your council" CTA is just an `href="#horoscope"` scroll anchor, not a wizard opener | Live homepage | Either build the wizard or rename the CTA. Marketing copy promises a build experience that doesn't deliver. |
| 2.2 | Philosopher picker UI renders non-deterministically — caught once, couldn't reproduce reliably | Live | Race condition during hydration, or the picker is gated on a state that's not consistently set. Needs investigation. |
| 2.3 | Duplicate philosopher descriptions in the registry: Epictetus + Cato the Younger share one description verbatim; Nietzsche + Hesse share another | Live | Edit `src/tools/philosopher/registry.ts`. Pure content fix. |
| 2.4 | No "Edit your council" button anywhere on the live site after picking | Live | Add to reading display. UX completion. |
| 2.5 | Email subscribe accepts obvious garbage (`qa-test-wave1a@example.com` returns `{success:true}`) — no validation, no rate limit signal | Live API | Validate format + send confirmation; add abuse rate limit. |

### V1 + V2 (mobile)

| # | Issue | Where | Fix |
|---|---|---|---|
| 2.6 | Tap targets under 44×44 minimum: "← All signs" 67×20; filter chips 30px tall; Subscribe 99×38; Share 95×40; Notifications 145×30; "Build your council" 164×42 | Live + V2 | Bump padding / min-height. Apple HIG requires 44×44; many of these are far below. |
| 2.7 | 12px subtitle/label text at 0.6 opacity fails contrast | Live + V2 | Increase to either ≥14px or higher opacity. |
| 2.8 | Returning visitor auto-redirect to last sign (Zustand persisted) — but no way to override (the `?fresh=` query param doesn't work) | Live | Either implement `?fresh=`, or surface an explicit "change sign" affordance on the home flow. |
| 2.9 | Aristotle quote truncates with ellipsis on iPhone SE (`"…Excellence, then, i…"`) | Live + V2 | Quote card needs better mobile responsive — either reduce padding, allow wrap, or shorten quote. |
| 2.10 | 9 JSON-LD schema blocks per sign page (over-stuffed, includes a dubious `Event` block) | Live | Keep `Article` + `BreadcrumbList`; trim the rest. Excessive schema can hurt SEO not help. |
| 2.11 | Date drift: API returns date `2026-05-04`, but the Article schema on the page says `2026-05-01`. Stale schema. | Live | Schema generation needs to read the same date the API returns, not a build-time constant. |

### V2 preview only (must fix before merge per the operator's "skip the gate" decision — these are subtle, not blockers)

| # | Issue | Where | Fix |
|---|---|---|---|
| 2.12 | **Unknown philosopher silently falls back** with no warning — `?philosophers=Nonexistent` returns a real reading instead of failing | V2 API preview | At minimum log a warning; ideally 422 with valid-philosopher list. |
| 2.13 | **Duplicate philosophers create separate cache entries** — `[Marcus, Marcus, Marcus]` produces a different cached entry than `[Marcus]` | V2 API preview | Dedup at cache key level, not just at synthesis level. |
| 2.14 | **Quote distribution skewed: 8 of 12 default-council quotes are Naval** | V2 API preview | The rotation logic in `quote:select` is biased. Day-num modulo collision against council length 3. Worth a different seed. |

---

## 3. P3 issues (polish)

| # | Issue | Where | Fix |
|---|---|---|---|
| 3.1 | OG description has em-dash AND en-dash visible to social shares | Live | Regenerate after merge. |
| 3.2 | Two console 404s on detail page (origin not identified) | Live + V2 | Investigate; likely a missing icon or a stale prefetch. |
| 3.3 | "Enable notifications" button reads "Coming soon" but looks active | Live | Either implement or hide the button. |
| 3.4 | Constellation icons rendered as SVG; `document.querySelectorAll('img')` returns zero on the reading page | Live | Cosmetic; works fine for users but odd for image-scrapers. |
| 3.5 | Mystery 16×16 close X on the notification card | Live mobile | Tiny tap target; hard to hit. |
| 3.6 | Philosopher picker has 54 cards with no name search | Live (when picker renders) | Add a search input. Picking from 54 cards is friction. |
| 3.7 | Gemini evening reading = 60 words (target 30-50); Libra morning = 150 (at ceiling) | V2 preview | Tighten auto-fail length tolerances or accept ±10%. |
| 3.8 | Missing-sign error reuses the invalid-sign error message | V2 preview | Distinct messages; trivial polish. |
| 3.9 | First-call latency 5.8–9.4s with Virgo as outlier | V2 preview | Council synthesis adds a Haiku call; Virgo's outlier may be a slow-cold-start; can warm via cron pre-render. |

---

## 4. Recommended sequencing

### Wave A: ship the merge (now)
1. **Address V2 P2 issues 2.12, 2.13, 2.14** — small fixes; ~30 min total.
2. **Merge PR #92.** This closes 1.1, 1.2, 1.3, 1.4 in one go.

### Wave B: production hardening (this week)
3. **Mobile email input fix** (1.10, 1.11) — single CSS rule + three attributes. ~10 min. Highest-leverage bug fix per Wave 1D.
4. **State persistence** (1.8) — wire up Zustand persistence properly. ~1 hour.
5. **SSR the reading body** (1.9) — convert sign page to a Server Component, fetch reading server-side. ~2 hours. Major SEO unlock.
6. **Decide and fix daily / monthly archive routes** (1.5, 1.6) — either build or remove. Operator decision; if remove, ~1 hour. If build, larger.
7. **Add minimal /privacy + /terms pages** (1.7) — even copy-paste is sufficient to remove the compliance risk. ~30 min.
8. **Background video restoration** (1.12) — operator's call (A/B/C); ~20 min for A.

### Wave C: polish (next week)
9. Tap target sizing (2.6).
10. Contrast fixes (2.7).
11. Schema cleanup (2.10, 2.11).
12. "Build your council" CTA fix (2.1).
13. Picker non-determinism (2.2).
14. Duplicate registry descriptions (2.3).
15. Email validation (2.5).
16. Edit-council UX (2.4).

---

## 5. Operator-attention items

These need your call, not a fix decision:

- **Background videos restoration**: A (homepage tiles) / B (per-sign hero) / C (rebuild `/horoscope` index page). Awaiting your pick.
- **Daily archive route**: build it properly, or delete the route and any links to it?
- **Monthly archive route**: same question. The audit (§9) flagged the monthly pages as a separate legacy architecture; do they remain in scope?
- **State persistence approach**: simplest is Zustand persist middleware on the existing store, but you could also do server-side per-user state if accounts are coming. Lean: persist locally now, migrate to server-side when accounts ship.
- **The Vercel preview-deployment-protection bypass token** that Wave 1C's agent used during testing was leaked in plain text in this conversation. It's preview-only (no production scope) but rotate it after testing wraps. Path: Vercel project settings → Deployment Protection → Bypass Tokens.

---

## 6. What this changes about PR #92

The V2 PR is solid. Three small fixes before merge (2.12, 2.13, 2.14) and it's ready. Once merged, ~6 of the P1 items above resolve automatically. The remaining production bugs are independent of the V2 architecture and want their own focused fixes per Wave B.

End of punch list.
