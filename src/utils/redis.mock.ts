/**
 * Mock Redis module for frontend builds
 * This prevents Redis dependency errors during frontend builds
 */

export const CACHE_DURATIONS = {
  ONE_MINUTE: 60,
  FIVE_MINUTES: 300,
  TEN_MINUTES: 600,
  FIFTEEN_MINUTES: 900,
  THIRTY_MINUTES: 1800,
  ONE_HOUR: 3600,
  TWO_HOURS: 7200,
  THREE_HOURS: 10800,
  SIX_HOURS: 21600,
  TWELVE_HOURS: 43200,
  ONE_DAY: 86400,
  TWO_DAYS: 172800,
  ONE_WEEK: 604800,
};

// Mock Redis client
export const redis = {
  set: async () => true,
  get: async () => null,
  del: async () => true,
  exists: async () => 0,
  incr: async () => 1,
  expire: async () => true,
};

export default redis; 