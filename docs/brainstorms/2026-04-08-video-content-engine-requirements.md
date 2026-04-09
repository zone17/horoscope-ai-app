---
date: 2026-04-08
topic: video-content-engine
---

# Automated Video Content Engine

## Problem Frame

The site has near-zero organic traffic after 1 week live. The product is strong but has no distribution channel. Daily horoscope readings are generated, cached, and cataloged — but nobody sees them. Short-form video is the #1 discovery mechanism for astrology content (Astroscope: 70M views/month on text slideshows alone). The content already exists; it needs to become video and reach audiences where they are — TikTok, Instagram Reels, Facebook Reels, and X.

## Requirements

**Video Rendering**
- R1. Remotion renders 60-second 9:16 (1080x1920) videos from daily horoscope data
- R2. Each video uses the sign's existing zodiac background `.mp4` as a looping backdrop
- R3. Text reveals word-by-word at 2.5 words/second with the sign's element accent color
- R4. AI voiceover narrates the reading (faceless format — no talking head)
- R5. Ambient lo-fi instrumental plays underneath (no vocals, beat-synced fade in/out)
- R6. Philosopher quote appears with attribution and source citation
- R7. Low-opacity CSS-based particle overlay (slow directional drift, 15-20% opacity)
- R8. Fonts: Playfair Display for sign names/hooks, Satoshi for body text (self-hosted .woff2)
- R9. Output: H.264 MP4, yuv420p pixel format, CRF 23, AAC audio

**Video Structure (60 seconds)**
- R10. [0-2s] Sign symbol pulses in + bold hook text targeting the sign ("Aries — stop scrolling")
- R11. [2-5s] "Guided by [Philosopher]" + date
- R12. [5-35s] Reading text reveals word-by-word (~75 words at 2.5 wps)
- R13. [35-45s] Philosopher quote fades in with attribution
- R14. [45-55s] Peaceful thought (evening reflection)
- R15. [55-58s] CTA: "Follow for your sign's daily reading"
- R16. [58-60s] Watermark: gettodayshoroscope.com + "Tomorrow at 6am"

**Video Types**
- R17. 12 individual sign videos per day (one per sign)
- R18. 1 all-12-signs compilation video per day (slideshow format — 5 seconds per sign, ~60s total, top-engagement signs first: Scorpio, Leo, Virgo, Gemini)
- R19. Total: 13 videos rendered daily

**Rendering Infrastructure**
- R20. Remotion renders on Vercel Sandbox (no AWS Lambda dependency)
- R21. Rendered videos stored in Vercel Blob before posting
- R22. Rendering triggered by a daily cron after horoscope generation completes
- R23. All 13 videos render in parallel (Vercel Sandbox supports 10 concurrent on Hobby, queue the rest)

**Social Posting**
- R24. Post to all 4 platforms: Instagram Reels, TikTok, Facebook Reels, X
- R25. Use Ayrshare unified API for multi-platform posting (single API call, their apps already reviewed — skips Meta 2-4 week review and TikTok 5-10 day audit)
- R26. Start with 3-4 videos/day, ramp to 12+/day over 2-3 weeks (avoid spam signals on new accounts)
- R27. Posting schedule: stagger throughout the day (7am, 11am, 3pm, 7pm) — morning captures the horoscope check habit
- R28. Each post includes: sign-specific caption, 3-5 hashtags (1 broad #astrology, 1-2 sign-specific, 1 branded #dailyphilosophy), CTA in caption
- R29. Lead with high-engagement signs first in the ramp-up: Scorpio, Leo, Virgo, Gemini

**Voice & Tone (applied via generation prompt, already shipped in Sprint 3)**
- R30. Open heart, open mind, believes in the best in humanity
- R31. No hollow affirmations, no life-coach tone, no preachy rhetoric
- R32. Hook: identity-targeting ("If you're a [sign], stop scrolling") or prediction/warning ("This week changes everything for [sign]")
- R33. Save-optimized: awe + utility + incompleteness ("Part 2 drops tomorrow")

**AI Voiceover**
- R34. Text-to-speech for each video narrating the reading text + quote
- R35. Warm, grounded voice — not robotic, not overly dramatic
- R36. Evaluate: ElevenLabs, OpenAI TTS, or Vercel AI SDK speech generation
- R37. Voice consistent across all 12 signs (same narrator, different content)

## Success Criteria

- First video renders correctly at 1080x1920, 60s, with background, text, voiceover, and music
- Videos post successfully to at least Instagram + TikTok via Ayrshare
- First 1,000 views within 7 days of posting
- Positive engagement ratio (likes + saves > 3% of views)
- Pipeline runs autonomously daily with zero human intervention after initial setup

## Scope Boundaries

- NOT building AI-generated footage (Seedance/Kling) — text-on-screen with zodiac backgrounds for v1
- NOT building a video editing UI — fully automated pipeline
- NOT building custom social API integrations — using Ayrshare unified API
- NOT changing the horoscope generation pipeline — videos consume existing cached readings
- NOT building video analytics dashboard — use platform native analytics initially
- Voiceover provider decision deferred to implementation (test ElevenLabs vs OpenAI TTS vs alternatives)

## Key Decisions

- **60 seconds, not 30**: TikTok 2026 algorithm weights total watch time. 60s at 75% completion > 30s at 95%
- **Voiceover + text, not text-only**: 24% higher engagement with voiceover. Faceless format scales to 12 signs/day
- **All-12-signs compilation video**: Astroscope's proven format (70M views/month). Every viewer has a sign = 12x audience
- **Ayrshare over direct API integration**: Skips weeks of Meta/TikTok app review. One API call for all 4 platforms. $149/mo
- **Ramp posting cadence**: 3-4/day → 12+/day over 2-3 weeks. New accounts posting 12/day immediately get flagged
- **Vercel Sandbox over Lambda**: Same platform as the app, simpler infra, 45min timeout on Hobby is plenty for video rendering
- **Lead with Scorpio/Leo/Virgo/Gemini**: Research shows these signs drive the most engagement and comments

## Dependencies / Assumptions

- Ayrshare account with connected Instagram Business, TikTok, Facebook Page, and X accounts
- Vercel Blob storage enabled (for rendered video files)
- AI voiceover API key (provider TBD during implementation)
- Royalty-free ambient lo-fi music track (one track, looped across all videos)
- Instagram must be a Business account (not Creator or Personal) for API publishing
- Remotion license (free for individuals, $100/mo for teams of 4+)

## Outstanding Questions

### Resolve Before Planning
- [Affects R34][User decision] Which AI voiceover provider? Need to test ElevenLabs vs OpenAI TTS quality and pricing before committing

### Deferred to Planning
- [Affects R5][Needs research] Best royalty-free ambient music source and licensing for commercial use on social platforms
- [Affects R23][Technical] Vercel Sandbox render time benchmarks for 60s video at 1080x1920 — may need Pro plan
- [Affects R26][Technical] Ayrshare rate limits and scheduling API specifics for staggered posting
- [Affects R18][Technical] Optimal transition between signs in the all-12 compilation video

## Next Steps

→ Test voiceover providers (ElevenLabs vs OpenAI TTS) with a sample reading, then proceed to `/ce:plan`
