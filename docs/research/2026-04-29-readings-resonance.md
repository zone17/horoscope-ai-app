# Readings Resonance: Diagnosis and New Architecture

> **Date**: 2026-04-29 (synthesized); **Decisions locked**: 2026-05-01
> **Authoring context**: Operator reported "the readings don't resonate." A four-stream parallel research effort (live-readings diagnostic, competitive resonance, resonance theory, philosophical embodiment) produced the evidence base. This doc is the synthesis and the design specification for the rebuild.
> **Decisions locked**: see §3.1 (architecture) and §11 (implementation choices). All §11 items now resolved; rebuild is in execution.
> **Source artifacts** (preserved alongside this doc):
> - [`2026-04-29-diagnostic.md`](./2026-04-29-diagnostic.md)
> - [`2026-04-29-competitive.md`](./2026-04-29-competitive.md)
> - [`2026-04-29-resonance-theory.md`](./2026-04-29-resonance-theory.md)
> - [`2026-04-29-philosophical-embodiment.md`](./2026-04-29-philosophical-embodiment.md)
> - [`2026-04-29-live-readings-snapshot.md`](./2026-04-29-live-readings-snapshot.md)

---

## 1. Executive summary

**The readings don't resonate because they were architected to attribute philosophy, not to embody it.** The 12 sign profiles, 54 philosophers, and 9 traditions all collapse onto one default voice (a literary therapist with a kettle on the stove) because the prompt's "SOUL" block enforces a uniform tonal floor, the model only sees the philosopher's name and quotes (never their cognitive method), and the judge has no axis for whether the philosopher is felt in the prose.

**What the operator's reaction validates.** Pennycook et al. (2015) shows that vivid sensory imagery on empty claims rates as profound only to non-analytic readers and **signals fraud to reflective ones** (r ≈ 0.88 with actual Deepak Chopra tweets). The "doesn't resonate" reaction is the predicted analytic-reader response to high-craft Barnum content. This isn't a taste mismatch. It's the system being correctly diagnosed.

**The chosen architecture (Option C, deep council injection):**
1. **Reading**: anonymous voice, no philosopher attribution. Driven by sign × today's day-context × council-as-deep-worldview. Council inflects voice and content invisibly. The reader never sees "today guided by Marcus Aurelius."
2. **Quote**: separated into its own atomic verb. Rotates through the verified quote bank of the user's selected council members only. Attribution stays (`quote_philosopher`). Quote and reading do not cross-influence.
3. **Day context**: lunar phase, day-of-week, season, and meaningful date markers enter the prompt as shaping signal but are not directly referenced in the prose. The reader feels the reading fits this specific Wednesday without being told why.
4. **Council**: implementation detail, never user-visible. The prompt receives each council member's cognitive move, register, ending-must-not-be, and forbidden phrases. All distilled from the 9-tradition embodiment research.

**What this rebuild touches.**
- A new `reading:generate` prompt template (full spec in §5) that replaces the SOUL block with a per-council deep-injection block.
- A new atomic verb `quote:select` (§7) that runs independently of `reading:generate`.
- A new atomic verb `day:context` (§6) that computes the today-context block deterministically.
- A new judge rubric (§8) built around 12 testable resonance principles, with 9 forbidden phrases as automatic-fail filters.
- A registry rebuild (§9) that unbundles "Eastern Wisdom," reframes Walter Russell, fixes the Rumi-via-Barks issue, and adds missing Confucian voices.
- Frontend data-model change (§10): `philosopher` field on the reading is dropped; `quote_philosopher` is added on the quote.

**What this rebuild does not touch.**
- Sign profiles (`sign-profile.ts`) stay; they're still used as voice modulators, not the dominant register.
- Verified quote bank (`quote-bank.ts`) stays; it becomes the input to `quote:select` instead of being embedded in `reading:generate`.
- The cron architecture stays; the per-sign route just calls two atomic verbs instead of one.

---

## 2. Diagnosis: why current readings flatline

### 2.1 The convergence problem (live diagnostic, full doc at [`2026-04-29-diagnostic.md`](./2026-04-29-diagnostic.md))

Sign profiles in `src/tools/zodiac/sign-profile.ts` prescribe radically different voices. The actual readings collapse onto one. Three pairs that should sound nothing alike, sampled from today's production output:

> **Aries** (Einstein, "bold direct coach"): *"You keep stopping yourself right before the good part. Not hesitation exactly, more like a hand on a door handle that won't turn."*
>
> **Cancer** (Plato, "tender"): *"Something you've been carrying around the house with you, not unpacking it, just moving it from room to room."*

Both: gentle observation about avoidance, soft domestic prop, permission to act. Aries demands "short punchy sentences, fiercely believes in you." This does not punch. It coaxes.

Recurring image vocabulary across just 12 readings: kettle in 4, bruise in 2, "shoulder dropping" in 3, "Something you've been..." opener in 3, "Let X count as Y" closer in 6. Source: `generate.ts:141` literally lists *"a shoulder dropping, a kettle whistling, a key turning"* as the model's example pool. The prompt is teaching the trope.

### 2.2 The philosopher-as-postscript problem

Strip the byline and quote; the philosopher disappears. Aristotle's Virgo reading is permission-based productivity coaching ("you're allowed to hand something in while it's still 97% done"). Aristotle is virtue ethics, the doctrine of the mean, hexis. Marcus Aurelius's Capricorn reading describes "late autumn" in late April. The model picked an austere image generically rather than reaching for *Meditations*' actual moves.

Source: `generate.ts:99-108`. The philosopher enters the prompt only as a name and a quote-bank reference. The model is never asked to think in their register, vocabulary, concerns, or rhetorical moves.

### 2.3 The high-craft Barnum problem (resonance theory, full doc at [`2026-04-29-resonance-theory.md`](./2026-04-29-resonance-theory.md))

Concrete imagery is not falsifiable specificity. *"Something felt slightly off this morning, like a shoe tied one loop too tight"* applies to anyone, any morning. The current judge's `antiBarnum` axis flags vague universal statements but does not flag concrete-image-wrapped universals. Pennycook et al. (2015) is the load-bearing finding: vivid New Age phrasing on empty claims rates as profound only to non-analytic readers and tracks at r ≈ 0.88 with actual Chopra tweets. The high-craft Barnum mode is a known failure pattern.

The "concrete sensory imagery" heuristic the prompt enforces was a partial answer to a real problem (default LLM vagueness). It became a new problem when readers grew analytic.

### 2.4 The therapeutic-permission landing problem

Every reading's `peaceful_thought` field, and most message closers, lands on permission, gentleness, "it's enough." Aristotle does not give permission. Seneca commands. Nietzsche provokes. All collapsed into the same therapist saying "you've been working hard, it's okay to rest."

Hyman (1977) found cold readers converge on a 75% positive / 25% negative ratio. Current readings sit closer to 100/0. We're more sycophantic than cold reading itself. The "called me out" verb that users apply to Co-Star, Astro Poets, and Chani Nicholas describes the inverse: resonant content pushes back. Default LLM voice is sycophantic. The single largest prompt-engineering lever is forcing the model to confront, not affirm.

### 2.5 The temporal flatness problem (competitive, full doc at [`2026-04-29-competitive.md`](./2026-04-29-competitive.md))

None of the 12 readings reference spring, day-of-week, late April, lunar phase, or anything that would not be true on 2026-01-15. The Capricorn reading explicitly references "late autumn" in late April. `resolvedDate` is used only as a seed for format-rotation and quote-bank picks. The string never enters the prompt text.

Susan Miller dates everything ("on April 23, you may receive a surprise gift"). Chani references current transits. Yahoo doesn't. Generic AI doesn't. The mockery of generic horoscopes converges on temporal flatness specifically. **Rule from competitive research: if the reading would still make sense tomorrow, it's already failed.**

### 2.6 The council-as-decoration problem

Per `src/app/api/horoscope/route.ts:61`, the council is passed to `assignDaily()` as a candidate pool, then dropped. `generateReading()` only ever sees `{ sign, philosopher, date }`. A user with 5 philosophers in their council and a user with no council selected get the same prompt; the only difference is which philosopher's name gets attached. The "blend across council" promise from the original PRD is unimplemented.

Confirmed empirically: passing `?philosophers=marcus_aurelius,pema_chodron,naval_ravikant,thich_nhat_hanh,seneca` to the production API changes only the rotation winner, not the prose.

### 2.7 The judge-blindspot problem

The critique loop (`generate-with-critique.ts:90-93`) regenerates only on `overall ≤ 3 || antiBarnum ≤ 3 || voiceAuthenticity ≤ 3`. The judge has no axis for philosopher fingerprint, today-ness, push-back-vs-affirm, or behavioral specificity. The loop optimizes readings toward the local maximum the operator is rejecting: gentle, sensory, anti-Barnum-by-imagery, voice-authentic-by-house-style. **The critique loop is currently making the readings *more* unresonant**, not less, because the judge's rubric is the wrong rubric.

---

## 3. The chosen architecture

### 3.1 Decisions locked in this doc

1. The reading has no philosopher attribution. Anonymous house voice.
2. The reading is shaped by sign profile × today's day-context × council-as-deep-worldview, in that order of precedence.
3. The day-context shapes the reading invisibly. No "as the moon waxes" lines.
4. The council is a deep personalization vector. The prompt receives each member's cognitive move, register, ending-must-not-be, and forbidden phrases. Not just names.
5. The quote is a separate UI element with its own atomic verb. Rotates through council members. Stays attributed (`quote_philosopher`).
6. The reading and quote do not cross-influence.
7. No em-dashes, no en-dashes, no hyphens-as-dashes anywhere in the readings or in the prose around them. Hyphens inside compound words (self-inquiry, well-being, day-of-week) are fine.

### 3.2 Why deep injection beat light injection (demo evidence)

Same Aries, same day, same craft rules. Two councils tested:
- **Council A** (Marcus, Pema, Naval, Thich, Seneca): Stoic / Buddhist / modern operator stack.
- **Council B** (Sartre, Cioran, Krishnamurti, Nietzsche, de Beauvoir): existentialist / critical stack.

Light injection (council names only) produced indistinguishable readings across A and B. Council B-light contained the line *"You don't have to perform certainty you don't own yet,"* which is therapy-permission, exactly what Sartre and Cioran would reject as bad faith. The model fell back to a default warm-confrontational register because it could not infer the difference between the councils from names alone.

Deep injection (cognitive moves per council member) produced genuinely different readings. A-deep was tighter and more practical: *"check whether you chose it or just reached for it because it was closest."* B-deep refused to console: *"That's not a flaw; it's just what you do. The crescent doesn't care how fast you ran at the dark."* The differentiation was visible.

Side benefit: deep readings were also tighter prose. The deep brief disciplines voice in addition to worldview.

Demo run preserved at `scripts/demo-light-vs-deep.ts`.

---

## 4. Voice persona for the anonymous house voice

The competitive research finding that **voice ownership is non-negotiable** matters here. Every named writer who builds a parasocial bond (Chani, Susan Miller, Co-Star, Astro Poets) is detectable from one paragraph. With no philosopher attribution, our reading needs an authorial voice the reader recognizes after 10 readings.

**Specification of the house voice:**
- Confident, not soft. Pushes back at least once per reading. Does not affirm by default.
- Plain. No flowery adjectives, no inverted syntax for effect, no "X is the Y of Z" formulations.
- Specific. One concrete behavioral specifier per reading. The behavior is something the reader plausibly did in the past 24 to 48 hours, not a sensory image of an object.
- Unsentimental. Stages a scene, does not narrate emotion. Trusts the reader to feel what the scene implies.
- Honest about stakes. Names the failure mode rather than smoothing it.
- Council-inflected. The reading sounds like the kind of advice that would land for someone whose worldview includes these five thinkers.
- Time-aware. The prose carries the texture of *this* day without naming why.
- Risks being wrong. The lines that resonate are the ones that could have missed.

**What the house voice is not:** Co-Star (too AI-cool, too short for our format), Astro Poets (too third-person-cameo for an actual reading), Susan Miller (too long, requires astrological transit knowledge we don't yet model). Closest analog is Chani Nicholas mid-format: name an internal contradiction, locate agency inside it, end on a frame or an act.

The house voice gets a working name to enforce internal consistency: **"Wednesday."** Useful only for prompt-engineering reference; never user-facing.

---

## 5. New `reading:generate` prompt template

What follows is the spec, not the literal string. The implementation will compose this from atomic blocks (sign profile, day context, council brief, craft rules) so each block can evolve independently.

### 5.1 Prompt block order (this order matters)

1. **Task statement.** "Write a daily reading for a person whose sun sign is X."
2. **Today's context.** Date, day-of-week, lunar phase (with energetic gloss), season, any markers (new moon, full moon, equinox, last day of month, cross-quarter day). Marked "use to shape; do not name directly."
3. **Sign voice block.** From the existing sign-profile registry, but reframed as voice modulator, not dominant register.
4. **Reader's worldview (deep council brief).** For each of the user's selected council members: cognitive move, register, ending-must-not-be, forbidden phrases. Plus a synthesized "what this council shares" line.
5. **Craft rules.** The 12 testable resonance principles, distilled into prompt-shape directives.
6. **Forbidden phrases.** The 9 anti-tells from the embodiment research, plus the dash bans.
7. **Format and length.** See §5.4.
8. **Output.** Just the reading. No preamble, no headings, no explanation.

### 5.2 The deep council brief (per member)

Built from the embodiment research (§1 of [`2026-04-29-philosophical-embodiment.md`](./2026-04-29-philosophical-embodiment.md)). Example for Marcus Aurelius:

```
* Marcus Aurelius. Move: dichotomy of control + premeditatio malorum + small present action.
   Register: plain, often imperative, short clauses, no adornment.
   Ends on: a deed. Never on: a feeling, a permission, a sentiment.
   Will not say: "you're allowed to," "let X count as Y," "honor the rest."
```

Example for Pema Chödrön:

```
* Pema Chödrön. Move: stay with the sharp edge; tonglen (breathe in suffering, breathe out relief, universalize).
   Register: tender but specific; bodily; never euphemistic.
   Ends on: universalized compassion. Never on: a task, a fix, soothing-as-evasion.
   Will not say: "trust the process," "hold space for," "the universe is."
```

Each council brief is approximately 4 lines. With 5 council members, this block is approximately 20 to 25 lines. Token budget is comfortable on Sonnet 4.6.

The **synthesized "what this council shares" line** is the single most important shaping signal. Examples:
- Stoic / Buddhist / modern-operator council: "Pushes toward the present, the proportionate, the practiced. Rejects hustle, drift, and decoration. The reader wants advice that holds up at 3am."
- Existentialist / critical council: "Refuses comfort, refuses received wisdom, demands authenticity at the cost of ease. The reader wants the question that won't let them sleep, not the answer that helps them sleep."
- Vedantic / Taoist / contemplative: "Returns repeatedly to the witness, the underlying field, the unforced. Rejects striving, identification with thought, and the metaphysics of self-help."

The shared-line must be deduced per council. Phase 4 of implementation builds the deduction logic; Phase 1 will use a static map for the most-common council shapes.

### 5.3 Craft rules block (the 12 principles in prompt form)

Translated from §7 of [`2026-04-29-resonance-theory.md`](./2026-04-29-resonance-theory.md):

1. Push back on the reader at least once. Affirmation alone reads as flattery; flattery does not resonate.
2. Stage a scene the reader can recognize themselves inside. Do not predict.
3. Include one concrete behavioral specifier (something they likely did in the past 24 to 48 hours). Not a sensory image of an object.
4. Engineer at least one tonal pivot. Confront then ground; name then invert; sting then bless. A flat tone flatlines.
5. End on an act, an imperative, or a real question. Never on permission, gentleness, or "it's enough."
6. Make at least one falsifiable claim. If every line could not possibly be wrong, the reading is Barnum.
7. No "at times / other times" hedging. No "you may find yourself."
8. Strip every adjective and abstract noun. The line must still say something.
9. Buzzword cap: no more than one of {energy, alignment, abundance, capacity, holding, honoring, unfolding, resonance, flow, journey} per 100 words.
10. At least one sentence should be wall-test sharp. A line a reader could write down and keep.
11. The reading must read like *this* product. Voice is recognizable across days.
12. Anonymous voice. No author signature, no philosopher attribution. The reader is not told whose thinking shaped this.

### 5.4 Format and length

**Two readings per day, locked.** The dead-zone finding from competitive research was about *generic* horoscopes; deep-injected prose escapes it by being denser. The demo readings landed naturally at ~100 words and they had punch. We commit to bimodal length coverage by surface:

- **`morning_reading`** (rendered for the morning surface, video at ~1:00 UTC): **80 to 150 words.** Mid-dense. Names a mechanism, stages a scene, engineers a tonal pivot, ends sharply on an act or a real question. Closest analog: Chani Nicholas mid-format.
- **`evening_reading`** (rendered for the evening surface, video at ~22:00 UTC): **30 to 50 words.** Short and pointed. Today's reckoning, the question that lands at sundown. Closest analog: Astro Poets weekly line, but staged for evening psychology.

Both follow the same craft rules and the same deep council injection. They differ only in `time_of_day: 'morning' | 'evening'` framing and day-context flavor (morning context emphasizes the day in front of you; evening emphasizes the day you actually had).

The `peaceful_thought` field was misnamed because it telegraphed the wrong design intent (presupposing a soothing close). It is **renamed to `evening_reading`** and rewritten under the new craft rules: never lands on permission, never softens, lands on a sharp question or hard observation.

### 5.5 The dash ban

No em-dashes (—). No en-dashes (–). No hyphens used as dashes ( - ). Hyphens inside compound words are fine (self-inquiry, well-being, day-of-week, 3am).

This is enforced by:
1. A prompt rule explicitly listing the banned characters.
2. A post-generation regex check that strips or fails the reading if any of the three appear outside known-compound contexts.
3. A judge axis that auto-fails any reading containing them.

The current prompt at `generate.ts:136` already bans em-dashes ("Em-dashes used as parenthetical asides, replace with periods or commas"), but the model ignores it. Belt-and-suspenders enforcement is required.

---

## 6. Day-context module (`day:context` atomic verb)

A new tool at `src/tools/calendar/day-context.ts`. Pure function, no API calls. Computes:

```
Input:  { date: 'YYYY-MM-DD', hemisphere?: 'north' | 'south' }
Output: {
  dateText: 'Wednesday, April 29, 2026',
  dayOfWeek: 'Wednesday',
  dayOfWeekFlavor: 'mid-week, the hump',
  lunarPhase: 'waxing crescent',
  lunarDayCount: 3,                 // days since new moon
  lunarFlavor: 'seeds being planted, early commitment, fragile beginnings',
  season: 'late spring',
  seasonFlavor: 'warming, not yet summer',
  markers: []                       // 'new moon', 'full moon', 'equinox', 'last day of month', etc.
}
```

Lunar phase is computed deterministically from the date (no API). Season is computed from date plus hemisphere. Markers are detected via simple date arithmetic.

The flavor strings are short, energetic, non-mystical glosses. They go into the prompt's "today's context" block. They never appear in the reading prose.

### 6.1 The Phase 2 PRD overlap

The original PRD's Phase 2 (`astronomy:moon-phase`, `calendar:seasonal-marker`, `astronomy:moon-sign`) was scoped as separate verbs feeding the prompt. This rebuild collapses moon-phase and seasonal-marker into one `day:context` verb, which is sufficient for the invisible-shaping use case. `astronomy:moon-sign` (the reader's natal moon position) is deferred; it requires birth-time data the product doesn't yet collect.

---

## 7. Quote system (`quote:select` atomic verb)

A new tool at `src/tools/reading/quote-select.ts`. Replaces the quote-generation logic currently embedded in `reading:generate`.

```
Input:  { council: string[], date: 'YYYY-MM-DD', sign: string }
Output: { text: string, author: string }
```

Logic:
1. Pick today's quote-philosopher: deterministic rotation over the council, seeded by `(dayNum + signIndex) % council.length`.
2. Pull a verified quote from that philosopher's bank, deterministic by date so the same (philosopher, date) returns the same quote.
3. Return text and author.

The selection runs independently of `reading:generate`. The reading does not reference the quote and the quote does not reference the reading. They share only the council selection signal.

API change: the `/api/horoscope` route calls both verbs and returns both shapes. Frontend renders them as two separate UI elements.

---

## 8. New judge rubric

Replaces `judge.ts:139-228`. Built from the 12 testable principles plus the 9 forbidden-phrase auto-fails plus the dash auto-fail.

### 8.1 Auto-fail filters (regex / simple string match)

A reading auto-fails (no scoring needed; regenerate immediately) if it contains:

1. Em-dash (—), en-dash (–), or hyphen-as-dash ( - between words).
2. Any of the 9 anti-tells from the embodiment research:
   - "Let X count as Y"
   - "you're allowed to" / "you are allowed to" / "permission to"
   - "dear one" / "sweet soul" / "gentle one"
   - "hold space for"
   - "honor the [rest|pause|not-knowing|...]"
   - "you are exactly where you need to be"
   - "the universe [is|wants|conspires]"
   - "trust the process"
   - "both [X] and [Y]" as resolution
3. Buzzword density over cap (more than one of the 10-word buzzword set per 100 words).
4. Word count outside target range (250 to 400 for daily long-form).

### 8.2 Scored axes (replaces the current 5 axes)

The model-graded axes that survive a critique loop:

1. **Behavioral specificity** (1 to 5). Does the reading name a specific behavior the reader plausibly performed in the past 24 to 48 hours, or is it an abstract emotional claim?
2. **Falsifiability** (1 to 5). Does at least one line make a claim that could be wrong for a specific reader?
3. **Push-back vs affirm** (1 to 5). Does the reading confront the reader at least once, or does it only affirm?
4. **Tonal pivot** (1 to 5). Does the reading travel through more than one register?
5. **Today-ness** (1 to 5). Would this reading still make sense if shifted to a different day, or is it shaped by today specifically?
6. **Council fingerprint** (1 to 5). Could a reader who knows the council's traditions recognize the inflection in the prose, or does the reading sound councils-blind?
7. **Wall-test** (1 to 5). At least one sentence sharp enough to write down, or just generally pleasant prose?
8. **Voice signature** (1 to 5). Does it sound like *this product*, or like a default LLM voice?

The critique loop regenerates if any axis is at or below 3, or if overall (mean) is at or below 3.5.

### 8.3 What the new judge does NOT measure

- Quote fidelity. Moved to the `quote:select` verb's own validation; not the reading's concern.
- Philosopher authenticity. The reading has no philosopher; this axis is meaningless under the new model.
- The current `voiceAuthenticity` (sign-voice-only). Replaced by Voice signature plus Council fingerprint, which are stricter.

---

## 9. Registry and taxonomy fixes

From §1 of [`2026-04-29-philosophical-embodiment.md`](./2026-04-29-philosophical-embodiment.md). These can be staged after the prompt rebuild ships, but they're load-bearing for the deep-injection brief to be honest.

1. **Unbundle "Eastern Wisdom."** Lao Tzu (Taoist), Pema Chödrön (Tibetan Buddhist), Thich Nhat Hanh (Vietnamese Zen), Suzuki (Rinzai Zen), Confucius (Confucian), Rumi (Sufi), Krishnamurti (anti-method), and Watts (popularizer) have fundamentally different cognitive moves. They need separate tradition tags so the council brief can describe each accurately.
2. **Reframe Walter Russell.** Not a scientist. Real contribution is the aesthetic of paired opposites in rhythmic interchange. Use as image-source, not physics authority. The current "polymath" framing oversells.
3. **Mark contested attributions.** The "frequency, energy, vibration" Tesla quote is contested. Either remove or label as contested. Coleman Barks's de-Islamized Rumi is the source for most "Rumi" quotes in circulation; a Rumi inflection in the council brief must preserve the longing-toward-the-Beloved or it's Barks, not Rumi.
4. **Distinguish real Advaita from pop-Vedanta.** Tolle / Mooji / Ram Dass / Yogananda are genuine self-inquiry lineage (with the bypass risk noted). Dispenza / Chopra / Dyer are New Thought wearing Sanskrit. The council brief should describe them differently and the registry's tradition tagging should reflect that.
5. **Add Mencius and Wang Yangming.** A real Confucian gap. Mencius brings the four sprouts and the cultivation of innate moral feeling; Wang Yangming brings the unity of knowing and acting.
6. **Per-philosopher fields the registry needs to add.** For deep injection to work, each philosopher entry needs: cognitive move (one line), register (one line), ending-must-not-be (one line), forbidden phrases (3 to 5 strings). This is roughly 50 lines of structured content per philosopher. With 54 philosophers (after registry cleanup, probably more like 60), this is a focused content task, ~3 to 5 days of work.

---

## 10. Frontend data-model change

Current API shape:
```json
{
  "sign": "aries",
  "date": "2026-04-29",
  "philosopher": "Albert Einstein",
  "message": "...",
  "best_match": "leo, sagittarius, gemini, aquarius",
  "inspirational_quote": "...",
  "quote_author": "Albert Einstein",
  "peaceful_thought": "..."
}
```

New API shape:
```json
{
  "sign": "aries",
  "date": "2026-04-29",
  "morning_reading": "...",
  "evening_reading": "...",
  "best_match": "leo, sagittarius, gemini, aquarius",
  "quote": {
    "text": "...",
    "quote_philosopher": "Marcus Aurelius"
  }
}
```

Changes:
- Top-level `philosopher` field removed. The reading has no attribution.
- `message` renamed to `morning_reading` (unambiguous; pairs with `evening_reading`).
- `peaceful_thought` renamed to `evening_reading`. Function preserved as a separate evening surface, but voice is rewritten under the new craft rules; never lands on permission.
- `inspirational_quote` and `quote_author` collapsed into a `quote` object with `text` and `quote_philosopher` (the quote keeps attribution; the readings do not).
- `best_match` unchanged (still sign-only).

Frontend changes:
- The "Today guided by Marcus Aurelius" UI element on the reading card is removed.
- The morning and evening readings render as two separate, equally-weighted surfaces (no longer a "peaceful_thought" demoted card).
- The quote card stays. The quote attribution stays under the renamed field.
- The OG share image regenerates against the new shape.

The video pipeline:
- Morning video reads `morning_reading`. No philosopher attribution to update.
- Quote video reads `quote.text` + `quote.quote_philosopher`. Attribution stays.
- Night video reads `evening_reading`. The render script's mapping updates from `peaceful_thought` to `evening_reading` in the lockstep deploy.

---

## 11. Decisions locked (2026-05-01)

All seven items from the original "open items" section have been resolved. The rebuild is in execution.

1. **Length: bimodal by surface.** Morning reading: 80 to 150 words (mid-dense). Evening reading: 30 to 50 words (short and pointed). Both follow the new craft rules.

2. **Two readings per day, both in the new house voice.** The `peaceful_thought` field is preserved as a surface but renamed to `evening_reading` and rewritten under the new craft rules. It never lands on permission, never softens; it lands on a sharp question or hard observation. The night video pipeline renders the new `evening_reading`.

3. **Voice persona: Witness.** Internal name only, never user-facing. The prompt instruction is *"Witness writes this reading. Witness names what is true and offers the reader their agency. Witness does not console, does not soften, does not pretend to know what they cannot know. Witness sees the day and stages a scene the reader can recognize themselves inside."* Chosen for the resonance with Chani Nicholas's "being witnessed is essential to our humanity" finding from the competitive research.

4. **Council shape: dynamic synthesis with daily TTL cache.** No static archetype table. The `council:synthesize-shape` atomic verb makes one Haiku call per (council-composition, date) tuple, cached in Redis with 25 hour TTL. The cache organically grows into the council-shape table we would otherwise hand-write.

5. **Registry rebuild: subset-then-expand.** Phase 1 ships with deep briefs for 15 priority philosophers (Marcus Aurelius, Seneca, Epictetus, Aristotle, Plato, Pema Chödrön, Thich Nhat Hanh, Lao Tzu, Confucius, Krishnamurti, Naval Ravikant, Eckhart Tolle, Camus, Frankl, Mary Oliver). Other philosophers fall back to a generic-by-tradition brief. Registry expansion fills in over Phases 2 to 4. Tradition unbundling (Eastern Wisdom split into Taoist / Buddhist / Confucian / Sufi tags) ships with the deep-brief writing.

6. **Eval: skip the gate, ship to cron with auto-fail filters and clean rollback.** No formal eval baseline before promotion. Auto-fail filters (em-dash / en-dash / hyphen-as-dash regex; the 9 anti-tells; buzzword density cap; length range) run before any reading is cached, so the worst-case readings never reach a user. The new prompt lives behind a parameterized version flag; rollback is a single config flip if anything goes sideways.

7. **Frontend: lockstep single PR.** New prompt + new atomic verbs + new API shape + frontend update + video pipeline update all ship together. Single deploy, single moment of truth. No feature-flag dual-shape, no v2 API path.

---

## 12. Implementation phases

Sequenced for fastest validation:

### Phase 0 (this week)
- Operator reviews this doc, answers §11 open items.
- Lock the prompt template spec from §5 as code-ready.
- Write the deep-injection briefs for the 10 to 15 most-commonly-selected philosophers (Marcus, Seneca, Epictetus, Pema, Thich, Naval, Tolle, Aristotle, Camus, Marcus, Frankl, Mary Oliver, Confucius, Lao Tzu, Krishnamurti). Cover the 80% case for live councils.

### Phase 1: Prompt v2 (3 to 4 days)
- Implement `day:context` atomic verb (§6).
- Implement `quote:select` atomic verb (§7).
- Rewrite `reading:generate` against the new prompt template (§5).
- Write new judge axes (§8) and the auto-fail filter.
- Run head-to-head eval against current prompt on 144-cell baseline.
- Hand-eval 50 readings against the 12 principles.
- Iterate on prompt until ≥ 4.0 across the 8 scored axes.

### Phase 2: API and frontend cutover (2 to 3 days)
- Update `/api/horoscope` route to call both verbs and return new shape.
- Update frontend reading card (drop philosopher line, drop peaceful-thought card, restructure quote card).
- Update OG share images.
- Decide and implement night video strategy per §11.2.

### Phase 3: Cron rewiring (1 day)
- Per-sign cron now calls two atomic verbs instead of one.
- Cache key updated for new shape.
- Verify daily run on staging.

### Phase 4: Registry cleanup (3 to 5 days, can parallelize with Phase 1 to 3)
- Unbundle Eastern Wisdom into 4 tradition tags.
- Add per-philosopher cognitive-move fields (§5.2) to the 54 entries.
- Reframe Walter Russell, mark contested attributions, fix Rumi-Barks, distinguish Advaita from pop-Vedanta.
- Add Mencius and Wang Yangming.

### Phase 5 (deferred): serial continuity, self-disclosure, dynamic council deduction
- P10 from §8: today's reading references yesterday's. Requires a small recent-readings-per-user store.
- P9: narrator self-disclosure 1×/week. Requires a separate "weekly self-disclosure" reading slot.
- Dynamic council-shape deduction (§11.4).

Total to ship Phase 1 to 3: approximately 6 to 8 days from spec lock. Phase 4 adds 3 to 5 in parallel. Phase 5 is post-launch.

---

## 13. Risks

1. **Prompt token budget.** The deep council brief plus today's context plus craft rules plus forbidden phrases is roughly 1,500 to 2,000 prompt tokens. Sonnet 4.6's context is more than enough; cost per reading rises by ~30%. Acceptable.

2. **Voice consistency at scale.** The house voice is described in this doc but not yet trained-into. Real consistency emerges through eval iteration plus the judge's voice-signature axis. Risk that early readings vary in voice until the prompt converges. Mitigation: 50-reading hand-eval before cutover.

3. **Council edge cases.** A user with 1 council member has nothing to inflect against. A user with no council selected (anonymous browse) needs a default. Spec: 1-member council uses the deep brief for that one philosopher plus a generic "broadly contemplative" shared-line; 0-member council uses a default 3-philosopher composite (Marcus, Pema, Naval) tuned for the median reader. Worth A/B testing.

4. **The judge's circularity.** The new judge axes are LLM-graded. Risk: the judge agrees with itself even when the operator disagrees. Mitigation: hand-eval gate per Phase 1, and operator reviews monthly samples to flag judge drift. Eventually consider human-graded calibration sets.

5. **Quote-reading semantic mismatch.** The reading and quote are decoupled. Risk: the quote's content sometimes feels disconnected from the reading. This is a feature, not a bug under Option C (the quote is its own daily artifact, not a postscript to the reading), but operator should validate after a week of live readings.

6. **Registry-rebuild scope creep.** The 54-philosopher field-addition task is structured but content-heavy. Risk: it expands as we research each philosopher properly. Mitigation: ship Phase 1 against the existing registry, rebuild Phase 4 in parallel without blocking.

7. **The "high-craft Barnum 2.0" risk.** The new prompt explicitly bans the current failure modes (kettle, bruise, permission landings, etc.). Risk: the model finds new failure modes we haven't anticipated. Mitigation: the wall-test and behavioral-specificity judge axes are the canaries; if both stay above 4.0, the new failure mode is at least different from the current one. Iterate.

---

## 14. What changes for the reader

Today: a reader sees a card with their sign, a 60-word reading attributed to Marcus Aurelius, a Marcus quote, and a peaceful thought that gives them permission to rest. Tomorrow's reading is structurally identical with a different philosopher's name. The reader cannot tell their council shaped any of this.

After the rebuild: a reader sees a card with their sign, a 250 to 400 word reading in a confident anonymous voice that pushes back at least once, names a behavior they likely did yesterday, pivots tonally, and ends on an act or a question. The reading feels like *this Wednesday in late April*, even though no astronomical jargon appears in the text. The quote is a separate item, attributed to one of their council members. Across 10 readings the voice is recognizable. The reader who picked Marcus + Pema + Naval + Thich + Seneca gets readings shaped by 3am-honest practical contemplation. The reader who picked Sartre + Cioran + Krishnamurti + Nietzsche + de Beauvoir gets readings that refuse to console. The reader who picked Mary Oliver + Thoreau + Maya Angelou + Whitman + Hesse gets readings full of attention to small living things. The shaping is invisible. The personalization is felt.

That's the bar. The rest of this doc is the spec for getting there.

End of resonance synthesis.
