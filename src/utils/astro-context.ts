/**
 * Astrological context provider for horoscope prompt enrichment.
 * Provides Mercury retrograde periods, moon phases, and other transit data
 * so prompts can reference real astronomical events.
 */

/**
 * 2026 Mercury retrograde periods.
 * Mercury appears to move backward in its orbit during these windows,
 * traditionally associated with communication/travel disruptions.
 */
const MERCURY_RETROGRADE_2026: Array<{ start: string; end: string; theme: string }> = [
  {
    start: '2026-03-14',
    end: '2026-04-07',
    theme: 'Mercury is retrograde until April 7. Themes of revisiting past decisions are active.',
  },
  {
    start: '2026-07-17',
    end: '2026-08-10',
    theme: 'Mercury is retrograde until August 10. Communication requires extra care — say less, listen more.',
  },
  {
    start: '2026-11-09',
    end: '2026-12-01',
    theme: 'Mercury is retrograde until December 1. Old conversations resurface for a reason.',
  },
];

/**
 * Known new moon dates for 2026 (approximate, UTC).
 * Moon phase cycle is ~29.53 days. We anchor to known new moons
 * and compute the phase from there.
 */
const NEW_MOON_REFERENCE = new Date('2026-01-18T00:00:00Z');
const LUNAR_CYCLE_DAYS = 29.53;

type MoonPhase = 'new moon' | 'waxing' | 'full moon' | 'waning';

/**
 * Calculate the approximate moon phase for a given date.
 * Uses simple date math from a known new moon reference point.
 */
function getMoonPhase(date: Date): { phase: MoonPhase; description: string } {
  const diffMs = date.getTime() - NEW_MOON_REFERENCE.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  const cyclePosition = ((diffDays % LUNAR_CYCLE_DAYS) + LUNAR_CYCLE_DAYS) % LUNAR_CYCLE_DAYS;
  const fraction = cyclePosition / LUNAR_CYCLE_DAYS;

  if (fraction < 0.03 || fraction >= 0.97) {
    return { phase: 'new moon', description: 'The new moon invites quiet beginnings. Plant seeds, not flags.' };
  } else if (fraction < 0.22) {
    return { phase: 'waxing', description: 'The waxing crescent builds momentum. Small efforts compound now.' };
  } else if (fraction < 0.28) {
    return { phase: 'waxing', description: 'The first quarter moon asks for commitment. Half-measures will not hold.' };
  } else if (fraction < 0.47) {
    return { phase: 'waxing', description: 'The waxing gibbous moon refines what you have started. Adjust, do not abandon.' };
  } else if (fraction < 0.53) {
    return { phase: 'full moon', description: 'The full moon illuminates what was hidden. Clarity arrives whether you are ready or not.' };
  } else if (fraction < 0.72) {
    return { phase: 'waning', description: 'The waning gibbous moon calls for gratitude and release. Share what you have learned.' };
  } else if (fraction < 0.78) {
    return { phase: 'waning', description: 'The last quarter moon asks what you can let go of. Lighten the load.' };
  } else {
    return { phase: 'waning', description: 'The waning crescent moon is a time of rest before renewal. Be still.' };
  }
}

/**
 * Get astrological context for a given date.
 * Returns a 1-2 sentence context string for prompt injection, or null if no special context applies.
 *
 * @param date - ISO date string (e.g., '2026-03-31')
 * @returns Context string or null
 */
export function getAstroContext(date: string): string | null {
  const d = new Date(date + 'T12:00:00Z');
  const parts: string[] = [];

  // Check Mercury retrograde
  for (const period of MERCURY_RETROGRADE_2026) {
    const start = new Date(period.start + 'T00:00:00Z');
    const end = new Date(period.end + 'T23:59:59Z');
    if (d >= start && d <= end) {
      parts.push(period.theme);
      break;
    }
  }

  // Get moon phase — only include for notable phases (new and full)
  const moon = getMoonPhase(d);
  if (moon.phase === 'new moon' || moon.phase === 'full moon') {
    parts.push(moon.description);
  }

  return parts.length > 0 ? parts.join(' ') : null;
}
