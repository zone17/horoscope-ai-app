/**
 * Sign-specific personality system for generating diverse, authentic horoscopes.
 * Each sign gets a distinct voice, writing format, and philosophical lens
 * so that outputs feel like they were written by different people.
 */

// Each sign has a distinct personality that shapes the writing voice
const SIGN_PERSONALITIES: Record<string, {
  voice: string;
  avoidPatterns: string;
  exampleOpener: string;
}> = {
  aries: {
    voice: 'Write like a bold, direct coach who respects the reader\'s intelligence. Short punchy sentences mixed with one vivid image. No fluff — get to the point, then land an unexpected insight that makes them stop and think. Energy is forward-moving, like a conversation with someone who believes in you fiercely.',
    avoidPatterns: 'Never open with "Dear Aries" or any greeting. Never use "fiery phoenix" or "blazing trail."',
    exampleOpener: 'Example opener style: "There\'s a moment right before you act — a half-breath — and today that pause holds everything."',
  },
  taurus: {
    voice: 'Write like a wise friend sitting on a porch at sunset, unhurried and grounded. Use sensory details — textures, temperatures, tastes. The rhythm should be slow and steady, like someone who savors their words. Include one concrete, everyday observation that becomes a metaphor for something deeper.',
    avoidPatterns: 'Never open with "Dear Taurus" or any greeting. Never use "steadfast" or "bull" metaphors.',
    exampleOpener: 'Example opener style: "Notice the weight of your coffee cup this morning. That warmth in your hands — it\'s enough."',
  },
  gemini: {
    voice: 'Write with intellectual curiosity and playful wit. Structure as a quick, fascinating thought experiment or "what if" scenario. The tone is like a brilliant friend who just read something amazing and can\'t wait to share the connection they made. Jump between ideas, then tie them together with a surprising thread.',
    avoidPatterns: 'Never open with "Dear Gemini" or any greeting. Never use "twin" metaphors or "duality" clichés.',
    exampleOpener: 'Example opener style: "Here\'s something strange — the same wind that scatters seeds also carries birdsong. What does that tell you about today?"',
  },
  cancer: {
    voice: 'Write with tender emotional intelligence, like a letter from someone who truly understands. Use imagery of home, memory, and the body\'s quiet wisdom (a knot in the chest, a softening behind the eyes). The tone is intimate — not saccharine — honest about difficulty while offering genuine warmth.',
    avoidPatterns: 'Never open with "Dear Cancer" or "Dearest Cancer" or any greeting. Never use "shell" or "crab" metaphors.',
    exampleOpener: 'Example opener style: "Some feelings don\'t need names. That heaviness you woke up with? It might just be your heart making room."',
  },
  leo: {
    voice: 'Write with warmth, generosity, and a touch of theatrical flair — but grounded in real wisdom, not flattery. The tone is like a favorite mentor who sees your greatness AND your blind spots. Use vivid, cinematic imagery. Include one honest challenge alongside the encouragement.',
    avoidPatterns: 'Never open with "Dear Leo" or any greeting. Never use "roar" or "king/queen of the jungle" clichés.',
    exampleOpener: 'Example opener style: "The spotlight doesn\'t find you — you create it. But today, try something: step out of it on purpose and see what happens."',
  },
  virgo: {
    voice: 'Write with precision, dry wit, and unexpected depth. Structure the insight like a well-crafted observation — noticing a small detail that reveals a larger truth. The tone is like a perceptive essayist who finds meaning in the ordinary. Include one permission slip to be imperfect.',
    avoidPatterns: 'Never open with "Dear Virgo" or any greeting. Never use "perfectionist" or "analytical mind" clichés.',
    exampleOpener: 'Example opener style: "The crack in the sidewalk isn\'t a flaw — it\'s where the rain collects, where the tiny plant grows. Look down today."',
  },
  libra: {
    voice: 'Write with elegance and moral seriousness, like a thoughtful diplomat who also writes poetry. Balance two competing truths without resolving them cheaply. The tone is sophisticated but warm — someone who believes in beauty as a form of ethics. Include a question that has no easy answer.',
    avoidPatterns: 'Never open with "Dear Libra" or any greeting. Never use "scales" or "balance" metaphors.',
    exampleOpener: 'Example opener style: "Two truths, neither wrong: you need people, and you need silence. Today doesn\'t ask you to choose."',
  },
  scorpio: {
    voice: 'Write with raw intensity and psychological depth. No sugarcoating — speak to their intelligence about shadow, transformation, and the power of what\'s hidden. The tone is like a therapist who doesn\'t flinch, combined with a poet who finds beauty in darkness. Use sharp, compressed language.',
    avoidPatterns: 'Never open with "Dear Scorpio" or any greeting. Never use "sting" or "mysterious depths" clichés.',
    exampleOpener: 'Example opener style: "You already know what you\'re avoiding. Not the thing itself — but what it means if you finally face it."',
  },
  sagittarius: {
    voice: 'Write with philosophical wanderlust and irreverent wisdom. The tone is like a well-read traveler sharing a story over a campfire — expansive thinking grounded in real experience. Include a provocative philosophical question or paradox. Mix humor with genuine depth.',
    avoidPatterns: 'Never open with "Dear Sagittarius" or any greeting. Never use "archer" or "aim your arrow" metaphors.',
    exampleOpener: 'Example opener style: "A monk once told a joke and then said, \'If you laughed, you understood.\' Today works the same way."',
  },
  capricorn: {
    voice: 'Write with understated authority and hard-won wisdom. No motivational poster language — speak like someone who has actually climbed the mountain and knows the summit isn\'t the point. The tone is quietly powerful, practical yet philosophical. Include one admission that rest is not weakness.',
    avoidPatterns: 'Never open with "Dear Capricorn" or any greeting. Never use "mountain goat" or "climb to the top" clichés.',
    exampleOpener: 'Example opener style: "The most productive thing you might do today has nothing to do with your to-do list."',
  },
  aquarius: {
    voice: 'Write like a visionary systems thinker who also has a heart — someone who sees patterns others miss but cares deeply about individuals. The tone is unconventional, slightly detached but never cold. Use unexpected analogies from science, technology, or nature. Challenge one assumption they hold.',
    avoidPatterns: 'Never open with "Dear Aquarius" or any greeting. Never use "water bearer" or "rebel" clichés.',
    exampleOpener: 'Example opener style: "Ant colonies have no leader. Every ant follows two rules, and from that, cities emerge. What are your two rules?"',
  },
  pisces: {
    voice: 'Write with dreamlike fluidity and emotional truth. The boundaries between metaphor and reality should blur intentionally. The tone is like a favorite poem that you don\'t fully understand but that makes you feel something real. Use synesthesia (mixing senses) and unexpected juxtapositions.',
    avoidPatterns: 'Never open with "Dear Pisces" or any greeting. Never use "ocean depths" or "swimming" clichés.',
    exampleOpener: 'Example opener style: "The color of this morning tastes like almost-remembering. Stay with that feeling — it\'s trying to show you something."',
  },
};

// Writing format rotation — each sign gets a different structural approach
// Uses the day of year modulo to rotate daily
const WRITING_FORMATS = [
  'Open with a scene or micro-story (3 sentences max), then draw out a single insight. End with a question.',
  'Start with an observation about the natural world right now (season, weather, light). Connect it to an inner truth. Close with one actionable suggestion.',
  'Begin with a philosophical paradox or koan. Sit with it — don\'t resolve it too quickly. Let the reader arrive at their own understanding.',
  'Write as a series of three short, distinct thoughts — each building on the last. No transitions needed. Let the white space do the work.',
  'Start mid-thought, as if continuing a conversation. Be specific and concrete. End by zooming out to something universal.',
  'Open with something the reader probably felt this morning but couldn\'t name. Validate it. Then gently reframe it.',
  'Tell a very brief parable or anecdote (real or imagined). Don\'t explain the moral — let it land on its own, then add one line of reflection.',
  'Ask a question first. Explore it from two angles. Don\'t answer it — instead, offer a practice or experiment for the day.',
  'Start with the body — a physical sensation or gesture. Use it as a doorway into emotional or spiritual territory. Keep it grounded.',
  'Open with what this day is NOT about. Clear away the noise, then say the one thing that matters.',
  'Write as if giving advice to your younger self about a day exactly like today. Be honest, kind, and specific.',
  'Begin with silence — describe a quiet moment. Let the horoscope emerge from that stillness rather than announcing itself.',
];

/**
 * Get the writing format index for a sign on a given date.
 * Ensures each sign gets a different format on the same day.
 */
function getFormatIndex(sign: string, date: string): number {
  const signIndex = [
    'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
    'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'
  ].indexOf(sign);

  // Use date to create a daily rotation
  const dayNum = new Date(date).getTime() / (1000 * 60 * 60 * 24);
  return (signIndex + Math.floor(dayNum)) % WRITING_FORMATS.length;
}

/**
 * Build the horoscope generation prompt for a specific sign.
 * Each sign gets a unique voice, format, and philosophical assignment.
 */
export function buildHoroscopePrompt(sign: string, assignedPhilosopher?: string): string {
  const personality = SIGN_PERSONALITIES[sign.toLowerCase()];
  if (!personality) {
    throw new Error(`Unknown sign: ${sign}`);
  }

  const today = new Date().toISOString().split('T')[0];
  const formatIndex = getFormatIndex(sign.toLowerCase(), today);
  const writingFormat = WRITING_FORMATS[formatIndex];

  const philosopherInstruction = assignedPhilosopher
    ? `Use a quote from ${assignedPhilosopher} specifically.`
    : 'Use a quote from ONE of: Alan Watts, Richard Feynman, Albert Einstein, Friedrich Nietzsche, Lao Tzu, Socrates, Plato, Aristotle, Epicurus, Marcus Aurelius, Seneca, Jiddu Krishnamurti, Dr. Joe Dispenza, Walter Russell.';

  return `Write a daily horoscope for ${sign.toUpperCase()}. This is not fortune-telling — it's philosophical guidance that feels personally written for someone born under this sign.

## YOUR VOICE FOR ${sign.toUpperCase()}
${personality.voice}

## HARD RULES
${personality.avoidPatterns}
- NEVER use the phrase "dear [sign]" or any greeting format
- NEVER start with "Today, [sign]..."
- NEVER use "tapestry", "canvas", "journey", "embrace", "navigate", or "celestial"
- NEVER use flowery filler phrases like "the cosmos has aligned" or "the universe whispers"
- Write like a real human being, not a horoscope generator
- The reader should feel like this was written specifically for THEIR sign, not copy-pasted with the sign name swapped in
- Keep the message between 40-80 words. Quality over quantity.

## WRITING FORMAT FOR TODAY
${writingFormat}

## ${personality.exampleOpener}

## WHAT TO INCLUDE (as JSON fields)
1. **message**: The main horoscope (40-80 words, following the voice and format above)
2. **best_match**: 3-4 compatible signs as lowercase comma-separated string (e.g., "aries, gemini, libra")
   - NEVER include ${sign} in its own matches
   - Fire (aries/leo/sagittarius) pairs with Fire + Air (gemini/libra/aquarius)
   - Earth (taurus/virgo/capricorn) pairs with Earth + Water (cancer/scorpio/pisces)
   - Air pairs with Air + Fire
   - Water pairs with Water + Earth
   ${sign.toLowerCase() === 'libra' ? '- MUST include aquarius' : ''}${sign.toLowerCase() === 'aquarius' ? '- MUST include libra' : ''}
3. **inspirational_quote**: A real quote (under 120 characters) from the assigned philosopher. ${philosopherInstruction}
4. **quote_author**: Exact name of the philosopher
5. **peaceful_thought**: A 1-2 sentence nighttime wind-down thought. Not generic — make it specific to this sign's energy today. No greeting, no "dear [sign]."

Respond ONLY with valid JSON.`;
}

/**
 * The 14 allowed philosophers for quote attribution.
 */
export const VALID_AUTHORS = [
  'Alan Watts', 'Allan Watts', 'Richard Feynman', 'Albert Einstein',
  'Friedrich Nietzsche', 'Lao Tzu', 'Socrates', 'Plato', 'Aristotle',
  'Epicurus', 'Marcus Aurelius', 'Seneca', 'Jiddu Krishnamurti',
  'Dr. Joe Dispenza', 'Joe Dispenza', 'Walter Russell'
];

/**
 * Pre-assigned philosopher rotation to guarantee variety across all 12 signs.
 * Rotates daily using the date.
 */
export function getPhilosopherAssignment(sign: string, date: string): string {
  const signs = [
    'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
    'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'
  ];
  // Use unique philosophers (no duplicates) — 12 signs, 12 unique philosophers
  const philosophers = [
    'Alan Watts', 'Marcus Aurelius', 'Lao Tzu', 'Seneca',
    'Albert Einstein', 'Epicurus', 'Friedrich Nietzsche', 'Plato',
    'Richard Feynman', 'Aristotle', 'Dr. Joe Dispenza', 'Walter Russell'
  ];

  const signIndex = signs.indexOf(sign.toLowerCase());
  if (signIndex === -1) return philosophers[0];

  // Rotate the assignment daily so each sign gets a different philosopher each day
  const dayNum = Math.floor(new Date(date).getTime() / (1000 * 60 * 60 * 24));
  const offset = dayNum % philosophers.length;
  const assignedIndex = (signIndex + offset) % philosophers.length;

  return philosophers[assignedIndex];
}
