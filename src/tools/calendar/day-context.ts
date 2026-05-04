/**
 * day:context — Atomic tool
 *
 * Pure deterministic compute of today's day-context: date text, day-of-week
 * (with a short flavor gloss), lunar phase + flavor, season + flavor, and
 * meaningful date markers (new moon, full moon, equinox/solstice, first/last
 * day of month, cross-quarter days).
 *
 * Used by reading:generate to inject "today's context" into the prompt as
 * shaping signal. Per docs/research/2026-04-29-readings-resonance.md §6, the
 * flavor strings are short, energetic, non-mystical glosses. They never
 * appear in the reading prose; the reading should feel shaped by today
 * without naming why.
 *
 * Independently callable: takes explicit date input, no hidden state, no
 * external API calls. Lunar phase is computed astronomically (synodic-month
 * arithmetic from a reference new moon); accuracy is within a few hours of
 * astronomical truth, sufficient for prompt-shaping purposes.
 *
 * Input:  GetDayContextInput
 * Output: DayContext
 */

// ─── Types ──────────────────────────────────────────────────────────────

export interface GetDayContextInput {
  /** Date in YYYY-MM-DD format. Defaults to today (UTC). */
  date?: string;
  /** Hemisphere for season computation. Defaults to 'north'. */
  hemisphere?: 'north' | 'south';
}

export interface DayContext {
  /** Human-readable date e.g. "Friday, May 1, 2026" */
  dateText: string;
  /** Day name e.g. "Friday" */
  dayOfWeek: string;
  /** Short evocative gloss for the day of week (used as prompt flavor, never quoted in prose) */
  dayOfWeekFlavor: string;
  /** Lunar phase name e.g. "waxing crescent" */
  lunarPhase: LunarPhase;
  /** Approximate days since the most recent new moon (0..29) */
  lunarDayCount: number;
  /** Short evocative gloss for the lunar phase */
  lunarFlavor: string;
  /** Season name e.g. "late spring" (combines coarse season with within-season phase) */
  season: string;
  /** Short evocative gloss for the season */
  seasonFlavor: string;
  /** Notable markers, e.g. ["Beltane", "first day of month"]. Empty if none. */
  markers: string[];
}

export type LunarPhase =
  | 'new moon'
  | 'waxing crescent'
  | 'first quarter'
  | 'waxing gibbous'
  | 'full moon'
  | 'waning gibbous'
  | 'last quarter'
  | 'waning crescent';

// ─── Constants ──────────────────────────────────────────────────────────

/**
 * Reference new moon: 2000-01-06 18:14 UTC. Conway's standard reference,
 * used as the epoch for synodic-month arithmetic. This combined with the
 * mean synodic month gives lunar-phase accuracy within ~few hours of
 * astronomical truth — well below the 1-day threshold this tool needs.
 */
const REFERENCE_NEW_MOON_UTC_MS = Date.UTC(2000, 0, 6, 18, 14, 0);
const SYNODIC_MONTH_DAYS = 29.530588853;
const MS_PER_DAY = 86400000;

// ─── Day-of-week flavors ────────────────────────────────────────────────

const DAY_OF_WEEK_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

const DAY_OF_WEEK_FLAVORS: Record<string, string> = {
  Monday: 'the start, fresh edges, the week before it has had time to compress',
  Tuesday: 'early commitment, the day that decides whether the week\'s promise is real',
  Wednesday: 'the hump, the recalibration moment, the day momentum is either earned or absent',
  Thursday: 'the slope down, the work either earned or scrambling, the next-to-last push',
  Friday: 'the closing, what gets shipped before the week ends, the small sovereignty of evening',
  Saturday: 'the gap, the day that is not the week\'s, the unstructured hours',
  Sunday: 'the threshold, before-Monday, the quiet inventory of what next week is asked to become',
};

// ─── Lunar-phase flavors ────────────────────────────────────────────────

const LUNAR_FLAVORS: Record<LunarPhase, string> = {
  'new moon': 'seeds, starts, the dark before commitment',
  'waxing crescent': 'early commitment, fragile beginnings, momentum not yet earned',
  'first quarter': 'the test, friction with the plan, decisions you have to defend',
  'waxing gibbous': 'refinement, the work between commitment and completion, almost there but not',
  'full moon': 'culmination, illumination, what was hidden becomes visible, harvest pressure',
  'waning gibbous': 'release, returning, the first softening of the held thing',
  'last quarter': 'audit, what you keep what you let go, the inventory of the cycle',
  'waning crescent': 'rest, the dark before dark, integration before the next start',
};

// ─── Cross-quarter days and astronomical markers ────────────────────────

interface FixedMarker {
  month: number; // 1-indexed (1 = January)
  day: number;
  name: string;
}

const CROSS_QUARTER_DAYS: FixedMarker[] = [
  { month: 2, day: 1, name: 'Imbolc' },
  { month: 5, day: 1, name: 'Beltane' },
  { month: 8, day: 1, name: 'Lughnasadh' },
  { month: 11, day: 1, name: 'Samhain' },
];

interface ApproxAstroMarker {
  month: number;
  dayRange: [number, number];
  name: string;
}

const ASTRO_MARKERS: ApproxAstroMarker[] = [
  { month: 3, dayRange: [19, 21], name: 'spring equinox' },
  { month: 6, dayRange: [20, 22], name: 'summer solstice' },
  { month: 9, dayRange: [22, 24], name: 'autumn equinox' },
  { month: 12, dayRange: [20, 22], name: 'winter solstice' },
];

// ─── Helpers ────────────────────────────────────────────────────────────

function parseDate(dateInput: string | undefined): Date {
  if (!dateInput) {
    return new Date();
  }
  // Use noon UTC to avoid edge-of-day timezone surprises in lunar arithmetic.
  return new Date(`${dateInput}T12:00:00Z`);
}

function formatDateText(date: Date): string {
  const dayName = DAY_OF_WEEK_NAMES[date.getUTCDay()];
  const monthName = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ][date.getUTCMonth()];
  return `${dayName}, ${monthName} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
}

function computeLunarPhase(date: Date): { phase: LunarPhase; dayCount: number } {
  const elapsedMs = date.getTime() - REFERENCE_NEW_MOON_UTC_MS;
  const elapsedDays = elapsedMs / MS_PER_DAY;
  const lunations = elapsedDays / SYNODIC_MONTH_DAYS;
  // Fractional position within the current synodic month, in [0, 1).
  const frac = ((lunations % 1) + 1) % 1;
  const dayCount = Math.floor(frac * SYNODIC_MONTH_DAYS);

  // 8-phase classification. Boundaries are slightly asymmetric to give
  // the four "named" phases (new, first quarter, full, last quarter) a
  // ~1-day window where they explicitly own that name; the four crescent /
  // gibbous phases own the longer middle ranges.
  let phase: LunarPhase;
  if (frac < 0.0335 || frac >= 0.9665) phase = 'new moon';
  else if (frac < 0.2165) phase = 'waxing crescent';
  else if (frac < 0.2835) phase = 'first quarter';
  else if (frac < 0.4665) phase = 'waxing gibbous';
  else if (frac < 0.5335) phase = 'full moon';
  else if (frac < 0.7165) phase = 'waning gibbous';
  else if (frac < 0.7835) phase = 'last quarter';
  else phase = 'waning crescent';

  return { phase, dayCount };
}

interface SeasonResult {
  season: string;
  flavor: string;
}

function computeSeason(date: Date, hemisphere: 'north' | 'south'): SeasonResult {
  // Day-of-year (1-indexed). Account for leap years implicitly via Date math.
  const startOfYear = Date.UTC(date.getUTCFullYear(), 0, 1);
  const dayOfYear = Math.floor((date.getTime() - startOfYear) / MS_PER_DAY) + 1;

  // Northern-hemisphere season boundaries (approximate).
  // Spring: ~March 20 (DOY ~79) to June 20 (~171)
  // Summer: ~June 21 (~172) to Sep 22 (~265)
  // Autumn: ~Sep 23 (~266) to Dec 20 (~354)
  // Winter: ~Dec 21 (~355) to March 19 (~78)
  let northSeason: 'spring' | 'summer' | 'autumn' | 'winter';
  let withinFrac: number; // 0..1 progress through the season

  if (dayOfYear < 79) {
    northSeason = 'winter';
    withinFrac = (dayOfYear + (365 - 355)) / (365 - 355 + 78); // wrap-around
  } else if (dayOfYear < 172) {
    northSeason = 'spring';
    withinFrac = (dayOfYear - 79) / (172 - 79);
  } else if (dayOfYear < 266) {
    northSeason = 'summer';
    withinFrac = (dayOfYear - 172) / (266 - 172);
  } else if (dayOfYear < 355) {
    northSeason = 'autumn';
    withinFrac = (dayOfYear - 266) / (355 - 266);
  } else {
    northSeason = 'winter';
    withinFrac = (dayOfYear - 355) / (365 - 355 + 78);
  }

  // Southern hemisphere: invert.
  const SEASON_FLIP: Record<string, 'spring' | 'summer' | 'autumn' | 'winter'> = {
    spring: 'autumn', summer: 'winter', autumn: 'spring', winter: 'summer',
  };
  const season = hemisphere === 'south' ? SEASON_FLIP[northSeason] : northSeason;

  // Within-season phase: early / mid / late.
  let phaseLabel: 'early' | 'mid' | 'late';
  if (withinFrac < 0.34) phaseLabel = 'early';
  else if (withinFrac < 0.67) phaseLabel = 'mid';
  else phaseLabel = 'late';

  const seasonName = `${phaseLabel} ${season}`;

  // Flavor map: 12 entries (4 seasons x 3 phases).
  const FLAVOR_MAP: Record<string, string> = {
    'early spring': 'thawing, first green, energy not yet stable',
    'mid spring': 'growth, momentum, things uncoiling',
    'late spring': 'warming, not yet summer, the lean toward the longest day',
    'early summer': 'plenty, expansion, the days at their fullest',
    'mid summer': 'richness, the turning point, light starting to lengthen its shadows',
    'late summer': 'harvest, the first cooling, the year\'s accomplishment beginning to show',
    'early autumn': 'release, color, beauty in the letting go',
    'mid autumn': 'stripping, what stays what does not, clarity through subtraction',
    'late autumn': 'preparation, the dark coming, preserving what matters',
    'early winter': 'stillness, withdrawal, the inward turn',
    'mid winter': 'the deep, the cold work, what only winter teaches',
    'late winter': 'endurance, the long edge, before the thaw',
  };

  return {
    season: seasonName,
    flavor: FLAVOR_MAP[seasonName] ?? '',
  };
}

function detectMarkers(date: Date, lunar: { phase: LunarPhase; dayCount: number }): string[] {
  const markers: string[] = [];
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const lastDayOfMonth = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();

  // Lunar markers within ±1 day of phase boundary
  if (lunar.phase === 'new moon' && lunar.dayCount <= 1) markers.push('new moon');
  if (lunar.phase === 'full moon') markers.push('full moon');

  // Cross-quarter days
  for (const cq of CROSS_QUARTER_DAYS) {
    if (cq.month === month && cq.day === day) markers.push(cq.name);
  }

  // Approximate astronomical markers (equinox / solstice ranges)
  for (const am of ASTRO_MARKERS) {
    if (am.month === month && day >= am.dayRange[0] && day <= am.dayRange[1]) {
      markers.push(am.name);
    }
  }

  // Calendar markers
  if (day === 1) markers.push('first day of month');
  if (day === lastDayOfMonth) markers.push('last day of month');

  return markers;
}

// ─── Public API ─────────────────────────────────────────────────────────

/**
 * Compute today's day-context for the given date.
 *
 * Pure function: same input always yields same output. No I/O. No timezone
 * surprises (date is parsed at noon UTC). Suitable for caching by date alone.
 */
export function getDayContext(input: GetDayContextInput = {}): DayContext {
  const date = parseDate(input.date);
  const hemisphere = input.hemisphere ?? 'north';

  const dayOfWeekName = DAY_OF_WEEK_NAMES[date.getUTCDay()];
  const lunar = computeLunarPhase(date);
  const seasonResult = computeSeason(date, hemisphere);
  const markers = detectMarkers(date, lunar);

  return {
    dateText: formatDateText(date),
    dayOfWeek: dayOfWeekName,
    dayOfWeekFlavor: DAY_OF_WEEK_FLAVORS[dayOfWeekName] ?? '',
    lunarPhase: lunar.phase,
    lunarDayCount: lunar.dayCount,
    lunarFlavor: LUNAR_FLAVORS[lunar.phase],
    season: seasonResult.season,
    seasonFlavor: seasonResult.flavor,
    markers,
  };
}

/**
 * Render a day-context as a prompt-ready text block. Used by reading:generate.
 * Format is short, evocative, never astronomical-jargon-heavy. Markers folded
 * in only when present.
 */
export function renderDayContextForPrompt(ctx: DayContext): string {
  const lines: string[] = [
    `Date: ${ctx.dateText}.`,
    `Day-of-week energy: ${ctx.dayOfWeekFlavor}.`,
    `Lunar phase: ${ctx.lunarPhase} (~day ${ctx.lunarDayCount} of the cycle). ${ctx.lunarFlavor}.`,
    `Season: ${ctx.season}. ${ctx.seasonFlavor}.`,
  ];
  if (ctx.markers.length > 0) {
    lines.push(`Markers today: ${ctx.markers.join(', ')}.`);
  }
  return lines.join('\n');
}
