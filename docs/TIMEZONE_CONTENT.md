# Timezone-Aware Content Generation

## Overview

The Horoscope AI application incorporates timezone-aware content generation to ensure users receive relevant, fresh content based on their local date rather than the server's UTC date. This document outlines the implementation, benefits, and configuration of this feature.

## Problem Statement

With users accessing the application from diverse global locations, a UTC-based content refreshing strategy can lead to suboptimal user experiences:

- Users in timezones significantly ahead of UTC see "yesterday's" content early in their day
- Users in timezones significantly behind UTC may see the same content when checking both before bed and after waking up
- A single midnight UTC refresh fails to accommodate the natural day cycle differences across the globe

## Solution: On-Demand Batch Generation with Timezone Awareness

The implementation uses an on-demand (lazy) batch generation approach with timezone awareness:

1. **Timezone Detection**: The frontend detects the user's local timezone
2. **Local Date Calculation**: The backend calculates the user's local date based on their timezone
3. **Timezone-Specific Cache Keys**: Cache keys include the user's local date rather than UTC date
4. **Batch On-Demand Generation**: When a cache miss occurs, the system generates content for ALL 12 zodiac signs at once for that local date, not just the requested sign

## Key Optimization: Batch Generation

A critical optimization in our implementation is batch generation of horoscopes:

- When a user requests a horoscope that doesn't exist for their local date
- Instead of generating just that sign, the system generates all 12 zodiac signs
- This significantly reduces API usage by generating all signs in one batch operation
- Subsequent users from the same timezone receive cached content without additional API calls

This optimization ensures:
1. Only the first user from a given timezone-date combination triggers API calls
2. All 12 signs are generated and cached in a single operation
3. Maximum efficiency in terms of API usage and response time for subsequent requests

## Implementation Details

### Cache Key Structure

Traditional approach (UTC-based):
```
horoscope-prod:horoscope:${sign}:${utcDate}:type:daily
```

Timezone-aware approach:
```
horoscope-prod:horoscope:${sign}:${userLocalDate}:type:timezone-daily
```

### API Parameters

The horoscope API endpoint accepts a new optional parameter:
- `timezone`: IANA timezone string (e.g., "America/New_York", "Asia/Tokyo")

Example request:
```
GET /api/horoscope?sign=libra&type=daily&timezone=America/New_York
```

### Batch Generation Process

1. User requests a horoscope for their timezone
2. System checks if content exists for that timezone-date combination
3. If it doesn't exist:
   - Generates horoscopes for ALL 12 zodiac signs for that local date
   - Stores each with appropriate timezone-aware cache keys
   - Returns the requested sign's data
4. If it exists:
   - Returns the cached data without any API calls

### Feature Flag

The feature is controlled by the `USE_TIMEZONE_CONTENT` feature flag, which can be toggled via the `FEATURE_FLAG_USE_TIMEZONE_CONTENT` environment variable.

## Content Elements

Each horoscope generation includes:
- Daily guidance message
- Nighttime reflection
- Inspirational quote from specified philosophers
- Best match data
- Lucky number and color information

## Deployment Considerations

### Frontend Deployment (www.gettodayshoroscope.com)

1. No special deployment steps needed
2. Frontend automatically sends timezone information with API requests

### Backend Deployment (api.gettodayshoroscope.com)

1. Set the feature flag environment variable to enable the feature:
   ```
   FEATURE_FLAG_USE_TIMEZONE_CONTENT=true
   ```

2. Deploy the backend API with updated code

## Resource Implications

### Storage Requirements

- Storage requirements increase based on active user timezone distribution
- With ~40 potential time zones, storage needs could theoretically increase by up to 40x
- In practice, most users fall within 10-15 common time zones, resulting in a more modest increase

### API Usage (OpenAI)

- With batch generation, API calls are significantly optimized
- Only the first user from each timezone-date combination triggers API calls
- Theoretically, a maximum of ~40 batches per day (one per active timezone)
- In practice, only ~10-15 batches per day for common time zones

## Monitoring and Debugging

To monitor the timezone-aware content generation:

1. **Debug Endpoint**: 
   ```
   GET /api/debug/redis
   ```
   Shows all cached horoscopes with their date and whether they used timezone-aware keys

2. **Response Headers**:
   The API response includes:
   ```json
   {
     "success": true,
     "cached": true,
     "batchGenerated": false,
     "timezoneAware": true,
     "timezone": "America/New_York",
     "localDate": "2025-03-23",
     "data": { /* horoscope data */ }
   }
   ```

## Performance Optimizations

1. **Timezone Grouping**: Consider grouping similar timezones in future versions
2. **Pregeneration**: For high-traffic periods, pregenerating content for major timezones
3. **TTL Management**: Adjusting cache TTLs based on usage patterns

## Future Enhancements

Potential future improvements include:

1. **User Preferences**: Allow users to override detected timezone
2. **Analytics Integration**: Track which timezones are most active
3. **Partial Content Updates**: Update only specific content elements rather than full regeneration

## Fallback Behavior

If timezone detection fails or an invalid timezone is provided:
1. The system defaults to "UTC"
2. If the feature flag is disabled, the system falls back to UTC-based dating

---

**Last Updated:** March 23, 2025 