# Smart Polling Implementation Guide

## Overview

The Horoscope AI application uses a smart polling system to handle asynchronous horoscope generation. When horoscopes for certain zodiac signs are missing or outdated, the frontend triggers a generation job on the backend and then polls for the results at regular intervals until they are available.

## Key Components

1. **Initial Data Fetch**: Attempt to retrieve all horoscopes for all zodiac signs
2. **Missing Data Detection**: Identify which signs are missing horoscope data
3. **Generation Trigger**: Call the API to generate missing horoscopes
4. **Polling Mechanism**: Continuously check for newly generated data
5. **Timeout and Retry Logic**: Handle scenarios where data isn't available within expected timeframes

## Implementation Details

### Core Function: getHoroscopesForAllSigns

This function orchestrates the entire process of fetching, generating, and polling for horoscope data:

```typescript
export async function getHoroscopesForAllSigns(): Promise<Record<string, HoroscopeData | null>> {
  const horoscopes: Record<string, HoroscopeData | null> = {};
  const missingSigns: string[] = [];
  let generationTriggered = false;
  
  // First, try to fetch horoscopes for all signs
  await Promise.all(
    VALID_SIGNS.map(async (sign) => {
      const horoscope = await fetchHoroscope(sign);
      horoscopes[sign] = horoscope;
      
      if (!horoscope) {
        missingSigns.push(sign);
      }
    })
  );
  
  // If any horoscopes are missing, trigger the generation job ONCE
  if (missingSigns.length > 0 && !generationTriggered) {
    console.log(`Missing horoscopes for: ${missingSigns.join(', ')}. Triggering generation job...`);
    generationTriggered = true;
    const success = await triggerHoroscopeGeneration();
    
    if (success) {
      // Poll for the missing horoscopes
      const polledHoroscopes = await pollForMissingHoroscopes(missingSigns);
      
      // Update the results with any successfully polled horoscopes
      Object.entries(polledHoroscopes).forEach(([sign, data]) => {
        if (data) {
          horoscopes[sign] = data;
        }
      });
    }
  }
  
  return horoscopes;
}
```

### How Polling Works

The polling mechanism is implemented in the `pollForMissingHoroscopes` function:

```typescript
async function pollForMissingHoroscopes(missingSigns: string[]): Promise<Record<string, HoroscopeData | null>> {
  const result: Record<string, HoroscopeData | null> = {};
  const MAX_ATTEMPTS = 10;  // Maximum number of polling attempts
  const POLL_INTERVAL = 2000; // 2 seconds between polls
  let attempts = 0;
  
  // Initialize result with nulls
  missingSigns.forEach(sign => {
    result[sign] = null;
  });
  
  while (missingSigns.length > 0 && attempts < MAX_ATTEMPTS) {
    console.log(`Polling for missing horoscopes. Attempt ${attempts + 1}/${MAX_ATTEMPTS}. Missing: ${missingSigns.join(', ')}`);
    
    // Wait before polling
    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
    
    // Try to fetch each missing sign
    const fetchPromises = missingSigns.map(async (sign) => {
      const horoscope = await fetchHoroscope(sign);
      
      if (horoscope) {
        result[sign] = horoscope;
        // Return the sign to indicate it's been resolved
        return sign;
      }
      
      return null;
    });
    
    const resolvedSigns = (await Promise.all(fetchPromises)).filter(Boolean) as string[];
    
    // Remove successfully fetched signs from missing list
    missingSigns = missingSigns.filter(sign => !resolvedSigns.includes(sign));
    
    attempts++;
  }
  
  if (missingSigns.length > 0) {
    console.warn(`Failed to fetch horoscopes for these signs after ${MAX_ATTEMPTS} attempts: ${missingSigns.join(', ')}`);
  }
  
  return result;
}
```

### Generation Trigger

When missing horoscopes are detected, the system calls a dedicated API endpoint to generate them:

```typescript
async function triggerHoroscopeGeneration(): Promise<boolean> {
  try {
    const baseUrl = getBaseUrl();
    console.log('Triggering horoscope generation job...');
    const response = await fetch(`${baseUrl}/api/cron/daily-horoscope`, {
      cache: 'no-store',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to trigger horoscope generation: ${response.status}`);
    }
    
    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error('Error triggering horoscope generation:', error);
    return false;
  }
}
```

## Configuration Options

The polling system can be configured by adjusting these constants:

- `MAX_ATTEMPTS`: Maximum number of times to poll for missing data (default: 10)
- `POLL_INTERVAL`: Milliseconds to wait between polling attempts (default: 2000)

These values can be adjusted based on your expected backend response times. For AI-generated content that may take longer to process, consider increasing both values.

## Error Handling

The polling system incorporates several error handling mechanisms:

1. **Log Warnings**: All polling attempts are logged for debugging
2. **Graceful Degradation**: If some signs can't be fetched, it returns what it can
3. **Timeout Protection**: Maximum attempts prevent infinite polling
4. **Error Reporting**: Failed attempts are reported with detailed information

## Integration with UI

The frontend UI handles the polling process by:

1. Showing loading states while data is being fetched
2. Displaying partial results as they become available
3. Providing error messages for signs that couldn't be retrieved
4. Allowing users to manually trigger a retry

## Performance Considerations

For optimal performance:

1. Keep `POLL_INTERVAL` reasonably high (2000ms minimum) to avoid overwhelming the backend
2. Consider implementing exponential backoff for repeated failures
3. Add jitter to polling intervals if multiple clients might poll simultaneously
4. Cache successful results on the client side to avoid unnecessary API calls

## Extending the Polling System

This smart polling system can be extended for other asynchronous data needs:

1. Adapt the functions for different data types
2. Modify timeout values based on expected processing times
3. Add more sophisticated retry strategies
4. Implement websocket notifications to replace polling when data is ready 