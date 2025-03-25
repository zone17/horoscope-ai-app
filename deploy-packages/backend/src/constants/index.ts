/**
 * Application constants and feature flags
 */

export const FEATURE_FLAGS = {
  USE_SCHEMA_MARKUP: 'use_schema_markup',
  USE_ENHANCED_SCHEMA_MARKUP: 'use_enhanced_schema_markup',
  USE_LUNAR_CALENDAR_ORDER: 'use_lunar_calendar_order',
  USE_TIMEZONE_AWARE_CONTENT: 'use_timezone_aware_content',
  ENABLE_REDIS_CACHE: 'enable_redis_cache',
  ENABLE_OPENAI_GENERATION: 'enable_openai_generation'
} as const;

export type FeatureFlag = typeof FEATURE_FLAGS[keyof typeof FEATURE_FLAGS];

export const ZODIAC_SIGNS = [
  'Aries',
  'Taurus',
  'Gemini',
  'Cancer',
  'Leo',
  'Virgo',
  'Libra',
  'Scorpio',
  'Sagittarius',
  'Capricorn',
  'Aquarius',
  'Pisces'
] as const;

export type ZodiacSign = typeof ZODIAC_SIGNS[number];

export const ZODIAC_DATE_RANGES = {
  Aries: 'Mar 21 - Apr 19',
  Taurus: 'Apr 20 - May 20',
  Gemini: 'May 21 - Jun 20',
  Cancer: 'Jun 21 - Jul 22',
  Leo: 'Jul 23 - Aug 22',
  Virgo: 'Aug 23 - Sep 22',
  Libra: 'Sep 23 - Oct 22',
  Scorpio: 'Oct 23 - Nov 21',
  Sagittarius: 'Nov 22 - Dec 21',
  Capricorn: 'Dec 22 - Jan 19',
  Aquarius: 'Jan 20 - Feb 18',
  Pisces: 'Feb 19 - Mar 20'
} as const; 