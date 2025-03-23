/**
 * Timezone Utilities
 * 
 * This module provides functions for timezone-aware date handling
 * to support the lazy-loading content generation feature.
 */

/**
 * Get the local date for a given timezone
 * @param timezone - IANA timezone string (e.g., 'America/New_York')
 * @returns Date string in YYYY-MM-DD format for the specified timezone
 */
export function getLocalDateForTimezone(timezone: string): string {
  try {
    // Create a date formatter for the given timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    
    // Format the current date using the timezone
    const formattedDate = formatter.format(new Date());
    
    // Convert from MM/DD/YYYY to YYYY-MM-DD
    const [month, day, year] = formattedDate.split('/');
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error(`Error calculating local date for timezone ${timezone}:`, error);
    // Fall back to UTC date if there's an error
    return new Date().toISOString().split('T')[0];
  }
}

/**
 * Validates if a timezone string is valid
 * @param timezone - IANA timezone string to validate
 * @returns Boolean indicating if the timezone is valid
 */
export function isValidTimezone(timezone: string): boolean {
  try {
    // Attempt to use the timezone in a formatter - will throw if invalid
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Returns a default timezone if the provided one is invalid
 * @param timezone - IANA timezone string to validate
 * @returns Valid timezone string
 */
export function getSafeTimezone(timezone: string): string {
  return isValidTimezone(timezone) ? timezone : 'UTC';
}

/**
 * Get the current hour (0-23) in the specified timezone
 * @param timezone - IANA timezone string
 * @returns Current hour in 24-hour format
 */
export function getCurrentHourInTimezone(timezone: string): number {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: getSafeTimezone(timezone),
      hour: 'numeric',
      hour12: false,
    });
    
    const timeString = formatter.format(new Date());
    return parseInt(timeString, 10);
  } catch (error) {
    console.error(`Error getting current hour for timezone ${timezone}:`, error);
    // Fall back to UTC hour
    return new Date().getUTCHours();
  }
} 