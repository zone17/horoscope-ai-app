import { redis, CACHE_DURATIONS } from './redis';

/**
 * Options for storing data in Redis
 */
interface RedisStoreOptions {
  /** Time to live in seconds (default: 1 hour) */
  ttl?: number;
  /** Namespace for the key to avoid collisions */
  namespace?: string;
}

/**
 * Options for retrieving data from Redis
 */
interface RedisRetrieveOptions {
  /** Default value to return if cache miss or parsing error */
  defaultValue?: any;
  /** Whether to log cache misses */
  logMisses?: boolean;
  /** Namespace for the key to avoid collisions */
  namespace?: string;
}

/**
 * Safely stores any data in Redis with proper JSON serialization
 * 
 * @param key - The cache key
 * @param data - Any data to be stored (objects, arrays, primitives)
 * @param options - Storage options
 * @returns Promise resolving to true if stored successfully
 */
export async function safelyStoreInRedis<T>(
  key: string, 
  data: T,
  options: RedisStoreOptions = {}
): Promise<boolean> {
  try {
    // Set default options
    const { 
      ttl = CACHE_DURATIONS.ONE_HOUR,
      namespace = 'horoscope-prod'
    } = options;
    
    // Create namespaced key - don't add namespace prefix if already included
    const namespacedKey = key.startsWith(`${namespace}:`) 
      ? key 
      : `${namespace}:${key}`;
    
    // Handle null/undefined case
    if (data === null || data === undefined) {
      console.warn(`Attempted to store null/undefined for key: ${namespacedKey}`);
      return false;
    }
    
    // Safely stringify data with error handling for circular references
    let stringifiedData: string;
    try {
      // Use a replacer function to handle circular references
      stringifiedData = JSON.stringify(data, (key, value) => {
        // Convert special types that don't serialize well
        if (value instanceof Map) {
          return Object.fromEntries(value);
        }
        if (value instanceof Set) {
          return Array.from(value);
        }
        return value;
      });
      
      // Verify the result is a valid JSON string
      JSON.parse(stringifiedData); // This will throw if the result isn't valid JSON
      
      console.log(`Serialized data (first 100 chars): ${stringifiedData.substring(0, 100)}...`);
    } catch (error) {
      console.error(`JSON serialization error for key ${namespacedKey}:`, error);
      return false;
    }
    
    // Store in Redis (ensuring we're storing a string value)
    await redis.set(namespacedKey, stringifiedData, { ex: ttl });
    console.log(`Successfully stored data with key: ${namespacedKey}`);
    
    return true;
  } catch (error) {
    console.error('Redis storage error:', error);
    return false;
  }
}

/**
 * Safely retrieves and parses data from Redis for UI rendering
 * 
 * @param key - The cache key
 * @param options - Retrieval options
 * @returns Promise resolving to the parsed data or defaultValue if not found
 */
export async function safelyRetrieveForUI<T>(
  key: string,
  options: RedisRetrieveOptions = {}
): Promise<T | null> {
  try {
    // Set default options
    const { 
      defaultValue = null, 
      logMisses = false,
      namespace = 'horoscope-prod'
    } = options;
    
    // Create namespaced key - don't add namespace prefix if already included
    const namespacedKey = key.startsWith(`${namespace}:`) 
      ? key 
      : `${namespace}:${key}`;
    
    console.log(`Retrieving data with key: ${namespacedKey}`);
    
    // Retrieve from Redis
    const cachedData = await redis.get(namespacedKey);
    
    // Handle cache miss
    if (cachedData === null || cachedData === undefined) {
      if (logMisses) {
        console.log(`Cache miss for key: ${namespacedKey}`);
      }
      return defaultValue;
    }
    
    console.log(`Retrieved from Redis - type: ${typeof cachedData}`);
    
    // Now with automaticDeserialization disabled, we should always get string data
    if (typeof cachedData === 'string') {
      // Log the first part of the string data for debugging
      console.log(`Raw cached data (first 100 chars): ${cachedData.substring(0, 100)}...`);
      
      try {
        const parsedData = JSON.parse(cachedData) as T;
        console.log('Successfully parsed cached data');
        return parsedData;
      } catch (error) {
        console.error(`JSON parsing error for key ${namespacedKey}:`, error);
        // If parsing fails, invalidate the cache
        await redis.del(namespacedKey);
        return defaultValue;
      }
    } else {
      // This shouldn't happen with automaticDeserialization disabled
      console.error(`Unexpected data type from Redis: ${typeof cachedData}`, cachedData);
      await redis.del(namespacedKey);
      return defaultValue;
    }
  } catch (error) {
    console.error('Redis retrieval error:', error);
    return options.defaultValue || null;
  }
}

/**
 * Helper to check if Redis has a specific key
 * 
 * @param key - The cache key
 * @param namespace - Optional namespace
 * @returns Promise resolving to true if key exists
 */
export async function checkRedisKey(
  key: string,
  namespace: string = 'horoscope-prod'
): Promise<boolean> {
  try {
    // Don't add namespace prefix if already included
    const namespacedKey = key.startsWith(`${namespace}:`) 
      ? key 
      : `${namespace}:${key}`;
      
    const exists = await redis.exists(namespacedKey);
    return exists === 1;
  } catch (error) {
    console.error('Redis key check error:', error);
    return false;
  }
}

/**
 * Helper to invalidate a Redis key
 * 
 * @param key - The cache key
 * @param namespace - Optional namespace
 * @returns Promise resolving to true if invalidated successfully
 */
export async function invalidateRedisKey(
  key: string,
  namespace: string = 'horoscope-prod'
): Promise<boolean> {
  try {
    // Don't add namespace prefix if already included
    const namespacedKey = key.startsWith(`${namespace}:`) 
      ? key 
      : `${namespace}:${key}`;
      
    await redis.del(namespacedKey);
    console.log(`Invalidated cache key: ${namespacedKey}`);
    return true;
  } catch (error) {
    console.error('Redis invalidation error:', error);
    return false;
  }
} 