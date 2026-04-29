# Audit Handoff — Today's Horoscope Philosophy Engine

> **Date**: 2026-04-29
> **Scope**: Comprehensive product audit + PRD-vs-reality gap analysis + prioritized next steps
> **Authoring context**: Operator stepped back from iterative video work to ask "where are we actually, and what's left to do?" Four parallel audit agents (PRD-baseline, website-UX, content-quality, operations) gathered evidence; this doc is the synthesis.
> **Supersedes for next session**: Read this BEFORE [`docs/HANDOFF.md`](./HANDOFF.md) — that doc is the prior sprint's video-work handoff and is partially stale (notably claims the critique loop isn't wired into cron — it is, since PR #67).

---

## 0. TL;DR — The honest snapshot

**What's working better than the operator thinks**:
- The 12 sampled live readings are *genuinely good* — sign-specific, anti-Barnum, anti-template, with concrete sensory imagery and varied rhythm. The prompt + judge are doing their job.
- The critique loop IS wired into the per-sign cron and running in production. (Stale claim in [`HANDOFF.md`](./HANDOFF.md) §1.)
- The 36-videos-per-day pipeline (3 types × 12 signs) actually fired correctly twice now (yesterday's night batch + today's morning + quote). Files land at `videos/{date}/{type}/{sign}.mp4` in Vercel Blob.
- All website routes resolve. **No broken links**. Email signup works. Philosopher council selector works.

**What's actually broken or missing**:
- **Birthday entry doesn't exist.** Users must already know their sign. The operator's "supposed to enter their birthday" expectation is not implemented. Astrology-literate users are filtered in by default.
- **Multi-philosopher synthesis is half-built.** Users pick 5 philosophers; only ONE is reflected per reading via `assignDaily` rotation. The "blend across council" promise from the PRD is not in the prompt. **This is the single highest-leverage product fix.**
- **Videos go nowhere visible.** They render to private Vercel Blob and stop. No social posting (intentional — accounts not connected). No on-site embedding. No email attachment. No archive viewer.
- **Subscriber count is unknown.** No introspection endpoint. We don't know if anyone is actually receiving the daily emails.
- **Phase 1d (corpus retrieval) blocked** on the living-philosopher fair-use posture decision — the single biggest unblock for "make readings resonate."
- **Phase 2 (astronomy: moon-phase / seasonal-marker / moon-sign) not started.** Readings have no temporal context.
- **Telegram bot is vestigial.** It posts a daily spot-check summary that duplicates GH Actions logs; uses a shared bot token; no decision recorded on whether to keep it.

**Cost reality**: ~$150–330/mo. ElevenLabs ($99–249) dominates. Anthropic + Vercel < $60/mo. Subscriber-driven costs (Resend) are unquantified.

**Recommended next session**: spin up a domain expert audit team (see §6) before any further code work. The product needs strategic direction more than it needs another iteration loop.

---

## 1. The product as designed (PRD baseline)

> Source: [`docs/plans/2026-04-01-002-feat-philosophy-engine-plan.md`](./plans/2026-04-01-002-feat-philosophy-engine-plan.md), [`docs/brainstorms/2026-04-01-homepage-redesign-email-sharing-requirements.md`](./brainstorms/2026-04-01-homepage-redesign-email-sharing-requirements.md), [`docs/plans/2026-04-08-001-feat-video-content-engine-plan.md`](./plans/2026-04-08-001-feat-video-content-engine-plan.md), [`docs/plans/2026-04-24-001-reading-authenticity-and-ai-sdk-migration-plan.md`](./plans/2026-04-24-001-reading-authenticity-and-ai-sdk-migration-plan.md)

### Mission
**Not predictions. Philosophy that meets you where you are.** The product is a *Philosophy Engine* — fundamentally different from generic horoscope apps. Users select their zodiac sign and curate a council of up to 5 philosophers from a roster of 54 thinkers across 9 traditions. Each day's reading blends those philosophers' frameworks with the sign's documented voice, anchored in verified source quotes.

### The Moat (per the homepage brainstorm)
> *"ChatGPT can write a horoscope. ChatGPT can write about Seneca. ChatGPT cannot remember your specific council across days and synthesize across their actual writings, rooted in verifiable sources, without sounding like a horoscope."*

The personalized, persistent council — evolving daily, grounded in real quotes — is the product. The horoscope is the delivery mechanism.

### Designed user flows

**First visit**:
1. Land on homepage with intro ("We trained an AI on 50+ philosophers…")
2. Step 1 — pick zodiac sign
3. Step 2 — pick 3-5 philosophers from grid (categorized by tradition); live preview shows how their voice blends with the sign
4. Step 3 — soft email gate: 2-sentence preview + featured quote, then "where should we send it?"
5. Step 4 — full reading reveals: sign greeting, "Guided by [council members]", body, quote+attribution, peaceful thought, share/edit/browse buttons

**Return visit**: skip directly to today's reading; council and email persisted in localStorage.

**Daily email**: cron generates 12 readings, segments subscribers by sign, sends personalized email via Resend with share/edit/unsubscribe links.

**Share**: Web Share API + branded OG quote card; recipient clicks → first-visit flow with sign pre-selected.

**Video distribution**: GH Actions cron renders 12 vertical videos/day; Ayrshare posts to TikTok/IG Reels/FB Reels/X with sign-specific captions; ramped cadence.

**Agent/API**: public `/api/guidance?sign=X&philosophers=...` JSON endpoint; MCP server published as npm package for Claude Code users.

### What "done" looks like (acceptance criteria from the PRDs)

| Phase | Criterion | Status |
|---|---|---|
| 1a | Vercel AI Gateway chokepoint at `src/tools/ai/provider.ts` | ✅ shipped (PR #60) |
| 1b | `reading:generate` parity port | ✅ shipped (PR #61) |
| 1b.5 | `reading:judge` verb + 4-model 144-cell baseline eval | ✅ shipped (PR #63) |
| 1c | Sonnet 4.6 + `generateObject` + canonical Zod schema | ✅ shipped (PR #65) |
| 1d | Corpus retrieval for living philosophers | ❌ blocked on posture decision |
| 1e | Critique-loop composer | ✅ shipped + LIVE in production cron |
| 2a | `astronomy:moon-phase` | ❌ not started |
| 2b | `calendar:seasonal-marker` | ❌ not started |
| 2c | `astronomy:moon-sign` | ❌ not started |
| Homepage | Step-by-step flow (sign → philosophers → soft gate → reading) | ✅ shipped |
| Homepage | Birthday-to-sign auto-derivation | ❌ never built |
| Email | Soft gate + Resend send | ✅ wired (subscriber count unknown) |
| Share | OG quote-card + Web Share API | ⚠️ basic OG only; no dedicated share-card surface |
| API | Public `/api/guidance` endpoint | ⚠️ partial — `/api/horoscope` exists, but the spec'd `guidance` route + JSON shape unclear |
| MCP | Published npm package | ❌ MCP server exists in repo; not published |
| Video | 12 daily videos rendered + posted to TikTok/IG/FB/X | ⚠️ rendering works; **distribution disabled** |
| Compilation video | All-12-signs slideshow | ❌ deferred per plan |

---

## 2. The product as it actually exists today

### Live URLs and ops health
- **Frontend**: https://www.gettodayshoroscope.com — Vercel project `horoscope-ai-frontend`, healthy, responding
- **API**: https://api.gettodayshoroscope.com — Vercel project `horoscope-ai-api`, healthy (`/api/debug/ping` returns 200)
- **Repo**: https://github.com/zone17/horoscope-ai-app — branch `main` clean

### What runs daily
1. **0:00–0:11 UTC** — Vercel cron at `/api/cron/daily/{sign}` (12 entries, staggered 1 min apart) generates today's reading per sign via `generateReadingWithCritique` (Sonnet 4.6 + judge loop), stores in Redis, segments subscribers and sends emails via Resend, attempts social distribution (currently no-op since `AYRSHARE_API_KEY` deliberately unset). Per-sign idempotency lock prevents double-send.
2. **1:00 UTC** (cron-drift in practice ~3.5h late on GH Actions free tier) — GH Actions workflow renders 12 morning videos (45s each, WordReveal pattern, voice intro "Aries. Tuesday, April 28th." then reading body, branded CTA outro), uploads to `videos/{date}/morning/{sign}.mp4` in Vercel Blob.
3. **12:00 UTC** (~14:00 actual) — same workflow renders 12 quote videos (22s, KaraokeReveal pattern, voice "Aries. Today's wisdom." + quote + author).
4. **22:00 UTC** (~23:00 actual) — same workflow renders 12 night videos (28s, KaraokeReveal, "Aries. Tonight's reflection." + peaceful thought).
5. Videos auto-cleanup at 4 days retention to fit Hobby Blob 1 GB.
6. After each video cron, a Telegram message + sample MP4 fires to a chat (shared bot, see §3.6).

### What the user actually experiences
- Lands on homepage, sees a 12-sign zodiac picker. **Has to know their sign.**
- Picks sign → philosopher grid (54 across 9 traditions; recommendations surface based on sign) → council of 1-5.
- Soft email gate offers a teaser; "Skip for now" is available.
- Personalized reading rendered using ONE philosopher from the council via daily rotation (not blended).
- Share button uses Web Share API; OG image generates dynamically.
- Return visits skip the wizard — go straight to reading.

### What runs but is invisible
- Daily emails to subscribers (count unknown — no observability).
- 36 videos/day in Vercel Blob (private; not posted, embedded, or archived for users).
- MCP server registered (12 tools, 2 MCP Apps); not published to npm.

---

## 3. Gap analysis: PRD vs reality

### 3.1 Birthday-to-sign — designed, never built [P1 user-facing]
- **PRD intent**: "first-visit flow" implies a wizard that meets the user where they are. The brainstorm doesn't explicitly require birthday entry, but the operator's mental model is that "people enter their birthday to get their sign." That intuition is correct for the broad audience.
- **Reality**: 12-button sign picker; user must already know they're a Pisces. Discoverable for astrology-literate users; cliff for everyone else.
- **Lift**: Add a date picker → calculate sign → optional sign confirmation → continue. ~1 day of work plus a small zodiac-from-birthdate utility. No backend changes.
- **Why it matters**: The operator believes (rightly) that this is one of the largest top-of-funnel UX losses. Confirmed by audit: there's no tooltip, helper, or fallback for "I don't know my sign."

### 3.2 Multi-philosopher synthesis — half-built [P0 product-quality]
- **PRD intent**: "blend the intellectual frameworks of [the user's] council members" → reading should feel like the philosophers chose THIS reader.
- **Reality**: `philosopher:assign-daily` rotates through the council (one philosopher per day via `(dayNum + signIndex) % council.length`), but `reading:generate` accepts a single `philosopher` string. Only the rotation winner shapes the reading. The user has 5 voices in their council; only 1 voice per reading.
- **Lift**: Extend `GenerateReadingInput` to optionally accept the full `council`; modify `buildReadingPrompt` to inject a synthesis brief ("voice of {todayPhilosopher}, but resonance with {others}") and offer quotes from the entire council in the bank. ~3 days. Eval impact via the existing 144-cell harness.
- **Why it matters**: This is the operator's "make readings more meaningful" complaint, decoded. The readings ARE good (audit confirms). The disconnect is that *the personalization is shallower than the user thinks*. Fixing this delivers the PRD's promised moat.

### 3.3 Phase 1d corpus retrieval — blocked on a strategic decision [P0 strategic]
- **PRD intent**: Sign-aware council blending grounded in *real writings*, not voice-matching hallucination.
- **Reality**: Living philosophers (Naval, Tolle, Sadhguru, Pema Chödrön, late-career Watts, etc.) are voice-matched against verified quotes only — no corpus retrieval, no RAG.
- **Blocking question**: Living-philosopher posture (a) fair-use indexing, (b) freely-shared material only, (c) skip living philosophers entirely. Lean is (b) per [`HANDOFF.md`](./HANDOFF.md) §11.
- **Lift after decision**: ~2 weeks (corpus build, retrieval verb, prompt integration, eval).
- **Why it matters**: This is the single biggest unlock for "actually feels like Marcus Aurelius wrote it" vs "ChatGPT's idea of Marcus Aurelius."

### 3.4 Phase 2 astronomical inputs — not started [P1 differentiation]
- **PRD intent**: `astronomy:moon-phase`, `calendar:seasonal-marker`, `astronomy:moon-sign` as new atomic verbs feeding the prompt. Readings should know the moon is waning, the equinox is tomorrow, Mercury is retrograde.
- **Reality**: Readings are temporally agnostic beyond date-seeded format-template rotation.
- **Lift**: ~1 week per verb. Calculations are deterministic (no APIs needed for moon phase / seasonal markers). Inject as a "today's lunar context: {phase}; seasonal energy: {theme}" preamble.
- **Why it matters**: This is what separates "Philosophy Engine" from "well-prompted ChatGPT horoscope." Today's reading is generic-as-philosophy; this lever makes it generic-as-philosophy-on-a-specific-Tuesday-in-late-April.

### 3.5 Video distribution — built, dormant [P1 distribution]
- **PRD intent**: Cron renders → Ayrshare posts → 4 platforms (TikTok / IG Reels / FB Reels / X) with sign-specific captions, hashtags, ramped cadence.
- **Reality**: Cron renders ✓. Ayrshare integration exists. **`AYRSHARE_API_KEY` intentionally not exposed to GH Actions** per PR #75 — accounts not connected, social posting is OFF until ops resources are available. Videos accumulate in Blob, get deleted at 4 days, no human ever sees them outside the Telegram sample.
- **Lift to enable**: Connect TikTok/IG/FB/X to Ayrshare (~1 hour ops time per platform), set the secret, flip the workflow's `--no-post` default to `false`. Plus content-strategy decisions (caption templates, hashtag rotation, posting times).
- **Why it matters**: 36 videos/day with zero distribution is pure cost. Either ship distribution or stop rendering.

### 3.6 Telegram bot — vestigial [P3 hygiene]
- **What it does**: Sends a daily summary of the video render run + a sample MP4. Defined in `scripts/render-and-post.ts:342–398`.
- **What it's for**: Unclear. Operator: "I am not even sure what the reasoning is for the bot."
- **Operational value**: Duplicates GH Actions run logs. No alerting, no decision triggers. The bot token is shared with another app of the operator's, which feels accidental.
- **Recommendation**: One of three:
  1. **Repurpose as a real ops alert channel** — fire only on render failures, send rich diagnostics. Useful.
  2. **Migrate to a dedicated bot** with a clear "horoscope-ops" identity. Cosmetic but clean.
  3. **Delete entirely.** Lowest-cost option. The data is already in GH Actions.
- **Recommended path**: (3) delete unless someone is actively reading the daily summaries. The audit found no evidence anyone is.

### 3.7 Subscriber observability — missing [P1 ops]
- **What we know**: Cron calls `segment({ sign })` and `sendDailyEmail` in a loop. Resend is wired. Code path executes.
- **What we don't know**: How many subscribers exist. Whether emails are actually being delivered. Open rate. Unsubscribe rate.
- **Lift**: Two things: (a) a debug endpoint at `/api/debug/subscribers` returning total count by sign (5 lines of Redis SCAN), (b) Resend webhook → log received/opened/bounced events to a simple counter. ~half day.
- **Why it matters**: We're in production but flying blind on the email funnel.

### 3.8 Public agent API + MCP package — partial [P2 ecosystem]
- **PRD intent**: `/api/guidance?sign=X&philosophers=...` JSON shape for agent/CLI access; MCP server as published npm package.
- **Reality**: `/api/horoscope?sign=X&philosophers=...` exists (close enough as a JSON endpoint); MCP server is in `packages/mcp-server/` but unpublished.
- **Lift to ship**: ~half day to publish the MCP package; ~1 day to formalize a clean `/api/guidance` shape (vs the snake-cased `/api/horoscope` shape) if we want the cleaner API surface.
- **Why it matters**: Low-priority compared to user-facing fixes, but the MCP package is "free distribution" — Claude Code users would discover the engine, which doubles as a credibility signal.

---

## 4. Top 10 prioritized issues

Ranked by leverage (impact ÷ effort × strategic alignment with the PRD):

| # | Issue | Severity | Effort | Owner type |
|---|---|---|---|---|
| 1 | **Multi-philosopher synthesis** — only 1 of 5 council voices per reading | P0 product | 3d | Prompt engineer / content lead |
| 2 | **Living-philosopher corpus posture decision** (blocks Phase 1d) | P0 strategic | 1 day decision + 2 weeks build | Product strategy + legal review |
| 3 | **Birthday-to-sign onboarding** — currently filters out non-astrology-literate users | P1 UX | 1d | Frontend / UX |
| 4 | **Subscriber observability + email funnel metrics** | P1 ops | 0.5d | Backend / ops |
| 5 | **Phase 2 astronomy verbs (moon-phase, seasonal-marker)** | P1 differentiation | 1 week | Domain (astronomy) + prompt engineer |
| 6 | **Video distribution decision** — connect Ayrshare or stop rendering | P1 distribution | 1d setup + content strategy | Ops + brand/content |
| 7 | **Eval harness on schedule + alert** — quality drift detection | P2 quality | 0.5d | Backend / ML ops |
| 8 | **Telegram bot — keep / repurpose / delete** | P3 hygiene | 0.5d | Ops |
| 9 | **`OPENAI_API_KEY` removal — migrate `horoscope-generator.ts` (monthly pages)** | P3 cleanup | 0.5d | Backend |
| 10 | **MCP server npm publish + `/api/guidance` formalization** | P3 ecosystem | 1d | Backend |

**Not on the list (deliberately)**:
- Further video composition iteration. The 3-video split + per-type music + announce-then-content pattern is shipped and stable. Don't iterate further until distribution is real.
- Stripe / monetization. Premature. Validate the funnel first.
- Rising sign personalization. Defer until base personalization (council synthesis) lands.

---

## 5. User-reported pain points: validated and not

The operator reported five things in their step-back message. Audit findings on each:

| Operator's claim | Audit finding |
|---|---|
| "the daily horoscopes are not good, we need different logic to make them more meaningful" | **Partially validated.** Sampled 12 live readings — they're actually good (anti-Barnum, anti-template, sign-specific, concrete sensory imagery). The disconnect is the multi-philosopher gap (#1 above) — readings are shallower than the personalization implies. Plus Phase 1d (corpus) and Phase 2 (astronomy) would compound the depth. |
| "the website is not working properly" | **Partially refuted.** No broken links. All routes resolve. Email signup works. Council selector works. The functional issue is real: birthday entry doesn't exist. |
| "the workflow was supposed to have people enter their birthday to get their sign" | **Validated.** That entry point is missing. The closest the codebase has is a 12-button sign picker. |
| "lots of broken links" | **Refuted.** Audit found zero broken `<Link>` / `<a href>` / `router.push` targets. Possible operator confusion: localhost-fallback string in dev (`SignPageClient.tsx:39`) won't appear in prod, but reads as suspicious during local dev. |
| "telegram bot — not sure what the reasoning is" | **Validated.** Bot is vestigial (§3.6). |

**Net read**: the operator's instincts about quality and distribution are correct. The website concerns are mostly about an absent flow (birthday entry) rather than broken code. The path forward starts with strategy, not more code.

---

## 6. NEXT SESSION: Domain expert audit team

The operator's directive: *"a good first item for the next session is to spin up a team of domain experts to do a complete audit on the product and see where we go from here."*

This is the right move. Use `/team-builder` or spawn parallel agents per the playbook. The recommended team:

### 6.1 Product strategist
- **Mandate**: Reconcile the PRD (`docs/plans/2026-04-01-002-...`, `docs/brainstorms/2026-04-01-...`) with current state. Decide which deferred items remain in scope, which get punted to v2, which get killed.
- **Deliverable**: An updated `docs/PRD_2026-Q3.md` that reflects what we're actually building over the next quarter.
- **Inputs**: this audit doc, prior PRDs, operator's strategic asks.

### 6.2 UX / onboarding flow specialist
- **Mandate**: Design the birthday-entry flow. Audit the wizard (sign → philosophers → email gate → reading) for friction. Decide on the email gate's hardness (skippable today; should it be?). Consider mobile-first paths.
- **Deliverable**: Wireframes / Figma for the new onboarding + a migration plan that preserves return-user state.
- **Inputs**: audit §3.1, agent 2 report, current `src/components/home/` files.

### 6.3 Content / prompt engineer (philosophy + LLM)
- **Mandate**: Design multi-philosopher synthesis (§3.2). Propose Phase 1d corpus integration approach contingent on the posture decision. Propose Phase 2 astronomy prompt integration. Re-run the 144-cell eval harness with proposed changes; compare to baseline.
- **Deliverable**: Updated prompt design doc + eval results + draft of `buildReadingPrompt` v2.
- **Inputs**: agent 3 report, `src/tools/reading/generate.ts`, `docs/evals/2026-04-25-baseline.md`.

### 6.4 Astrology domain expert
- **Mandate**: Sanity-check the sign profiles in `src/tools/zodiac/sign-profile.ts`. Are the voices accurate? Should rising sign be added? Is the lunar/element logic doing real astrological work or cosmetic? Should the 9-tradition philosopher categorization be revisited?
- **Deliverable**: Annotated review of sign profiles + recommendations.
- **Inputs**: `src/tools/zodiac/sign-profile.ts`, `src/tools/philosopher/registry.ts`.

### 6.5 Brand + visual design auditor
- **Mandate**: Audit the homepage, the reading display, the OG share cards, the rendered videos for visual coherence. Is "philosophy engine" the brand the visuals are selling? Where does the design feel astrology-generic? Where does it feel premium?
- **Deliverable**: Brand audit doc + a punch list of visual fixes.
- **Inputs**: live site, the rendered MP4s on the operator's Desktop, `docs/UI_DESIGN_SYSTEM.md`, `docs/design-philosophy.md`.

### 6.6 SEO + organic acquisition auditor
- **Mandate**: The brainstorm explicitly notes "near-zero organic traffic." Audit the site for SEO hygiene (already extensive per `docs/CORE_WEB_VITALS.md`, `docs/seo/`). Find the gap between "well-optimized" and "actually ranking." Look at search intent, content depth, internal linking, schema, indexable archive depth.
- **Deliverable**: SEO audit + 30/60/90-day organic acquisition plan.
- **Inputs**: live site, `docs/seo/`, GSC / Vercel Analytics if available.

### 6.7 Email lifecycle / growth specialist
- **Mandate**: Design the email lifecycle. Daily horoscope is just one touchpoint; what's the welcome series, the re-engagement series, the council-edit-prompt? Plus segmentation: should premium users get longer reads, council members rotated more? Plus deliverability: SPF/DKIM/DMARC, Resend reputation.
- **Deliverable**: Email lifecycle design doc + observability spec (#4).
- **Inputs**: `src/utils/email-template.ts`, audit §3.7, current Resend setup.

### 6.8 Video distribution / short-form content strategist
- **Mandate**: Decide if we ship distribution. If yes: caption design, hashtag strategy, platform-by-platform tactical plan, ramped cadence per the PRD. If no: shut down the video pipeline (saves $99–249/mo of ElevenLabs).
- **Deliverable**: Distribution plan or a kill-decision doc.
- **Inputs**: agent 4 report, `docs/plans/2026-04-08-001-feat-video-content-engine-plan.md`, the rendered videos.

### 6.9 Ops + cost optimizer
- **Mandate**: Validate the $150–330/mo cost picture. Find optimizations (Haiku for cron critique loop after Phase 1d? cheaper TTS for high-volume video?). Audit GH Actions cron drift — is paid runner worth it for tighter scheduling? Decide on monthly-pages OpenAI migration timeline (#9).
- **Deliverable**: Cost dashboard + 3 quick-win optimizations.
- **Inputs**: agent 4 report, `vercel env ls`, ElevenLabs / Anthropic billing pages.

### 6.10 Monetization strategist
- **Mandate**: The PRD explicitly defers premium mentor tier and Stripe. Decide whether to build a free → premium funnel now (with the council as the wedge — pay for richer council, more philosophers, longer readings, voice playback) or stay free + ad-supported.
- **Deliverable**: Monetization decision doc with model + price points.
- **Inputs**: PRD future-state items, audit §3.

### How to spawn the team

Suggested approach for the next session:

```
/team-builder enterprise "comprehensive product audit of horoscope-ai-app
Philosophy Engine — read docs/HANDOFF_2026-04-29_AUDIT.md as the brief.
Deliverable: each domain expert produces their audit + recommendations
in docs/audits/2026-MM-DD-{role}.md. Synthesize into a consolidated
product strategy doc."
```

Or spawn the 10 agents in parallel as background tasks (the pattern used in this audit). Either works; team-builder gives you CE workflow gates for free, parallel-spawn is faster.

---

## 7. Where to look in the codebase

| What you're looking for | Where it lives |
|---|---|
| The reading prompt | `src/tools/reading/generate.ts:76–162` (`buildReadingPrompt`) |
| The judge prompt + scoring | `src/tools/reading/judge.ts:139–228` |
| The critique loop | `src/tools/reading/generate-with-critique.ts` |
| Per-sign cron route | `src/app/api/cron/daily/[sign]/route.ts` |
| GH Actions video workflow | `.github/workflows/render-videos.yml` |
| The Remotion compositions | `remotion/HoroscopeVideo.tsx` (3-type branching), `remotion/Root.tsx` (3 compositions) |
| Render script | `scripts/render-and-post.ts` |
| Voiceover (ElevenLabs primary, edge-tts fallback) | `src/utils/voiceover.ts` |
| Sign profiles (12 voices) | `src/tools/zodiac/sign-profile.ts` |
| Philosopher registry (54 across 9 traditions) | `src/tools/philosopher/registry.ts` |
| Quote bank (~541 verified quotes) | `src/tools/reading/quote-bank.ts` |
| Per-sign video accent colors | `src/utils/video-helpers.ts` (`SIGN_ACCENTS`) |
| Daily-rotation logic | `src/tools/philosopher/assign-daily.ts` |
| Email send | `src/utils/email.ts` + `src/utils/email-template.ts` |
| Subscribe / unsubscribe API | `src/app/api/subscribe/route.ts`, `src/app/api/unsubscribe/route.ts` |
| Public reading API | `src/app/api/horoscope/route.ts` |
| Eval harness | `scripts/eval/reading-baseline.ts`, results at `docs/evals/2026-04-25-baseline.md` |
| Homepage wizard | `src/app/page.tsx`, `src/components/home/` |
| Telegram bot code | `scripts/render-and-post.ts:342–398` (`sendTelegramSummary`) |
| Sample reading from prod | `curl https://api.gettodayshoroscope.com/api/horoscope?sign=aries \| python3 -m json.tool` |
| Sample video | `https://e4snsaqafesuolkc.private.blob.vercel-storage.com/videos/{date}/{type}/{sign}.mp4` (auth required) |

---

## 8. Operational reality

### Cost (monthly)

| Component | Cost | Notes |
|---|---|---|
| Anthropic Sonnet 4.6 | $6–9 (live) → $10–15 with critique loop | Critique loop is now wired; cost is on the higher end |
| ElevenLabs voiceover | $99–249 | Largest single expense; depends on plan tier |
| Vercel (2 Pro projects) | $40 | Frontend + API |
| Vercel Blob | $0 (in Pro) | <1 GB at 4-day retention |
| Resend email | $0–20 | Subscriber-count dependent |
| Ayrshare social | $0 | Dormant |
| GitHub Actions | $0 | Under free tier |
| **Total** | **~$150–330/mo** | ElevenLabs dominates |

### Cron drift (GH Actions free tier)

Observed today (2026-04-29):
- `0 1 * * *` morning → fired at **04:26 UTC** (~3.5h late)
- `0 12 * * *` quote → fired at **14:01 UTC** (~2h late)
- `0 22 * * *` night → expected ~22:00 UTC, may drift to 23:00–01:00 UTC

This is normal for GH Actions free runners. If timing matters (e.g., "morning email arrives by 7am ET"), options:
- GH Actions paid runners (~$0.008/min, would cost ~$5/mo at current usage)
- Move to Vercel Sandbox (per Vercel knowledge update — GA Jan 2026, ephemeral microVMs)
- Accept the drift and design content around "fires sometime in the user's morning"

### Test coverage

- Tool tests: 159 passing in 0.8s (`npx jest __tests__/tools`)
- Cron route tests: 14+ passing
- Component tests: ~140; some pre-existing failures (`SchemaMarkup.test.tsx`, etc.) — known and not regressions

### Known operational concerns

- `OPENAI_API_KEY` still required despite migration; blocks `src/utils/horoscope-generator.ts` (monthly pages). #9 above.
- Subscriber count: unknown. #4 above.
- Blob retention: 4 days (set in `scripts/render-and-post.ts`). Bumping requires Pro Blob plan.
- The deprecated `/api/cron/daily-horoscope` route still exists as a manual fallback (not scheduled). Can be deleted once confidence in the per-sign cron is high.

---

## 9. Open strategic decisions

| Decision | Owner | Blocks | Lean |
|---|---|---|---|
| Living-philosopher corpus posture (a / b / c) | Product + legal | Phase 1d | (b) freely-shared only |
| Birthday-entry onboarding (build / defer / split-test) | Product + UX | #3 | Build |
| Multi-philosopher synthesis (single-voice today vs blended tomorrow) | Product + content | #1 | Blend |
| Video distribution (ship Ayrshare / kill pipeline) | Product + brand | #6 | Ship if ramped cadence is realistic; otherwise pause |
| Telegram bot fate | Ops | #8 | Delete unless genuinely used |
| Monetization timing (now / after #1+#3 / after Phase 1d) | Product | #10 | After #1 + #3 — once readings are demonstrably 10x and onboarding converts |
| Agent runtime (Vercel AI SDK loops / Anthropic Managed Agents / self-host) | Backend | Future agent work | Vercel AI SDK loops |

---

## 10. Appendix — Audit agent reports

The four parallel audit agents that produced this synthesis:

1. **PRD baseline** — read 9 docs (HANDOFF, PROJECT_CONTEXT, ARCHITECTURE, AGENT_HANDOFF, brainstorms, plans, README); produced the as-designed snapshot in §1.
2. **Website UX** — inventoried routes, components, internal links, the wizard flow; key finding: birthday entry missing, no broken links.
3. **Content quality** — inspected 12 live readings via the public API, traced the prompt + judge + critique loop; key finding: readings are good, but multi-philosopher synthesis is unbuilt.
4. **Operations** — inventoried env vars, cron schedules, deployments, costs, feature flags, test coverage, Telegram bot; key finding: critique loop IS wired and live (HANDOFF.md says otherwise — that doc is stale).

Full agent transcripts are preserved in the session log; the headlines from each are reflected throughout this doc.

---

## Closing

The product is in a healthier place than the operator's frustration suggests, and a less-finished place than the prior HANDOFF claims. The real work for the next quarter isn't another iteration on video composition — it's reconciling the PRD with reality, picking the strategic levers (multi-philosopher synthesis, Phase 1d corpus, Phase 2 astronomy, distribution decision), and validating with subscribers whether anyone is actually receiving value.

The first concrete next step is: spin up the §6 domain expert team, have each produce their audit + recommendations, then synthesize into a single product strategy doc that drives Q3 work.

— End of audit handoff —
