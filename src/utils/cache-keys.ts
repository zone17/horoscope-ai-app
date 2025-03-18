/**
 * Cache key prefixes to avoid collisions between different features
 * Using horoscope-prod as environment identifier
 */
export const CACHE_KEY_PREFIXES = {
  OPENAI_TEST: 'horoscope-prod:openai_test',
  HOROSCOPE: 'horoscope-prod:horoscope',
  USER_PREFERENCES: 'horoscope-prod:user_prefs',
};

/**
 * Generates a cache key with appropriate prefix and parameters
 * @param prefix - The cache key prefix
 * @param params - Object containing parameters to include in the key
 * @returns A cache key string
 */
export function generateCacheKey(prefix: string, params: Record<string, any> = {}): string {
  // Start with the prefix
  let key = prefix;
  
  // Sort parameters by key to ensure consistent order
  const sortedEntries = Object.entries(params).sort(([keyA], [keyB]) => keyA.localeCompare(keyB));
  
  // Add parameters to the key if present
  if (sortedEntries.length > 0) {
    const paramsString = sortedEntries
      .map(([paramKey, paramValue]) => {
        // Convert values to strings, handle arrays and objects
        let stringValue = '';
        
        if (Array.isArray(paramValue)) {
          stringValue = paramValue.join(',');
        } else if (typeof paramValue === 'object' && paramValue !== null) {
          stringValue = JSON.stringify(paramValue);
        } else {
          stringValue = String(paramValue);
        }
        
        return `${paramKey}=${stringValue}`;
      })
      .join('&');
    
    key += `:${paramsString}`;
  }
  
  return key;
}

/**
 * Utility for creating horoscope-related cache keys
 */
export const horoscopeKeys = {
  daily: (sign: string, date: string) => 
    generateCacheKey(CACHE_KEY_PREFIXES.HOROSCOPE, { sign, date, type: 'daily' }),
  weekly: (sign: string) => 
    generateCacheKey(CACHE_KEY_PREFIXES.HOROSCOPE, { sign, type: 'weekly' }),
  monthly: (sign: string) => 
    generateCacheKey(CACHE_KEY_PREFIXES.HOROSCOPE, { sign, type: 'monthly' }),
}; 