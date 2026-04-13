/**
 * Redis client for caching horoscope data
 */
import { Redis } from '@upstash/redis';

// Initialize the Redis client if credentials are available
const getRedisClient = () => {
  const url = process.env.REDIS_URL;
  const token = process.env.REDIS_TOKEN;

  if (!url || !token) {
    console.warn('Redis credentials not available. Cache operations will be no-ops.');
    return null;
  }

  return new Redis({
    url,
    token,
  });
};

const redisClient = getRedisClient();

/**
 * Get a value from the cache
 * @param key The cache key
 * @returns The cached value or null if not found
 */
export const get = async (key: string): Promise<string | null> => {
  try {
    if (!redisClient) return null;
    return await redisClient.get(key);
  } catch (error) {
    console.error('Redis get error:', error);
    return null;
  }
};

/**
 * Set a value in the cache
 * @param key The cache key
 * @param value The value to cache
 * @param ttl Time to live in seconds
 * @returns True if successful, false otherwise
 */
export const set = async (
  key: string,
  value: string,
  ttl: number
): Promise<boolean> => {
  try {
    if (!redisClient) return false;
    await redisClient.set(key, value, { ex: ttl });
    return true;
  } catch (error) {
    console.error('Redis set error:', error);
    return false;
  }
};

/**
 * Delete a value from the cache
 * @param key The cache key
 * @returns True if successful, false otherwise
 */
export const del = async (key: string): Promise<boolean> => {
  try {
    if (!redisClient) return false;
    await redisClient.del(key);
    return true;
  } catch (error) {
    console.error('Redis delete error:', error);
    return false;
  }
}; 