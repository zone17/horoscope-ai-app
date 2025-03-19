#!/bin/bash

# Script to prepare the codebase for frontend-only build

echo "Preparing codebase for frontend build..."

# Create backups of the original files
cp src/utils/redis.ts src/utils/redis.ts.bak
cp src/utils/redis-helpers.ts src/utils/redis-helpers.ts.bak

# Copy mock Redis implementation to the real location
cp src/utils/redis.mock.ts src/utils/redis.ts

# Create mock redis-helpers implementation
cat > src/utils/redis-helpers.ts << 'EOF'
/**
 * Mock Redis helpers for frontend build
 */

// Mock function that always returns null for cache retrievals
export async function safelyRetrieveForUI<T>(key: string, options = {}): Promise<T | null> {
  return null;
}

// Mock function that always returns true for cache storage
export async function safelyStoreInRedis<T>(key: string, data: T, options = {}): Promise<boolean> {
  return true;
}

// Mock function that always returns true for cache invalidation
export async function invalidateRedisKey(key: string, namespace: string = 'horoscope-prod'): Promise<boolean> {
  return true;
}

// Mock function that always returns false for key checks
export async function checkRedisKey(key: string, namespace: string = 'horoscope-prod'): Promise<boolean> {
  return false;
}
EOF

echo "Mock Redis modules created for frontend build"

# Run the build command
echo "Running Next.js build..."
next build

# Restore original files
mv src/utils/redis.ts.bak src/utils/redis.ts
mv src/utils/redis-helpers.ts.bak src/utils/redis-helpers.ts

echo "Restored original Redis modules" 