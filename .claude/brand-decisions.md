# Today's Horoscope — Brand Decisions (Canonical)

> **Status**: Active — these decisions are final and override any conflicting guidance in other brand docs.
> **Last updated**: 2026-04-10
> **Decision makers**: Founder + primary development agent
> **Context**: Cross-referenced Co-Work brand-voice-guidelines.md against the actual shipped app, Philosophy Engine prompts, and engagement data.

---

## Architecture Principle: Agent-Native From Day One

Every brand and product decision must pass the agent-native litmus test: **"Can someone use this for something I never imagined?"**

- Atomic tools, composability, and emergent capability are baked into the architecture
- This is NOT a Phase 2 add-on — it's how we build from day one
- Social posting (Ayrshare), content generation (Philosophy Engine), and all future features follow this principle
- Brand assets must be programmatically usable (SVG components, not raster-only)

---

## Decision 1: Visual Aesthetic — Dark Cosmic Premium

**Decision**: Keep the dark indigo/purple/amber/glassmorphism palette. Do NOT shift to pastel/watercolor for the app UI.

**Data basis**:
- Every top-5 astrology app by downloads (Co-Star, The Pattern, Sanctuary, Chani) uses dark-dominant UI
- 82% of users prefer dark mode (Android Authority survey)
- Dark backgrounds drive ~24% more engagement on Instagram (Later.com, 18M posts)
- Dark/moody outperforms pastels in wellness/spirituality TikTok
- Dark interfaces correlate with perceived premium quality (Nielsen Norman Group)

**Specifics**:
- Background: `from-indigo-950 via-[#0f0b30] to-[#0c0921]`
- Accent: Amber/gold (`#fbbf24` family)
- Effects: Glassmorphism (backdrop-blur, semi-transparent borders)
- Typography: Playfair Display (display) + Satoshi (body)

**Where pastel/watercolor lives**: Logo, social profile images, OG graphics, story templates — NOT the app UI.

---

## Decision 2: Zodiac Icons — Constellation Dot-Line SVGs

**Decision**: Replace Unicode zodiac emoji (♈♉♊) with custom constellation dot-line SVG icons in the app UI.

**Rationale**:
- Unicode emoji render differently per platform (Apple emoji on iOS, Google on Android, etc.) — inconsistent brand
- Constellation dot-line icons (amber dots connected by thin lines) are distinctive, ownable, and reinforce the cosmic premium aesthetic
- SVG components are agent-native: programmatically renderable, scalable, themeable

**Implementation**:
- 12 inline React SVG components via `<ConstellationIcon sign="aries" />`
- Stars: amber/gold with glow effect, "bright" stars mark key constellation points
- Lines: 35% opacity amber, thin
- Touch points: `SignPicker.tsx`, `HoroscopeDisplay.tsx`, new icon component, constants update
- Social captions (`social-posting.ts`): Keep Unicode emoji — platforms render them natively in text

**Where stock emoji lives**: Ayrshare caption text only (♈ in "Your Aries reading is ready ♈"). Never in the app UI.

---

## Decision 3: Brand Identity — Philosophy Engine, Not Horoscope App

**Decision**: The brand identity centers on the Philosophy Engine differentiator, not generic "daily horoscope" positioning.

**What we are**:
- A Philosophy Engine that blends 50+ real philosophers with zodiac archetypes
- "Not predictions. Philosophy that meets you where you are." (actual tagline, HeroIntro.tsx)
- 12 distinct sign voices (Aries = bold coach, Scorpio = raw intensity, Pisces = dreamlike fluidity, etc.)
- Users build a personal "council" of thinkers — creating attachment and uniqueness

**What we are NOT**:
- A "cosmic oracle" or "ethereal guide"
- A generic horoscope app competing on warmth alone
- A fortune teller with mystical language

**Voice foundation** (from horoscope-prompts.ts):
- "Grounded optimism — not naive, not preachy, not performative"
- "Open heart, open mind, genuine belief in the best of humanity"
- "Speak like a real human being, not a horoscope generator"
- Forbidden language: "celestial, tapestry, embrace, navigate, Dear [sign]"

**Competitive positioning**: Category of one. No other app blends real philosophers with zodiac signs. We don't compete on "warmer than Co-Star" — we compete on "something Co-Star can't do."

---

## Decision 4: Brand Name

**Decision**: "Today's Horoscope" is the display brand. "gettodayshoroscope.com" is the domain/URL only.

**Usage**:
- Social profiles: "Today's Horoscope"
- App header: "Today's Horoscope"
- Meta/SEO: "Today's Horoscope — Daily Philosophical Guidance"
- Footer: "Get Today's Horoscope" (matches domain)

---

## Decision 5: Voice Is Not Singular — It's 12 Voices

**Decision**: Brand guidelines must account for 12 distinct sign personalities, not one uniform voice.

The Philosophy Engine generates content with sign-specific voices:
- **Aries**: Bold, direct coach. Short punchy sentences.
- **Taurus**: Wise friend on a porch at sunset. Sensory details.
- **Gemini**: Intellectual curiosity, playful wit, thought experiments.
- **Cancer**: Tender emotional intelligence, imagery of home/memory.
- **Leo**: Warmth, generosity, theatrical but grounded.
- **Virgo**: Precision, dry wit, finding meaning in the ordinary.
- **Libra**: Elegance, moral seriousness, balancing competing truths.
- **Scorpio**: Raw intensity, psychological depth, no sugarcoating.
- **Sagittarius**: Philosophical wanderlust, irreverent wisdom.
- **Capricorn**: Understated authority, hard-won wisdom, practical philosophy.
- **Aquarius**: Visionary systems thinker, unexpected analogies.
- **Pisces**: Dreamlike fluidity, synesthesia, blurred metaphor/reality.

Social content and brand copy operate with the shared foundation ("grounded optimism, open heart") but respect these sign-level voices when creating sign-specific content.

---

## Decision 6: Co-Work Brand Voice Guidelines — What to Keep vs. Override

**Keep from Co-Work's doc** (`brand-voice-guidelines.md`):
- "We Are / We Are Not" table (with adjustments below)
- Tone-by-Context Matrix structure (channel-specific tone flex)
- Emoji & Symbol Guide (sparkles/moon/sun only, 0-1 per post)
- Content examples format (on-brand vs. off-brand with rationale)

**Override**:
- "Ethereal Guide" archetype → replace with "Philosophy Engine" identity
- "Gently Mystical" voice → replace with "Grounded Optimism" per our prompts
- Watercolor pastel aesthetic references → dark cosmic premium per Decision 1
- Singular voice assumption → 12 sign voices per Decision 5
- Messaging ("Your daily cosmic guidance") → "Not predictions. Philosophy that meets you where you are."
- "Celestial" as preferred term → it's in our forbidden list in `horoscope-prompts.ts`
- Competitive positioning → category of one (philosophy + zodiac), not "warmer than Co-Star"

---

## Open Questions (Not Yet Decided)

1. **Target audience definition** — Co-Work flagged this correctly. Needs founder input on age range, gender split, astrology knowledge level.
2. **Photography/imagery style** — for social posts beyond the daily horoscope text. Golden hour? Crystal/natural? AI-generated?
3. **Posting cadence** — daily horoscopes (automated) + how many additional posts per week?

---

## File References

| What | Where |
|------|-------|
| Philosophy Engine prompts (voice source of truth) | `src/utils/horoscope-prompts.ts` |
| Philosopher roster | `src/constants/philosophers.ts` |
| Current sign picker (emoji-based) | `src/components/zodiac/SignPicker.tsx` |
| Horoscope display | `src/components/zodiac/HoroscopeDisplay.tsx` |
| Social posting / Ayrshare | `src/utils/social-posting.ts` |
| Tailwind theme (colors, fonts) | `tailwind.config.js` |
| App layout / meta | `src/app/layout.tsx` |
| Hero copy | `src/components/seo/HeroIntro.tsx` |
| Co-Work guidelines (reference, not canonical) | `.claude/brand-voice-guidelines.md` |
| Constellation icon mockup | `.claude/brand-constellation-mockup.html` |
