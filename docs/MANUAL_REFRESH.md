# Manual Horoscope Data Refresh Guide

This document outlines the procedures for manually refreshing horoscope data outside the daily scheduled job. Use these procedures when you need to:

1. Fix incorrect or missing horoscope data
2. Test new horoscope generation parameters
3. Reset cache after making backend changes

## Important Considerations

* Manual refreshes will update the Redis cache for all users immediately
* The refreshed data will remain consistent for all users until the next scheduled refresh
* All fields (including best_match and inspirational_quote) will be properly cached
* Use these methods sparingly, as they consume API tokens and resources

## Available Methods

### Method 1: Using the Cron Job API Endpoint

This is the recommended method as it follows the same procedure as the nightly job.

```bash
# Refresh all zodiac signs
curl -X GET https://api.gettodayshoroscope.com/api/cron/daily-horoscope

# For local development
curl -X GET http://localhost:3000/api/cron/daily-horoscope
```

### Method 2: Using the Debug Regenerate Endpoint

This endpoint provides more detailed feedback about the regeneration process.

```bash
# Refresh all zodiac signs
curl -X POST https://api.gettodayshoroscope.com/api/debug/regenerate-horoscopes

# Refresh a specific sign only
curl -X GET "https://api.gettodayshoroscope.com/api/debug/regenerate-horoscopes?sign=libra"

# For local development
curl -X POST http://localhost:3000/api/debug/regenerate-horoscopes
curl -X GET "http://localhost:3000/api/debug/regenerate-horoscopes?sign=libra"
```

## Verifying Cache Updates

To verify the cache has been properly updated:

1. Check server logs for successful cache operations:
   ```
   Stored data in Redis with key: horoscope-prod:horoscope:aries:daily:2025-03-21, TTL: 86400s
   ```

2. Verify the data in browser:
   * Open your browser and navigate to the horoscope site
   * Ensure best_match and inspirational_quote fields are displayed correctly
   * Check multiple browsers/devices to confirm cache consistency

3. Explicitly verify Redis cache (requires server access):
   ```bash
   # Using redis-cli
   redis-cli -u $UPSTASH_REDIS_REST_URL --tls -a $UPSTASH_REDIS_REST_TOKEN
   
   # Get keys matching pattern
   KEYS horoscope-prod:horoscope:*
   
   # Get specific key data
   GET horoscope-prod:horoscope:libra:daily:2025-03-21
   ```

## Troubleshooting

### Problem: Updates Not Reflected

If updates are not reflected after a manual refresh:

1. **Check for Errors**: Look for error messages in the API response and server logs
2. **Clear Browser Cache**: Have users clear their browser cache
3. **Check TTL**: Verify the Redis key TTL is set correctly to 86400 seconds (1 day)
4. **Verify Key Format**: Ensure the Redis key format is correct: `horoscope-prod:horoscope:sign:daily:YYYY-MM-DD`

### Problem: Inconsistent Data Across Users

If users are seeing different data:

1. **Browser Caching**: Some users might have the page cached in their browser
2. **CDN Caching**: Check if a CDN is caching the API responses
3. **Force Refresh**: Perform another manual refresh with the POST endpoint

## Scheduled Jobs

Remember that the daily cron job will automatically run at midnight UTC each day. Manual refreshes should only be needed in exceptional circumstances.

For questions or issues with the manual refresh process, contact the development team.

## Overview

The application includes dedicated API endpoints that allow for manual regeneration of horoscope data. This is useful in several scenarios:

- Testing new horoscope generation parameters
- Refreshing data after API updates
- Resolving issues with corrupted or missing data
- Immediate content refreshes for marketing or special events

## Best Practices

1. **Rate Limiting**: Avoid excessive refreshes as they consume OpenAI API credits
2. **Timeout Management**: If refreshing all signs, consider using the single sign endpoint in sequence
3. **Cache Monitoring**: After refresh, verify the cache has been correctly updated
4. **Environment Awareness**: Only perform manual refreshes in production when necessary
5. **Logging**: Document when and why manual refreshes were performed

## Programmatic Usage

The frontend can trigger a refresh using the `triggerHoroscopeGeneration()` function in `src/utils/horoscope-service.ts`:

```typescript
// Example usage in a component
import { triggerHoroscopeGeneration } from '@/utils/horoscope-service';

// In a component function
const handleRefresh = async () => {
  const success = await triggerHoroscopeGeneration();
  if (success) {
    // Handle successful refresh
  }
};
```

---

**Last Updated:** March 21, 2025 