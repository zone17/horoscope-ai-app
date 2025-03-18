/**
 * Feature flag definitions
 */
export const FEATURE_FLAGS = {
  // Whether to use Redis caching for API responses
  USE_REDIS_CACHE: 'USE_REDIS_CACHE',
  // Whether to use Redis for rate limiting
  USE_RATE_LIMITING: 'USE_RATE_LIMITING',
};

/**
 * Simple feature flag implementation that checks environment variables
 * @param flagName - Name of the feature flag to check
 * @param defaultValue - Default value if not explicitly set
 * @returns Whether the feature is enabled
 */
export function isFeatureEnabled(flagName: string, defaultValue = false): boolean {
  // Check for environment variable with the same name as the flag
  const envValue = process.env[`FEATURE_FLAG_${flagName}`];
  
  // If environment variable is set, parse its value
  if (envValue !== undefined) {
    return envValue.toLowerCase() === 'true';
  }
  
  // Otherwise, return default value
  return defaultValue;
} 