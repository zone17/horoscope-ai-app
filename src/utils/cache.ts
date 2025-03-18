import { redis, CACHE_DURATIONS } from './redis';

/**
 * Interface for cache options
 */
interface CacheOptions {
  ttl?: number; // Time to live in seconds
  invalidateOnError?: boolean; // Whether to invalidate cache on error
}

/**
 * Cache API response with the given key
 * @param key - Cache key
 * @param data - Data to cache
 * @param options - Cache options
 */
export async function cacheData<T>(
  key: string,
  data: T,
  options: CacheOptions = {}
): Promise<void> {
  const { ttl = CACHE_DURATIONS.ONE_HOUR } = options;
  
  await redis.set(key, JSON.stringify(data), { ex: ttl });
}

/**
 * Get cached data by key
 * @param key - Cache key
 * @returns Cached data or null if not found
 */
export async function getCachedData<T>(key: string): Promise<T | null> {
  const cachedData = await redis.get<string>(key);
  
  if (!cachedData) {
    return null;
  }
  
  return JSON.parse(cachedData) as T;
}

/**
 * Delete cached data by key
 * @param key - Cache key
 */
export async function invalidateCache(key: string): Promise<void> {
  await redis.del(key);
}

/**
 * Caches the result of an async function using the provided key
 * @param key - Cache key
 * @param fetchFunction - Function to call if cache miss
 * @param options - Cache options
 * @returns The cached or fresh data
 */
export async function withCache<T>(
  key: string,
  fetchFunction: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  const { ttl = CACHE_DURATIONS.ONE_HOUR, invalidateOnError = true } = options;
  
  // Try to get data from cache
  const cachedData = await getCachedData<T>(key);
  
  // Return cached data if it exists
  if (cachedData) {
    return cachedData;
  }
  
  try {
    // Get fresh data
    const freshData = await fetchFunction();
    
    // Cache the fresh data
    await cacheData(key, freshData, { ttl });
    
    return freshData;
  } catch (error) {
    // Invalidate cache on error if specified
    if (invalidateOnError) {
      await invalidateCache(key);
    }
    
    throw error;
  }
} 