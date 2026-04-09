---
title: "feat: Automated Video Content Engine"
type: feat
status: active
date: 2026-04-08
origin: docs/brainstorms/2026-04-08-video-content-engine-requirements.md
---

# feat: Automated Video Content Engine

## Overview

Build an autonomous pipeline that renders daily horoscope readings into 60-second short-form videos and posts them across TikTok, Instagram Reels, Facebook Reels, and X. The existing Remotion composition (proven in test render) becomes the template. OpenAI TTS adds voiceover. Ayrshare handles multi-platform distribution in a single API call. The pipeline runs daily via cron with zero human intervention.

## Problem Frame

The site has near-zero organic traffic. The product generates 12 unique philosophical readings daily but has no distribution channel. Short-form video is the #1 discovery mechanism for astrology content — Astroscope gets 70M views/month with text slideshows. The content exists; it needs to become video and reach audiences where they already are. (see origin: docs/brainstorms/2026-04-08-video-content-engine-requirements.md)

## Requirements Trace

**Video Rendering:** R1-R9 (Remotion, backgrounds, text reveal, voiceover, music, particles, fonts, output format)
**Video Structure:** R10-R16 (60s scene-based: hook, reading, quote, peaceful thought, CTA, watermark)
**Video Types:** R17-R19 (12 individual + 1 compilation = 13 daily)
**Infrastructure:** R20-R23 (Vercel Sandbox rendering, Blob storage, cron trigger, parallel renders)
**Social Posting:** R24-R29 (Ayrshare, 4 platforms, ramped cadence, staggered schedule, captions/hashtags)
**Voiceover:** R34-R37 (OpenAI TTS, warm voice, consistent narrator)

## Scope Boundaries

- NOT building AI-generated footage — text-on-screen with zodiac backgrounds for v1
- NOT building custom social API integrations — using Ayrshare
- NOT building a video editing UI — fully automated
- NOT changing the horoscope generation pipeline — consuming cached readings
- NOT building video analytics dashboard — platform native analytics initially
- The all-12-signs compilation video (R18) is deferred to a follow-up unit — ship the single-sign pipeline first

## Context & Research

### Relevant Code and Patterns

- `remotion/HoroscopeVideo.tsx` — working 5-scene composition, test-rendered to MP4 (8.5MB, 60s)
- `remotion/Root.tsx` — composition registration with Scorpio default props
- `src/app/api/cron/daily-horoscope/route.ts` — cron pattern: CRON_SECRET auth, serial sign iteration, `after()` for background work
- `src/utils/horoscope-generator.ts` — `HoroscopeData` shape with `message`, `inspirational_quote`, `quote_author`, `peaceful_thought`
- `src/utils/cache-keys.ts` — `horoscopeKeys.daily(sign, date)` for reading cached content
- `src/constants/zodiac.ts` — `VALID_SIGNS`, `SIGN_META` (symbol, element per sign)
- `public/videos/zodiac/` — 13 background videos (all 12 signs + space.mp4)
- `scripts/backfill-archive.ts` — pattern for standalone scripts with `dotenv`, `--dry-run`, throttled batches

### Institutional Learnings

- Vercel Hobby 10s function timeout — cannot render video in a serverless function
- Two Vercel projects — video cron route deploys with API project
- Redis double-prefix — use safe helpers exclusively

### External References

- Remotion Vercel Sandbox: 45min timeout Hobby, 10 concurrent. Uses `@remotion/vercel` package with `renderMediaOnVercel()`
- Vercel Blob: `put()` from `@vercel/blob`, $0.023/GB-month storage, $0.05/GB transfer
- OpenAI TTS: `tts-1` model, `nova` voice, $15/1M chars (~$0.018/video), MP3 output
- Ayrshare: single POST to `/api/post` with `platforms` array, `scheduleDate` for scheduling, `mediaUrls` for video. Paid plan required for video
- Ambient music: Pixabay Music or Mixkit — free, no attribution, commercial use cleared

## Key Technical Decisions

- **Render via standalone script, not Vercel cron**: Vercel Hobby has 10s function timeout. Remotion rendering takes 3-8 minutes per video. Use a standalone `scripts/render-and-post.ts` script triggered by GitHub Actions cron (or run manually). This avoids the Vercel timeout entirely and uses `@remotion/renderer` locally/in CI (see origin: R20, adapted due to Hobby plan constraint)

- **OpenAI TTS `tts-1` with `nova` voice**: Already installed (`openai` package). $0.018 per video. Warm, friendly tone. No new dependency. Can upgrade to ElevenLabs later if quality bar isn't met (see origin: R34-R37, resolved)

- **Pixabay Music for ambient track**: Free, no attribution, commercially cleared for all social platforms. Download one lo-fi ambient track, store in `public/audio/`. Baked into Remotion composition (see origin: R5, resolved)

- **Vercel Blob for video storage**: Rendered MP4s uploaded via `@vercel/blob`. Public URLs served directly to Ayrshare. ~8.5MB per video x 12 = ~102MB/day. Hobby plan includes 1GB storage — rotate old videos monthly (see origin: R21)

- **GitHub Actions cron for daily pipeline**: `.github/workflows/render-videos.yml` runs at 1am UTC daily. Checks out repo, pulls env vars, runs `scripts/render-and-post.ts`. GitHub Actions has no timeout issues (6-hour job limit) and includes Node.js + Chrome (see origin: R22, adapted)

- **Defer compilation video**: The all-12-signs compilation (R18) adds complexity. Ship the 12 individual sign videos first, add compilation in a follow-up

## Open Questions

### Resolved During Planning

- **Voiceover provider**: OpenAI TTS `tts-1` with `nova` voice — already installed, $0.018/video
- **Render infrastructure**: GitHub Actions cron with `@remotion/renderer` — avoids Vercel Hobby timeout
- **Ambient music**: Pixabay Music — free, no attribution, all platforms cleared
- **Video storage**: Vercel Blob — simple, CDN-backed, affordable

### Deferred to Implementation

- Exact Ayrshare plan tier and credit consumption per video post
- GitHub Actions Chrome/Chromium setup for Remotion rendering in CI
- Optimal ambient music track selection (listen and pick during implementation)
- Ayrshare caption templates and hashtag rotation strategy

## High-Level Technical Design

> *This illustrates the intended approach and is directional guidance for review, not implementation specification.*

```
Daily Pipeline (1am UTC via GitHub Actions):

┌─────────────────────────────────────┐
│  GitHub Actions Cron (.yml)         │
│  1. Checkout repo                   │
│  2. npm ci                          │
│  3. Run scripts/render-and-post.ts  │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  For each of 12 signs:             │
│                                     │
│  1. Read cached reading from Redis  │
│     (horoscopeKeys.daily)          │
│                                     │
│  2. Generate voiceover via          │
│     OpenAI TTS (tts-1, nova)       │
│     → Save MP3 to temp/            │
│                                     │
│  3. Render video via Remotion       │
│     (1080x1920, 60s, 30fps)       │
│     → Background .mp4 + text +     │
│       voiceover + ambient music     │
│     → Output H.264 MP4             │
│                                     │
│  4. Upload MP4 to Vercel Blob      │
│     → Get public URL               │
│                                     │
│  5. Post via Ayrshare API          │
│     → platforms: [ig, tiktok,      │
│        facebook, x]                │
│     → scheduleDate for stagger     │
│     → caption + hashtags           │
└─────────────────────────────────────┘
```

## Implementation Units

### Phase 1: Rendering Pipeline

- [ ] **Unit 1: Element Color Map + Video Data Helper**

**Goal:** Create a utility that maps signs to their element colors and transforms HoroscopeData into Remotion props.

**Requirements:** R2, R3

**Dependencies:** None

**Files:**
- Create: `src/utils/video-helpers.ts`
- Test: `__tests__/utils/video-helpers.test.ts`

**Approach:**
- Export `ELEMENT_COLORS: Record<string, string>` mapping element names to hex (Fire: #F97316, Earth: #84CC16, Air: #38BDF8, Water: #A78BFA)
- Export `getSignVideoProps(sign, horoscopeData)` that returns `HoroscopeVideoProps` — maps `inspirational_quote` → `quote`, `quote_author` → `quoteAuthor`, looks up element color from `SIGN_META[sign].element`, formats date
- Export `getSignElementColor(sign)` helper

**Patterns to follow:**
- `src/constants/zodiac.ts` for typed constant pattern

**Test scenarios:**
- Happy path: `getSignVideoProps('scorpio', data)` returns correct props with Water color (#A78BFA)
- Happy path: all 12 signs map to valid element colors
- Edge case: sign with missing SIGN_META returns fallback color

**Verification:**
- All 12 signs produce valid HoroscopeVideoProps

---

- [ ] **Unit 2: OpenAI TTS Voiceover Generation**

**Goal:** Generate MP3 voiceover from horoscope reading text using OpenAI TTS API.

**Requirements:** R4, R34-R37

**Dependencies:** None

**Files:**
- Create: `src/utils/voiceover.ts`
- Test: `__tests__/utils/voiceover.test.ts`

**Approach:**
- Export `generateVoiceover(text: string, outputPath: string): Promise<string>` — calls OpenAI TTS API with model `tts-1`, voice `nova`, returns the file path
- Concatenate reading message + quote attribution into a single narration script: "{message} ... {quote} by {author}"
- Pause between sections using `...` (TTS interprets as natural pause)
- Save MP3 to a temp directory
- Handle missing API key gracefully (skip voiceover, log warning)

**Patterns to follow:**
- `src/utils/horoscope-generator.ts` for OpenAI client pattern

**Test scenarios:**
- Happy path: `generateVoiceover(text, path)` calls OpenAI TTS and writes MP3 file (mock API)
- Happy path: narration script concatenates message + quote correctly
- Error path: OpenAI API failure returns null and logs error (doesn't throw)
- Edge case: missing OPENAI_API_KEY skips generation

**Verification:**
- MP3 file is generated for a sample reading text

---

- [ ] **Unit 3: Remotion Composition Audio Integration**

**Goal:** Add voiceover audio and ambient music to the existing HoroscopeVideo composition.

**Requirements:** R4, R5, R9

**Dependencies:** Unit 2

**Files:**
- Modify: `remotion/HoroscopeVideo.tsx` — add `<Audio>` components for voiceover and ambient
- Modify: `remotion/Root.tsx` — add `voiceoverSrc` and `ambientSrc` to defaultProps
- Create: `public/audio/ambient-lofi.mp3` — download one track from Pixabay Music

**Approach:**
- Add `voiceoverSrc?: string` and `ambientSrc?: string` to HoroscopeVideoProps
- Add `<Audio>` for voiceover: starts at SCENES.reading.start, full volume, no loop
- Add `<Audio>` for ambient: starts at frame 0, volume 0.15, loop, fade in over 30 frames, fade out last 30 frames
- Both are optional — composition renders fine without audio (for preview)
- Use `staticFile()` for ambient, dynamic path for voiceover

**Patterns to follow:**
- Remotion `<Audio>` component with `volume` callback for fade

**Test scenarios:**
- Test expectation: none — audio integration verified by playing the rendered video

**Verification:**
- Rendered video has audible voiceover during reading scene and ambient music throughout

---

- [ ] **Unit 4: Render + Upload Script**

**Goal:** Standalone script that renders all 12 sign videos and uploads to Vercel Blob.

**Requirements:** R1, R9, R17, R20, R21, R22, R23

**Dependencies:** Units 1, 2, 3

**Files:**
- Create: `scripts/render-and-post.ts`
- Modify: `package.json` — add `@vercel/blob` dependency

**Approach:**
- Load env vars via `dotenv` (same pattern as `scripts/backfill-archive.ts`)
- For each of 12 signs (serial to manage memory):
  1. Read cached reading from Redis via `safelyRetrieveForUI(horoscopeKeys.daily(sign, today))`
  2. Transform to video props via `getSignVideoProps()`
  3. Generate voiceover via `generateVoiceover()` → temp MP3
  4. Bundle Remotion project, render via `renderMedia()` from `@remotion/renderer`
  5. Upload MP4 to Vercel Blob via `put()`
  6. Store Blob URL in results array
  7. Clean up temp files
- CLI flags: `--dry-run` (logs what would render, no API calls), `--sign scorpio` (render single sign for testing)
- Log progress per sign
- Output summary: `{ sign, blobUrl, duration }[]`

**Patterns to follow:**
- `scripts/backfill-archive.ts` for script structure, dotenv, CLI flags
- `@remotion/renderer` `renderMedia()` for local SSR

**Test scenarios:**
- Happy path: script renders a video for a sign with cached reading and uploads to Blob
- Happy path: `--dry-run` logs actions without rendering or uploading
- Happy path: `--sign scorpio` renders only Scorpio
- Error path: missing Redis reading for a sign → skip with warning
- Error path: Remotion render failure → log error, continue to next sign

**Verification:**
- Running `npx tsx scripts/render-and-post.ts --sign scorpio` produces a Vercel Blob URL for a Scorpio video

---

### Phase 2: Social Distribution

- [ ] **Unit 5: Ayrshare Posting Integration**

**Goal:** Post rendered videos to all 4 social platforms via Ayrshare API.

**Requirements:** R24-R29

**Dependencies:** Unit 4

**Files:**
- Create: `src/utils/social-posting.ts`
- Test: `__tests__/utils/social-posting.test.ts`

**Approach:**
- Export `postVideoToSocial(options: PostOptions): Promise<PostResult>` — single Ayrshare API call
- `PostOptions`: `{ videoUrl, caption, hashtags, platforms, scheduleDate? }`
- `PostResult`: `{ success, platformResults, errors }`
- Caption template: "{signEmoji} {SignName} — {date}\n\n{hookLine}\n\n{hashtags}\n\nFull reading: gettodayshoroscope.com/horoscope/{sign}"
- Hashtag rotation: base set (#astrology, #horoscope, #dailyphilosophy) + sign-specific (#scorpio, #scorpioseason) + rotating topical (#mercuryretrograde when applicable)
- Handle Ayrshare errors gracefully — log and continue

**Patterns to follow:**
- `src/utils/email.ts` for external API integration pattern (never throws, returns result object)

**Test scenarios:**
- Happy path: `postVideoToSocial()` calls Ayrshare API with correct body and returns success
- Happy path: caption includes sign name, date, hashtags, and site link
- Happy path: `scheduleDate` is passed through to Ayrshare when provided
- Error path: Ayrshare API failure returns `{ success: false, errors }` without throwing
- Edge case: missing AYRSHARE_API_KEY skips posting with warning

**Verification:**
- A test post appears on connected social platforms via Ayrshare

---

- [ ] **Unit 6: Complete Pipeline Script (Render + Post)**

**Goal:** Extend the render script to also post videos via Ayrshare with staggered scheduling.

**Requirements:** R26, R27, R29

**Dependencies:** Units 4, 5

**Files:**
- Modify: `scripts/render-and-post.ts` — add posting step after all renders complete

**Approach:**
- After rendering all 12 videos, schedule posts via Ayrshare:
  - Order by engagement priority: Scorpio, Leo, Virgo, Gemini first
  - Stagger: 4 time slots (7am, 11am, 3pm, 7pm ET)
  - During ramp-up (first 2 weeks): only post top 3-4 signs per day
  - After ramp-up: post all 12, distributed across 4 time slots
- Add `--no-post` flag to render without posting (for testing renders)
- Add `--ramp N` flag to control how many signs to post (default: 4)
- Log posting results per sign per platform

**Patterns to follow:**
- `scripts/backfill-archive.ts` for CLI flag pattern

**Test scenarios:**
- Happy path: script renders 12 videos then posts top N signs with staggered schedules
- Happy path: `--no-post` renders all videos but skips Ayrshare posting
- Happy path: `--ramp 4` posts only the top 4 engagement signs
- Integration: Ayrshare scheduling creates posts at the correct staggered times

**Verification:**
- Full pipeline run renders 12 videos and queues posts for the next day's time slots

---

### Phase 3: Automation

- [ ] **Unit 7: GitHub Actions Daily Cron**

**Goal:** Automate the full pipeline to run daily at 1am UTC via GitHub Actions.

**Requirements:** R22

**Dependencies:** Unit 6

**Files:**
- Create: `.github/workflows/render-videos.yml`

**Approach:**
- Cron schedule: `0 1 * * *` (1am UTC, after the horoscope generation cron at midnight)
- Steps: checkout → setup Node 22 → install deps → install Chrome for Remotion → run `npx tsx scripts/render-and-post.ts`
- Environment secrets: `OPENAI_API_KEY`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `BLOB_READ_WRITE_TOKEN`, `AYRSHARE_API_KEY`
- Timeout: 60 minutes (12 videos x ~5 min each = ~60 min)
- Use `npx remotion ensure-chrome` to install headless Chrome in CI

**Patterns to follow:**
- `.github/workflows/deploy.yml` for existing CI structure

**Test scenarios:**
- Test expectation: none — CI workflow verified by manual trigger (`workflow_dispatch`)

**Verification:**
- Manual `workflow_dispatch` trigger renders and posts at least one video successfully

## System-Wide Impact

- **Cron interaction:** Video pipeline runs AFTER the horoscope generation cron (midnight UTC). Depends on readings being cached in Redis before video rendering starts
- **Storage:** ~102MB/day in Vercel Blob (12 x 8.5MB). 1GB Hobby limit = ~10 days before rotation needed. Implement cleanup in the script (delete blobs older than 7 days)
- **API costs:** OpenAI TTS ~$0.22/day (12 videos x $0.018). Ayrshare plan cost TBD. Total: ~$7/month for TTS
- **Unchanged:** Homepage, sign pages, archive pages, email delivery, API endpoints, generation pipeline

## Risks & Dependencies

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| GitHub Actions Chrome setup fails | Medium | High | Use `npx remotion ensure-chrome` or `setup-chrome` action. Test in CI early |
| Render time exceeds 60min for 12 videos | Low | Medium | Serial rendering ~5min each = 60min. If too slow, parallelize with matrix strategy |
| Ayrshare rate limits or credit exhaustion | Medium | Medium | Start with 4 posts/day. Monitor credit consumption |
| Vercel Blob 1GB limit fills in 10 days | High | Low | Add cleanup step to delete blobs older than 7 days |
| Social accounts get flagged for automated posting | Low | High | Ramp slowly (3-4/day for 2 weeks). Ayrshare handles platform compliance |

## Operational / Rollout Notes

- **Before first run:** Create Ayrshare account, connect Instagram Business + TikTok + Facebook Page + X accounts. Add `AYRSHARE_API_KEY` to GitHub Actions secrets
- **Before first run:** Download ambient music track from Pixabay, add to `public/audio/ambient-lofi.mp3`
- **Before first run:** Add `BLOB_READ_WRITE_TOKEN` to GitHub Actions secrets (from Vercel Blob dashboard)
- **Monitoring:** Check Ayrshare dashboard for post delivery status. Check GitHub Actions run logs for render errors
- **Ramp schedule:** Week 1-2: 4 videos/day (Scorpio, Leo, Virgo, Gemini). Week 3+: all 12

## Sources & References

- **Origin document:** [docs/brainstorms/2026-04-08-video-content-engine-requirements.md](docs/brainstorms/2026-04-08-video-content-engine-requirements.md)
- Existing composition: `remotion/HoroscopeVideo.tsx`
- Test render: `horoscope-test-scorpio-v2.mp4` (8.5MB, 60s, proven working)
- Remotion renderer: https://www.remotion.dev/docs/renderer/render-media
- OpenAI TTS: https://developers.openai.com/api/docs/guides/text-to-speech
- Ayrshare API: https://www.ayrshare.com/docs/apis/post/post
- Vercel Blob: https://vercel.com/docs/vercel-blob/server-upload
