# Live Readings Diagnostic

The 12 readings for 2026-04-29 read as one writer — a literary therapist with a kettle on the stove — wearing twelve nametags. The prior audit's "anti-template, sign-specific" verdict survived because the template they collapse onto is *new* and *high-craft*.

## Top failure modes (ranked by leverage)

### 1. Convergence onto a single "literary-therapy" house voice
Sign profiles in `src/tools/zodiac/sign-profile.ts:38-128` prescribe radically different voices. Three pairs that should sound nothing alike:

- **Aries (Einstein, "bold direct coach")** vs **Cancer (Plato, "tender")**:
  - Aries: *"You keep stopping yourself right before the good part… a hand on a door handle that won't turn."*
  - Cancer: *"Something you've been carrying around the house with you — not unpacking it, just moving it from room to room."*
  Both: gentle observation about avoidance, soft domestic prop, permission to act. Aries demands "short punchy sentences, forward-moving, fiercely believes in you." This does not punch — it coaxes.

- **Scorpio (Walter Russell, "raw intensity")** vs **Taurus (Epicurus, "porch friend")**:
  - Scorpio: *"the quiet circling, the thought you keep returning to like a bruise you press."*
  - Taurus: *"Something felt slightly off this morning, like a shoe tied one loop too tight."*
  Scorpio's profile asks for "sharp, compressed language"; this is a kitchen vignette indistinguishable from Taurus.

- **Sagittarius (Watts, "campfire wanderer")** vs **Libra (Dispenza, "diplomat")**:
  - Sagittarius: *"The kettle's been whistling. You just stopped hearing it."*
  - Libra: *"There's a kettle-whistle moment coming, pressure that needs somewhere to go."*
  Same kettle, ostensibly opposite registers, identical kitchen.

**Source**: `src/tools/reading/generate.ts:113-114` — the "SOUL" block (*"open heart… you ask questions instead of making declarations… never lose faith"*) is a uniform tonal floor that overpowers `profile.voice` injected three lines later. Every reading is a "SOUL" reading first.

**Why operator finds it unresonant**: 12 voices collapse to 1; no sign feels written for them.

### 2. Philosopher reduced to a postscript
Strip the quote and byline; the philosopher disappears. Six tests:

- **Aristotle (Virgo)**: *"You're allowed to hand something in while it's still 97% done."* This is permission-based productivity coaching. Aristotle is virtue ethics, *hexis*, the doctrine of the mean. The bolted quote ("Quality is not an act, it is a habit") gestures at it; the body refutes it.
- **Seneca (Pisces)**: *"Something you've been quietly carrying has started to leave a color on everything, like a bruise…"* Seneca's *Letters* are caustic, structured, civic. This is somatic contemporary therapeutic.
- **Plato (Cancer)**: No Forms, no dialectic, no Socratic structure — a journaling prompt.
- **Einstein (Aries)**: A door-handle metaphor about courage. Could be a Brené Brown quote-card.
- **Walter Russell (Scorpio)**: A cold-kettle vignette. Russell was a cosmological mystic obsessed with rhythmic balanced interchange.
- **Marcus Aurelius (Capricorn)**: *"Late autumn strips the trees down to their actual shape."* Closest hit — austerity is genuinely Stoic — but it's late April; wrong season. Model picked "austere image" generically rather than reaching for *Meditations*' actual moves.

**Source**: `generate.ts:99-108`. Philosopher enters the prompt only as a name and a quote-bank reference. The model is never asked to think in their *register*, *vocabulary*, *concerns*, or *rhetorical moves*. The judge's `quoteFidelity` axis (`judge.ts:217`) checks the *quote* — not the message body — for register.

**Why operator finds it unresonant**: council picker promises "philosophy from a person"; product delivers "reading with a quote stapled to it."

### 3. A small recurring image vocabulary doing all the work
Tally across 12:
- **Kettle**: Scorpio, Sagittarius, Pisces, Libra — **4/12**.
- **Bruise**: Pisces (*"like a bruise you keep forgetting"*), Scorpio (*"like a bruise you press"*) — **2/12**.
- **Shoulders dropping / hands resting**: Cancer, Leo, Capricorn — **3/12**.
- **Door / handle / threshold**: Aries, Gemini, Sagittarius — **3/12**.
- **Opening "Something you've been…"**: Cancer, Pisces, Taurus — **3/12**.
- **Closing "Let X count as Y"**: Taurus, Capricorn, Cancer, Sagittarius, Pisces, Leo — **6/12**.

**Source**: `generate.ts:141` literally lists *"a shoulder dropping, a kettle whistling, a key turning"* as the model's example pool of "concrete sensory images." The model is using the example list as a vocabulary. The hard-rule prompt is *teaching* the trope.

**Why operator finds it unresonant**: 4 kettles in 12 readings is not concrete sensory specificity. It is one writer reusing a prop.

### 4. High-craft Barnum
Concrete imagery is not falsifiable specificity. Universal-applicability test:
- *"Something felt slightly off this morning, like a shoe tied one loop too tight."* (Taurus) — anyone, any morning.
- *"You keep stopping yourself right before the good part."* (Aries) — universal procrastination.
- *"The flaw you spotted in your own plan this morning, the one that made you wince over coffee."* (Virgo) — Forer-perfect: anyone with plans and coffee.
- *"You feel it in your chest before you understand it in your head. Something tightened when they didn't notice."* (Leo) — anyone who has felt unseen.

Literary Barnums. Prose is good; predictive content is zero.

**Source**: `judge.ts:198-204` — `antiBarnum` flags *"vague universal statements"* and *"you sometimes feel"* but does NOT flag concrete-image-wrapped universals. "Everyone procrastinates" gets caught; "you keep stopping yourself right before the good part" passes because it has a verb and a body.

**Why operator finds it unresonant**: high-craft Barnum feels seen, then on reflection feels nothing.

### 5. Therapeutic-permission close as universal landing zone
Every PEACEFUL field, and most MESSAGE closers, lands on permission/gentleness/it's-enough:
- *"rest isn't retreat for you, it's reloading"* (Aries)
- *"Let your hands rest tonight"* (Cancer)
- *"Rest isn't delay. It's structural work too"* (Capricorn)
- *"let one thing go unfinished and uncelebrated"* (Leo)
- *"You don't have to resolve everything before you sleep"* (Libra)
- *"You don't have to resolve it before sleep"* (Scorpio)
- *"You're allowed to hand something in while it's still 97% done"* (Virgo)

Aristotle does not give permission. Seneca commands. Nietzsche provokes. Russell instructs in cosmic law. All collapsed into the same therapist saying "you've been working hard, it's okay to rest."

**Source**: `generate.ts:113-114` SOUL block + line 161 (*"peacefulThought: A 1-2 sentence nighttime wind-down thought"*) hardcodes the closing register. Format templates (`format-template.ts:19-80`) end with permission-shaped moves: "close with one actionable suggestion," "let it land on its own," "offer a practice." No template ends with provocation, command, or unresolved dissonance.

**Why operator finds it unresonant**: every reading ends with the same hand on the same shoulder; none of the hands feel like the philosopher's hand.

### 6. Temporal flatness
None of the 12 readings reference spring, day-of-week, late April, moon phase, or anything that would not be true on 2026-01-15. Capricorn explicitly references *"late autumn"* — wrong season; the date isn't reaching the model. `generate.ts:78,267`: `resolvedDate` is used only as a seed for format-rotation and quote-bank picks. The string never enters the prompt text. `buildReadingPrompt` (`generate.ts:111-161`) never interpolates `resolvedDate`.

**Why operator finds it unresonant**: a "daily" horoscope that does not know what day it is is not daily.

### 7. Council invisibility + format homogenization
`assign-daily.ts:89-103` picks one rotation winner from the user's 1-5 philosophers; the other 4 play no role in the prompt. The 12 format templates (`format-template.ts:19-80`) are variants of one arc: observation → tension → permission/reflection. Even "Philosophical Paradox" resolves with *"let the reader arrive at their own understanding"* — itself a permission move. The critique loop (`generate-with-critique.ts:90-93`) regenerates only on `overall ≤ 3 || antiBarnum ≤ 3 || voiceAuthenticity ≤ 3` — measured by a judge with no philosopher-fingerprint axis. The loop optimizes readings *toward the local maximum the operator is rejecting*: gentle, sensory, anti-Barnum-by-imagery, voice-authentic-by-house-style.

**Why operator finds it unresonant**: picked 5 philosophers, got 1, in a format that softens that 1.

## What's actually working

1. **Verified-quote bank with fallback** (`generate.ts:303-315`) — quotes are real, correctly attributed, never hallucinated. Preserve this plumbing.
2. **AI-tell ban list** (`generate.ts:133-140`) — banning *"not just X, but Y"*, em-dash-asides, tricolons, slop-vocabulary visibly works. Readings do not sound like default ChatGPT. Prose-craft floor is high. Do not lose this.
3. **Individual sentences** — *"a shoe tied one loop too tight,"* the murmuration, *"a key you're not sure fits"* are good lines. The problem is convergence and reuse, not absence of craft.

## The single biggest lever

**Replace the monolithic SOUL block with a per-philosopher voice-and-method spec, and let the philosopher carry the whole register.** Right now `generate.ts:113-114` sets a uniform "open-heart, ask-questions, never-preachy" tone that drowns both sign voice and philosopher. Needed: a registry-driven block — per philosopher — specifying (a) rhetorical moves (Aristotle: enumeration, definition, the mean; Seneca: imperative second-person, civic metaphors, brevitas; Nietzsche: aphorism, attack, the question that wounds), (b) characteristic vocabulary, (c) *concerns*, (d) what they would never say — including *"you don't have to resolve this before sleep."* Reorder the prompt: philosopher-method → sign-voice (modulating, not replacing) → today's actual date as text → format. Delete the universal SOUL block; let the philosopher *be* the soul. Add a judge axis for "philosopher-fingerprint" (could a literate reader identify the philosopher from the message body alone?) and a "today-ness" axis. The current judge measures voiceAuthenticity-by-sign and quoteFidelity-by-author — never voiceAuthenticity-by-philosopher-in-the-message-body. That blind spot is what the critique loop is currently optimizing *against*, pushing every reading toward the gentle, kettle-on-stove local maximum the operator is rejecting.
