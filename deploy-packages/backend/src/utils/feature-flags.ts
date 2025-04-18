/**
 * Feature flag definitions
 */
export const FEATURE_FLAGS = {
  // Whether to use Redis caching for API responses
  USE_REDIS_CACHE: 'USE_REDIS_CACHE',
  // Whether to use Redis for rate limiting
  USE_RATE_LIMITING: 'USE_RATE_LIMITING',
  // Whether to use timezone-aware content generation
  USE_TIMEZONE_CONTENT: 'USE_TIMEZONE_CONTENT',
  // Whether to order zodiac signs according to lunar calendar
  USE_LUNAR_ZODIAC_ORDER: 'USE_LUNAR_ZODIAC_ORDER',
  // Whether to enable Core Web Vitals optimizations
  USE_CORE_WEB_VITALS_OPT: 'USE_CORE_WEB_VITALS_OPT',
  // Whether to enable enhanced schema markup with additional types
  USE_ENHANCED_SCHEMA_MARKUP: 'USE_ENHANCED_SCHEMA_MARKUP',
};

/**
 * Simple feature flag implementation that checks environment variables
 * @param flagName - Name of the feature flag to check
 * @param defaultValue - Default value if not explicitly set
 * @returns Whether the feature is enabled
 */
export function isFeatureEnabled(flagName: string, defaultValue = false): boolean {
  // For client-side feature flags that need to be accessible in the browser
  if (flagName === FEATURE_FLAGS.USE_LUNAR_ZODIAC_ORDER && typeof window !== 'undefined') {
    // Use NEXT_PUBLIC_ prefix for client-side flags
    const publicEnvValue = process.env[`NEXT_PUBLIC_FEATURE_FLAG_${flagName}`];
      
    if (publicEnvValue !== undefined) {
      return publicEnvValue.toLowerCase() === 'true';
    }
  }
  
  // Standard server-side feature flags
  const envValue = process.env[`FEATURE_FLAG_${flagName}`];
  
  // If environment variable is set, parse its value
  if (envValue !== undefined) {
    return envValue.toLowerCase() === 'true';
  }
  
  // Otherwise, return default value
  return defaultValue;
} 