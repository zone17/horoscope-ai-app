# Horoscope AI Application Architecture

## Overview

The Horoscope AI Application is a Next.js-based web application that provides AI-generated horoscopes to users. The application follows a subdomain-based architecture with separate frontend and backend deployments, connected through API calls.

## System Architecture

The application is divided into two main deployments:

### Frontend (www.gettodayshoroscope.com)
- NextJS application serving the UI components
- Connects to backend API for data
- Deployed on Vercel

### Backend API (api.gettodayshoroscope.com)
- API server handling data requests and AI integration
- Handles Redis caching and OpenAI interactions
- Manages authentication and rate limiting
- Deployed on Vercel

## Key Components

### 1. Frontend Components

#### UI Components
- Header: Navigation and theme toggle
- ZodiacCard: Display of horoscope data for each sign
- HoroscopeDisplay: Main component for displaying horoscopes

#### State Management
- Client-side caching of API responses
- Theme state management (light/dark mode)
- Loading and error states

### 2. Backend Components

#### API Routes
- `/api/horoscope`: Retrieves horoscope data for specific signs
- `/api/cron/daily-horoscope`: Generates new horoscopes via scheduled job

#### Middleware
- CORS handling
- Rate limiting
- Request logging
- Authentication (where applicable)

#### Services
- OpenAI Integration: Generates horoscope content
- Redis Caching: Stores generated horoscopes

## Data Flow

1. User visits the frontend website
2. Frontend requests horoscope data from backend API
3. API checks Redis cache for existing data
   - If cached data exists, returns it immediately
   - If no cached data, generates new horoscopes via OpenAI
4. Frontend displays the horoscope data to the user
5. Smart polling mechanism checks for and retrieves missing horoscopes

## Smart Polling Logic

The frontend implements a sophisticated polling mechanism to handle potential delays in horoscope generation:

1. Initial load attempts to fetch all horoscopes
2. Missing horoscopes trigger backend generation job
3. Frontend polls for missing data with exponential backoff
4. Configurable retry attempts and timeout durations

```typescript
// Polling implementation in src/utils/horoscope-service.ts
async function pollForMissingHoroscopes(missingSigns: string[]): Promise<Record<string, HoroscopeData | null>> {
  const result: Record<string, HoroscopeData | null> = {};
  const MAX_ATTEMPTS = 10;
  const POLL_INTERVAL = 2000; // 2 seconds between polls
  
  // Implementation details...
  
  while (missingSigns.length > 0 && attempts < MAX_ATTEMPTS) {
    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
    
    // Try to fetch each missing sign
    // If successful, remove from missing signs list
    // Continue until all signs retrieved or max attempts reached
  }
  
  return result;
}
```

## Caching Strategy

The application uses Redis for efficient caching:

1. Horoscopes are cached with configurable TTL (Time To Live)
2. Cache keys are structured by date, sign, and type
3. Cache invalidation occurs on error or manual trigger
4. Separate cache namespaces for different environments

```typescript
// Cache implementation in src/utils/cache.ts
export async function withCache<T>(
  key: string,
  fetchFunction: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  // Check cache first
  const cachedData = await getCachedData<T>(key, namespace);
  
  if (cachedData) {
    return cachedData;
  }
  
  // Get fresh data if cache miss
  const freshData = await fetchFunction();
  await cacheData(key, freshData, { ttl, namespace });
  
  return freshData;
}
```

## Feature Flags

The application implements a feature flag system to enable/disable features without code changes:

```typescript
// Feature flags in src/utils/feature-flags.ts
export const FEATURE_FLAGS = {
  USE_REDIS_CACHE: 'USE_REDIS_CACHE',
  USE_RATE_LIMITING: 'USE_RATE_LIMITING',
};

export function isFeatureEnabled(flagName: string, defaultValue = false): boolean {
  const envValue = process.env[`FEATURE_FLAG_${flagName}`];
  
  if (envValue !== undefined) {
    return envValue.toLowerCase() === 'true';
  }
  
  return defaultValue;
}
```

## UI Design

The frontend uses a modern, glassmorphic design with the following characteristics:

1. Borderless, translucent cards with subtle backdrop blur
2. Light, modern typography with extralight font weights
3. Smooth animations and transitions
4. Responsive layout that adapts to all device sizes
5. Dark/light mode toggle with theme-specific styling

## Security Considerations

1. API rate limiting to prevent abuse
2. CORS configuration to restrict API access
3. Environment variable management for sensitive keys
4. Server-side generation of API calls to OpenAI

## Deployment Model

The application follows a continuous deployment model using Vercel:

1. Code changes trigger automated builds
2. Separate deployment pipelines for frontend and backend
3. Environment-specific configuration via environment variables
4. Custom deployment scripts in the `/scripts` directory

For detailed deployment instructions, see [DEPLOYMENT.md](../DEPLOYMENT.md). 