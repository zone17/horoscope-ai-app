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
    automaticDeserialization: false,
  });
};

// Lazy singleton — only initialized when first accessed, not at module load.
// This prevents crashes in preview deploys, local dev, and CI where
// UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN are not set.
let _redis: Redis | null = null;

export function getRedis(): Redis {
  if (!_redis) {
    _redis = getRedisClient();
  }
  return _redis;
}

// Proxy preserves the `redis` export so all existing consumers
// (`import { redis } from '@/utils/redis'`) continue to work unchanged.
export const redis = new Proxy({} as Redis, {
  get(_, prop) {
    return (getRedis() as any)[prop];
  },
});

// Cache duration constants
export const CACHE_DURATIONS = {
  ONE_MINUTE: 60,
  FIVE_MINUTES: 60 * 5,
  ONE_HOUR: 60 * 60,
  ONE_DAY: 60 * 60 * 24,
  ONE_WEEK: 60 * 60 * 24 * 7,
}; 