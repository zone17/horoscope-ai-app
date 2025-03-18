import { Redis } from '@upstash/redis';

const getRedisClient = () => {
  // Check if Redis URL and token are configured
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    throw new Error('Redis credentials not configured');
  }

  // Create and return Redis client for horoscope-prod-cache
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
    automaticDeserialization: true,
    // Use prefix for keys instead of the name parameter
  });
};

// Create a single Redis client instance
export const redis = getRedisClient();

// Cache duration constants
export const CACHE_DURATIONS = {
  ONE_MINUTE: 60,
  FIVE_MINUTES: 60 * 5,
  ONE_HOUR: 60 * 60,
  ONE_DAY: 60 * 60 * 24,
  ONE_WEEK: 60 * 60 * 24 * 7,
}; 