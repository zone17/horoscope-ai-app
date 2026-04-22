/**
 * philosopher:assign-daily — Atomic tool
 *
 * Assigns a philosopher for a given sign and date. Deterministic: same inputs
 * always produce the same output, so every consumer (cron, API, agent) agrees
 * on who is "today's philosopher" for a sign.
 *
 * Input:  { sign, council?, date? }
 * Output: { philosopher, reason }
 *
 * Two modes:
 *   1. council provided — pick from user's selected philosophers via date-seed rotation.
 *   2. no council       — use the default 12-philosopher daily rotation (one per sign, shifting daily).
 *
 * Imports only from the registry (single source of truth for philosopher data).
 */

import {
  validatePhilosophers,
  getAllPhilosopherNames,
  lookupPhilosopher,
} from '@/tools/philosopher/registry';
import { isValidSign, VALID_SIGNS } from '@/tools/zodiac/sign-profile';

// ─── Types ──────────────────────────────────────────────────────────────

export interface AssignDailyInput {
  sign: string;
  council?: string[];
  date?: string; // ISO date string, defaults to today
}

export interface AssignDailyOutput {
  philosopher: string;
  reason: string;
}

// ─── Default Rotation ───────────────────────────────────────────────────

/**
 * The canonical 12-philosopher rotation. One per sign slot, shifting daily
 * so every sign sees a different philosopher each day and all 12 are covered.
 *
 * Extracted from horoscope-prompts.ts getPhilosopherAssignment.
 */
const DEFAULT_ROTATION: string[] = [
  'Alan Watts',
  'Marcus Aurelius',
  'Lao Tzu',
  'Seneca',
  'Albert Einstein',
  'Epicurus',
  'Friedrich Nietzsche',
  'Plato',
  'Richard Feynman',
  'Aristotle',
  'Dr. Joe Dispenza',
  'Walter Russell',
];

// ─── Helpers ────────────────────────────────────────────────────────────

function getTodayISO(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Deterministic day number from a date string.
 * Uses UTC epoch days so the result is timezone-stable.
 */
function dayNumber(date: string): number {
  return Math.floor(new Date(date).getTime() / (1000 * 60 * 60 * 24));
}

function signIndex(sign: string): number {
  return (VALID_SIGNS as readonly string[]).indexOf(sign.toLowerCase());
}

// ─── Core Logic ─────────────────────────────────────────────────────────

/**
 * Council mode: pick from the user's selected philosophers using a
 * (sign, date)-seeded rotation so every sign rotates independently.
 *
 * Without the sign term, all 12 signs sharing a council would see the same
 * philosopher on the same day — collapsing the personalization the council
 * is meant to provide.
 */
function assignFromCouncil(
  validCouncil: string[],
  sign: string,
  date: string,
): AssignDailyOutput {
  const dayNum = dayNumber(date);
  const sIdx = Math.max(signIndex(sign), 0);
  const rotationIndex = (dayNum + sIdx) % validCouncil.length;
  const picked = validCouncil[rotationIndex];
  const entry = lookupPhilosopher(picked);
  return {
    philosopher: entry?.name ?? picked,
    reason: `Selected from your personal council (${validCouncil.length} philosopher${validCouncil.length === 1 ? '' : 's'}) — today's rotation lands on ${entry?.name ?? picked}.`,
  };
}

/**
 * Default mode: deterministic 12-philosopher rotation across all signs.
 * Each sign gets a different philosopher, and the assignment shifts daily.
 */
function assignFromDefault(sign: string, date: string): AssignDailyOutput {
  const sIdx = signIndex(sign);
  if (sIdx === -1) {
    // Fallback — should not happen after validation, but be safe
    return {
      philosopher: DEFAULT_ROTATION[0],
      reason: 'Default assignment (sign not found in rotation).',
    };
  }

  const offset = dayNumber(date) % DEFAULT_ROTATION.length;
  const assignedIndex = (sIdx + offset) % DEFAULT_ROTATION.length;
  const name = DEFAULT_ROTATION[assignedIndex];
  const entry = lookupPhilosopher(name);

  return {
    philosopher: name,
    reason: entry
      ? `${entry.name} (${entry.tradition}) — ${entry.description}`
      : `Daily rotation assignment for ${sign}.`,
  };
}

// ─── Public API ─────────────────────────────────────────────────────────

/**
 * philosopher:assign-daily
 *
 * Assign a philosopher for a sign on a given date.
 *
 * @param input.sign        - Zodiac sign (case-insensitive)
 * @param input.council     - Optional user-selected philosophers. If provided and
 *                            at least one is valid, rotation picks from these.
 * @param input.date        - Optional ISO date string. Defaults to today.
 *
 * @returns { philosopher, reason }
 *
 * @throws if sign is invalid
 */
export function assignDaily(input: AssignDailyInput): AssignDailyOutput {
  const sign = input.sign.toLowerCase();
  if (!isValidSign(sign)) {
    throw new Error(
      `Invalid sign: "${input.sign}". Valid signs: ${VALID_SIGNS.join(', ')}`,
    );
  }

  const date = input.date ?? getTodayISO();

  // Council mode — validate names against the registry
  if (input.council && input.council.length > 0) {
    const { valid } = validatePhilosophers(input.council);
    if (valid.length > 0) {
      return assignFromCouncil(valid, sign, date);
    }
    // All council names invalid — fall through to default
  }

  return assignFromDefault(sign, date);
}
