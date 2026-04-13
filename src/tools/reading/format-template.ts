/**
 * reading:format-template — Atomic tool
 *
 * Returns the writing format template for a sign on a given date.
 * Independently useful: determine which structural format to use
 * without building a full prompt.
 *
 * Input:  { sign: string, date?: string }
 * Output: { formatName: string, structure: string, index: number }
 *
 * Logic: each sign gets a different format on the same day via
 * (signIndex + dayNum) % formats.length rotation.
 */

import { isValidSign, VALID_SIGNS } from '@/tools/zodiac/sign-profile';

// Extracted from src/utils/horoscope-prompts.ts — the canonical list.
// Each entry is a structural instruction for how to write a reading.
const WRITING_FORMATS = [
  {
    name: 'Scene & Insight',
    structure:
      'Open with a scene or micro-story (3 sentences max), then draw out a single insight. End with a question.',
  },
  {
    name: 'Nature Connection',
    structure:
      'Start with an observation about the natural world right now (season, weather, light). Connect it to an inner truth. Close with one actionable suggestion.',
  },
  {
    name: 'Philosophical Paradox',
    structure:
      "Begin with a philosophical paradox or koan. Sit with it — don't resolve it too quickly. Let the reader arrive at their own understanding.",
  },
  {
    name: 'Three Thoughts',
    structure:
      'Write as a series of three short, distinct thoughts — each building on the last. No transitions needed. Let the white space do the work.',
  },
  {
    name: 'Mid-Conversation',
    structure:
      'Start mid-thought, as if continuing a conversation. Be specific and concrete. End by zooming out to something universal.',
  },
  {
    name: 'Name the Unnamed',
    structure:
      "Open with something the reader probably felt this morning but couldn't name. Validate it. Then gently reframe it.",
  },
  {
    name: 'Parable',
    structure:
      "Tell a very brief parable or anecdote (real or imagined). Don't explain the moral — let it land on its own, then add one line of reflection.",
  },
  {
    name: 'Question Explorer',
    structure:
      "Ask a question first. Explore it from two angles. Don't answer it — instead, offer a practice or experiment for the day.",
  },
  {
    name: 'Body First',
    structure:
      'Start with the body — a physical sensation or gesture. Use it as a doorway into emotional or spiritual territory. Keep it grounded.',
  },
  {
    name: 'Clear the Noise',
    structure:
      'Open with what this day is NOT about. Clear away the noise, then say the one thing that matters.',
  },
  {
    name: 'Letter to Younger Self',
    structure:
      'Write as if giving advice to your younger self about a day exactly like today. Be honest, kind, and specific.',
  },
  {
    name: 'From Stillness',
    structure:
      'Begin with silence — describe a quiet moment. Let the horoscope emerge from that stillness rather than announcing itself.',
  },
] as const;

export type WritingFormat = {
  name: string;
  structure: string;
};

export interface FormatTemplateResult {
  formatName: string;
  structure: string;
  index: number;
}

/**
 * Compute the format index for a sign on a given date.
 * Each sign gets a different format on the same day.
 */
function getFormatIndex(sign: string, date: string): number {
  const signIndex = (VALID_SIGNS as readonly string[]).indexOf(sign.toLowerCase());
  const dayNum = new Date(date).getTime() / (1000 * 60 * 60 * 24);
  return (signIndex + Math.floor(dayNum)) % WRITING_FORMATS.length;
}

/**
 * reading:format-template
 *
 * Get the writing format template assigned to a sign for a given date.
 * Defaults to today if no date is provided.
 */
export function getFormatTemplate(sign: string, date?: string): FormatTemplateResult {
  const normalizedSign = sign.toLowerCase();
  if (!isValidSign(normalizedSign)) {
    throw new Error(
      `Unknown sign: ${sign}. Valid signs: ${VALID_SIGNS.join(', ')}`
    );
  }

  const resolvedDate = date ?? new Date().toISOString().split('T')[0];
  const index = getFormatIndex(normalizedSign, resolvedDate);
  const format = WRITING_FORMATS[index];

  return {
    formatName: format.name,
    structure: format.structure,
    index,
  };
}

/**
 * reading:format-list
 *
 * List all available writing formats (useful for debugging/admin).
 */
export function listFormats(): WritingFormat[] {
  return WRITING_FORMATS.map((f) => ({ name: f.name, structure: f.structure }));
}
