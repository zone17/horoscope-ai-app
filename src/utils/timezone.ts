/**
 * Utilities for handling timezone-specific date operations
 */

/**
 * Get the current date in a specific timezone
 * @param timezone The IANA timezone string (e.g., 'America/New_York')
 * @returns The date in YYYY-MM-DD format for the specified timezone
 */
export const getLocalDate = (timezone: string): string => {
  try {
    const date = new Date();
    const options: Intl.DateTimeFormatOptions = {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    };

    const formatter = new Intl.DateTimeFormat('en-CA', options); // en-CA uses YYYY-MM-DD format
    return formatter.format(date).replace(/\//g, '-');
  } catch (error) {
    console.error(`Error determining date for timezone ${timezone}:`, error);
    // Fall back to UTC
    return new Date().toISOString().split('T')[0];
  }
};

/**
 * Format a date for display according to locale
 * @param date The date object to format
 * @param locale The locale string (e.g., 'en-US')
 * @returns Formatted date string
 */
export const formatDateForDisplay = (
  date: Date,
  locale: string = 'en-US'
): string => {
  try {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    return new Intl.DateTimeFormat(locale, options).format(date);
  } catch (error) {
    console.error(`Error formatting date for locale ${locale}:`, error);
    // Fall back to simple format
    return date.toDateString();
  }
};

/**
 * Determine if a timezone has crossed over to the next day compared to UTC
 * @param timezone The IANA timezone string
 * @returns True if the timezone is on the next day compared to UTC
 */
export const isNextDayFromUTC = (timezone: string): boolean => {
  try {
    const utcDate = new Date().toISOString().split('T')[0];
    const localDate = getLocalDate(timezone);
    return localDate > utcDate;
  } catch (error) {
    console.error(`Error comparing dates for timezone ${timezone}:`, error);
    return false;
  }
}; 