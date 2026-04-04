/**
 * Daily archive utilities.
 * Provides date range generation, validation, and formatting for daily archive pages.
 * Pattern follows src/utils/monthly-content.ts.
 */

/** The first day the daily cron started generating content */
export const ARCHIVE_START_DATE = '2026-04-01';

/**
 * Returns an array of YYYY-MM-DD strings for the last N days, reverse chronological.
 * Does not include today (today's content is served by the main sign page).
 */
export function getArchiveDateRange(days: number): string[] {
  const dates: string[] = [];
  const now = new Date();
  // Use UTC to avoid timezone drift
  const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

  for (let i = 1; i <= days; i++) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    // Don't go before archive start
    if (dateStr < ARCHIVE_START_DATE) break;
    dates.push(dateStr);
  }

  return dates;
}

/**
 * Validates that a date string is a valid archive date:
 * - Matches YYYY-MM-DD format
 * - Not in the future
 * - Not before ARCHIVE_START_DATE
 * - Is an actual valid calendar date
 */
export function isValidArchiveDate(date: string): boolean {
  // Check format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;

  // Check it parses to a real date
  const parsed = new Date(date + 'T00:00:00Z');
  if (isNaN(parsed.getTime())) return false;

  // Verify the parsed date matches the input (catches "2026-02-30" etc.)
  const [year, month, day] = date.split('-').map(Number);
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() + 1 !== month ||
    parsed.getUTCDate() !== day
  ) {
    return false;
  }

  // Not before archive start
  if (date < ARCHIVE_START_DATE) return false;

  // Not in the future
  const now = new Date();
  const todayStr = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
    .toISOString()
    .split('T')[0];
  if (date > todayStr) return false;

  return true;
}

/**
 * Formats a YYYY-MM-DD date string into human-readable format.
 * Example: "2026-04-03" -> "April 3, 2026"
 */
export function formatArchiveDate(date: string): string {
  const parsed = new Date(date + 'T00:00:00Z');
  return parsed.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}
