/**
 * zodiac:sign-profile — Atomic tool
 *
 * Returns the complete personality profile for a zodiac sign.
 * Independently useful: works from CLI, API route, agent, or any consumer.
 *
 * Input:  { sign: string }
 * Output: { sign, element, dateRange, voice, avoidPatterns, exampleOpener }
 */

export const VALID_SIGNS = [
  'aries', 'taurus', 'gemini', 'cancer',
  'leo', 'virgo', 'libra', 'scorpio',
  'sagittarius', 'capricorn', 'aquarius', 'pisces',
] as const;

export type ValidSign = (typeof VALID_SIGNS)[number];

export function isValidSign(sign: string): sign is ValidSign {
  return (VALID_SIGNS as readonly string[]).includes(sign.toLowerCase());
}

export interface SignProfile {
  sign: ValidSign;
  element: 'Fire' | 'Earth' | 'Air' | 'Water';
  dateRange: string;
  symbol: string;
  voice: string;
  avoidPatterns: string;
  exampleOpener: string;
}

const SIGN_DATA: Record<ValidSign, Omit<SignProfile, 'sign'>> = {
  aries: {
    element: 'Fire',
    dateRange: 'Mar 21 \u2013 Apr 19',
    symbol: '\u2648',
    voice: 'Write like a bold, direct coach who respects the reader\'s intelligence. Short punchy sentences mixed with one vivid image. No fluff \u2014 get to the point, then land an unexpected insight that makes them stop and think. Energy is forward-moving, like a conversation with someone who believes in you fiercely.',
    avoidPatterns: 'Never open with "Dear Aries" or any greeting. Never use "fiery phoenix" or "blazing trail."',
    exampleOpener: 'Example opener style: "There\'s a moment right before you act \u2014 a half-breath \u2014 and today that pause holds everything."',
  },
  taurus: {
    element: 'Earth',
    dateRange: 'Apr 20 \u2013 May 20',
    symbol: '\u2649',
    voice: 'Write like a wise friend sitting on a porch at sunset, unhurried and grounded. Use sensory details \u2014 textures, temperatures, tastes. The rhythm should be slow and steady, like someone who savors their words. Include one concrete, everyday observation that becomes a metaphor for something deeper.',
    avoidPatterns: 'Never open with "Dear Taurus" or any greeting. Never use "steadfast" or "bull" metaphors.',
    exampleOpener: 'Example opener style: "Notice the weight of your coffee cup this morning. That warmth in your hands \u2014 it\'s enough."',
  },
  gemini: {
    element: 'Air',
    dateRange: 'May 21 \u2013 Jun 20',
    symbol: '\u264A',
    voice: 'Write with intellectual curiosity and playful wit. Structure as a quick, fascinating thought experiment or "what if" scenario. The tone is like a brilliant friend who just read something amazing and can\'t wait to share the connection they made. Jump between ideas, then tie them together with a surprising thread.',
    avoidPatterns: 'Never open with "Dear Gemini" or any greeting. Never use "twin" metaphors or "duality" clich\u00e9s.',
    exampleOpener: 'Example opener style: "Here\'s something strange \u2014 the same wind that scatters seeds also carries birdsong. What does that tell you about today?"',
  },
  cancer: {
    element: 'Water',
    dateRange: 'Jun 21 \u2013 Jul 22',
    symbol: '\u264B',
    voice: 'Write with tender emotional intelligence, like a letter from someone who truly understands. Use imagery of home, memory, and the body\'s quiet wisdom (a knot in the chest, a softening behind the eyes). The tone is intimate \u2014 not saccharine \u2014 honest about difficulty while offering genuine warmth.',
    avoidPatterns: 'Never open with "Dear Cancer" or "Dearest Cancer" or any greeting. Never use "shell" or "crab" metaphors.',
    exampleOpener: 'Example opener style: "Some feelings don\'t need names. That heaviness you woke up with? It might just be your heart making room."',
  },
  leo: {
    element: 'Fire',
    dateRange: 'Jul 23 \u2013 Aug 22',
    symbol: '\u264C',
    voice: 'Write with warmth, generosity, and a touch of theatrical flair \u2014 but grounded in real wisdom, not flattery. The tone is like a favorite mentor who sees your greatness AND your blind spots. Use vivid, cinematic imagery. Include one honest challenge alongside the encouragement.',
    avoidPatterns: 'Never open with "Dear Leo" or any greeting. Never use "roar" or "king/queen of the jungle" clich\u00e9s.',
    exampleOpener: 'Example opener style: "The spotlight doesn\'t find you \u2014 you create it. But today, try something: step out of it on purpose and see what happens."',
  },
  virgo: {
    element: 'Earth',
    dateRange: 'Aug 23 \u2013 Sep 22',
    symbol: '\u264D',
    voice: 'Write with precision, dry wit, and unexpected depth. Structure the insight like a well-crafted observation \u2014 noticing a small detail that reveals a larger truth. The tone is like a perceptive essayist who finds meaning in the ordinary. Include one permission slip to be imperfect.',
    avoidPatterns: 'Never open with "Dear Virgo" or any greeting. Never use "perfectionist" or "analytical mind" clich\u00e9s.',
    exampleOpener: 'Example opener style: "The crack in the sidewalk isn\'t a flaw \u2014 it\'s where the rain collects, where the tiny plant grows. Look down today."',
  },
  libra: {
    element: 'Air',
    dateRange: 'Sep 23 \u2013 Oct 22',
    symbol: '\u264E',
    voice: 'Write with elegance and moral seriousness, like a thoughtful diplomat who also writes poetry. Balance two competing truths without resolving them cheaply. The tone is sophisticated but warm \u2014 someone who believes in beauty as a form of ethics. Include a question that has no easy answer.',
    avoidPatterns: 'Never open with "Dear Libra" or any greeting. Never use "scales" or "balance" metaphors.',
    exampleOpener: 'Example opener style: "Two truths, neither wrong: you need people, and you need silence. Today doesn\'t ask you to choose."',
  },
  scorpio: {
    element: 'Water',
    dateRange: 'Oct 23 \u2013 Nov 21',
    symbol: '\u264F',
    voice: 'Write with raw intensity and psychological depth. No sugarcoating \u2014 speak to their intelligence about shadow, transformation, and the power of what\'s hidden. The tone is like a therapist who doesn\'t flinch, combined with a poet who finds beauty in darkness. Use sharp, compressed language.',
    avoidPatterns: 'Never open with "Dear Scorpio" or any greeting. Never use "sting" or "mysterious depths" clich\u00e9s.',
    exampleOpener: 'Example opener style: "You already know what you\'re avoiding. Not the thing itself \u2014 but what it means if you finally face it."',
  },
  sagittarius: {
    element: 'Fire',
    dateRange: 'Nov 22 \u2013 Dec 21',
    symbol: '\u2650',
    voice: 'Write with philosophical wanderlust and irreverent wisdom. The tone is like a well-read traveler sharing a story over a campfire \u2014 expansive thinking grounded in real experience. Include a provocative philosophical question or paradox. Mix humor with genuine depth.',
    avoidPatterns: 'Never open with "Dear Sagittarius" or any greeting. Never use "archer" or "aim your arrow" metaphors.',
    exampleOpener: 'Example opener style: "A monk once told a joke and then said, \'If you laughed, you understood.\' Today works the same way."',
  },
  capricorn: {
    element: 'Earth',
    dateRange: 'Dec 22 \u2013 Jan 19',
    symbol: '\u2651',
    voice: 'Write with understated authority and hard-won wisdom. No motivational poster language \u2014 speak like someone who has actually climbed the mountain and knows the summit isn\'t the point. The tone is quietly powerful, practical yet philosophical. Include one admission that rest is not weakness.',
    avoidPatterns: 'Never open with "Dear Capricorn" or any greeting. Never use "mountain goat" or "climb to the top" clich\u00e9s.',
    exampleOpener: 'Example opener style: "The most productive thing you might do today has nothing to do with your to-do list."',
  },
  aquarius: {
    element: 'Air',
    dateRange: 'Jan 20 \u2013 Feb 18',
    symbol: '\u2652',
    voice: 'Write like a visionary systems thinker who also has a heart \u2014 someone who sees patterns others miss but cares deeply about individuals. The tone is unconventional, slightly detached but never cold. Use unexpected analogies from science, technology, or nature. Challenge one assumption they hold.',
    avoidPatterns: 'Never open with "Dear Aquarius" or any greeting. Never use "water bearer" or "rebel" clich\u00e9s.',
    exampleOpener: 'Example opener style: "Ant colonies have no leader. Every ant follows two rules, and from that, cities emerge. What are your two rules?"',
  },
  pisces: {
    element: 'Water',
    dateRange: 'Feb 19 \u2013 Mar 20',
    symbol: '\u2653',
    voice: 'Write with dreamlike fluidity and emotional truth. The boundaries between metaphor and reality should blur intentionally. The tone is like a favorite poem that you don\'t fully understand but that makes you feel something real. Use synesthesia (mixing senses) and unexpected juxtapositions.',
    avoidPatterns: 'Never open with "Dear Pisces" or any greeting. Never use "ocean depths" or "swimming" clich\u00e9s.',
    exampleOpener: 'Example opener style: "The color of this morning tastes like almost-remembering. Stay with that feeling \u2014 it\'s trying to show you something."',
  },
};

/**
 * zodiac:sign-profile
 *
 * Get the full personality profile for a zodiac sign.
 */
export function getSignProfile(sign: string): SignProfile {
  const key = sign.toLowerCase() as ValidSign;
  if (!isValidSign(key)) {
    throw new Error(`Unknown sign: ${sign}. Valid signs: ${VALID_SIGNS.join(', ')}`);
  }
  return { sign: key, ...SIGN_DATA[key] };
}

/**
 * zodiac:sign-list
 *
 * List all signs, optionally filtered by element.
 */
export function listSigns(element?: string): SignProfile[] {
  let signs = VALID_SIGNS.map((s) => getSignProfile(s));
  if (element) {
    signs = signs.filter((s) => s.element.toLowerCase() === element.toLowerCase());
  }
  return signs;
}
