import { isFeatureEnabled, FEATURE_FLAGS } from '@/utils/feature-flags';

// Valid zodiac signs
const VALID_SIGNS = [
  'aries', 'taurus', 'gemini', 'cancer', 
  'leo', 'virgo', 'libra', 'scorpio', 
  'sagittarius', 'capricorn', 'aquarius', 'pisces'
];

// Horoscope data interface
interface HoroscopeData {
  sign: string;
  type: string;
  date: string;
  message: string;
  best_match: string;
  inspirational_quote: string;
  quote_author: string;
  peaceful_thought?: string;
  mood?: string;
  compatibility?: string;
  lucky_number?: number;
  lucky_color?: string;
}

interface HoroscopeResponse {
  success: boolean;
  cached: boolean;
  data: HoroscopeData;
}

// Helper function to get base URL for API calls
function getBaseUrl(): string {
  // For production, use the API subdomain explicitly
  if (process.env.NODE_ENV === 'production') {
    return 'https://api.gettodayshoroscope.com';
  }
  
  // Use explicit API URL if configured - highest priority
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // For local development, use localhost without port conflicts
  return 'http://localhost:3000';
}

/**
 * Get the user's timezone
 * @returns The user's timezone string
 */
function getUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    console.error('Error getting user timezone:', error);
    return 'UTC';
  }
}

/**
 * Creates a fetch request with proper CORS credentials
 * @param url The URL to fetch
 * @param options Additional fetch options
 * @returns Promise resolving to the fetch Response
 */
async function corsAwareFetch(url: string, options: RequestInit = {}): Promise<Response> {
  // Check if timezone feature is enabled
  const useTimezoneContent = isFeatureEnabled(FEATURE_FLAGS.USE_TIMEZONE_CONTENT, false);
  
  // Only add timezone if feature is enabled
  if (useTimezoneContent) {
    const timezone = getUserTimezone();
    const urlObj = new URL(url);
    if (!urlObj.searchParams.has('timezone')) {
      urlObj.searchParams.append('timezone', timezone);
    }
    url = urlObj.toString();
  }
  
  // Add CORS headers
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  // Make the request
  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'omit', // Don't send cookies
  });
  
  // Check for errors
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response;
}

// Function to fetch a horoscope for a specific sign
async function fetchHoroscope(sign: string, type: string = 'daily'): Promise<HoroscopeData | null> {
  try {
    const baseUrl = getBaseUrl();
    
    // Build the base URL
    let url = `${baseUrl}/api/horoscope?sign=${sign}&type=${type}`;
    
    // Add timezone parameter only if the feature is enabled
    const useTimezoneContent = isFeatureEnabled(FEATURE_FLAGS.USE_TIMEZONE_CONTENT, false);
    if (useTimezoneContent) {
      const timezone = getUserTimezone();
      url += `&timezone=${encodeURIComponent(timezone)}`;
    }
    
    console.log(`Fetching horoscope from: ${url}`);
    
    // Call the API endpoint with CORS awareness
    const response = await corsAwareFetch(url, {
      cache: 'no-store', // Ensure we always get the latest data
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch horoscope: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`API response for ${sign}:`, {
      success: data.success,
      cached: data.cached,
      timezoneAware: data.timezoneAware,
      timezone: data.timezone,
      hasData: Boolean(data.data),
      dataPreview: data.data ? JSON.stringify(data.data).substring(0, 100) + '...' : 'No data'
    });
    
    if (!data.success || !data.data) {
      console.error(`Error fetching horoscope for ${sign}:`, data);
      return null;
    }
    
    // Make sure the returned data structure matches HoroscopeData interface
    const horoscopeData: HoroscopeData = data.data;
    console.log(`Returning horoscope data for ${sign}:`, {
      type: typeof horoscopeData,
      keys: Object.keys(horoscopeData),
      hasRequiredFields: horoscopeData.message && horoscopeData.best_match && horoscopeData.inspirational_quote && horoscopeData.quote_author
    });
    
    // Ensure all required fields are present and of the right type
    if (!horoscopeData.message) {
      console.error(`Missing required message field in horoscope data for ${sign}`, horoscopeData);
      return null;
    }
    
    // Normalize data types to ensure consistency and map API fields to expected frontend fields
    return {
      ...horoscopeData,
      message: String(horoscopeData.message),
      best_match: horoscopeData.best_match || "None specified",
      inspirational_quote: horoscopeData.inspirational_quote || "",
      quote_author: horoscopeData.quote_author || "Daily Wisdom",
      lucky_number: horoscopeData.lucky_number,
      lucky_color: horoscopeData.lucky_color,
      peaceful_thought: horoscopeData.peaceful_thought ? String(horoscopeData.peaceful_thought) : undefined,
      mood: horoscopeData.mood ? String(horoscopeData.mood) : undefined,
      compatibility: horoscopeData.compatibility ? String(horoscopeData.compatibility) : undefined,
    };
  } catch (error) {
    console.error(`Error fetching horoscope for ${sign}:`, error);
    return null;
  }
}

// Function to generate horoscopes if they don't exist
async function triggerHoroscopeGeneration(): Promise<boolean> {
  try {
    const baseUrl = getBaseUrl();
    console.log('Triggering horoscope generation job...');
    const url = `${baseUrl}/api/cron/daily-horoscope`;
    
    console.log(`Generation endpoint URL: ${url}`);
    
    // Simple fetch without credentials for this endpoint
    const response = await fetch(url, {
      cache: 'no-store',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    console.log(`Generation response status: ${response.status}`);
    
    if (!response.ok) {
      throw new Error(`Failed to trigger horoscope generation: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Generation response data:', data);
    return data.success === true;
  } catch (error) {
    console.error('Error triggering horoscope generation:', error);
    return false;
  }
}

// Function to poll for missing horoscopes with timeout
async function pollForMissingHoroscopes(missingSigns: string[]): Promise<Record<string, HoroscopeData | null>> {
  const result: Record<string, HoroscopeData | null> = {};
  const MAX_ATTEMPTS = 10;
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
        // Remove from missing signs
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

// Function to fetch horoscopes for all zodiac signs
export async function getHoroscopesForAllSigns(): Promise<Record<string, HoroscopeData | null>> {
  const horoscopes: Record<string, HoroscopeData | null> = {};
  
  console.log('Retrieving horoscopes from the database...');
  
  // Fetch horoscopes for all signs from the database only
  await Promise.all(
    VALID_SIGNS.map(async (sign) => {
      try {
        const horoscope = await fetchHoroscope(sign);
        horoscopes[sign] = horoscope;
        
        if (!horoscope) {
          console.warn(`No horoscope data found for ${sign} in the database`);
        }
      } catch (error) {
        console.error(`Error fetching horoscope for ${sign}:`, error);
        horoscopes[sign] = null;
      }
    })
  );
  
  // Log a message indicating which signs have data
  const availableSigns = Object.entries(horoscopes)
    .filter(([_, data]) => data !== null)
    .map(([sign, _]) => sign);
  
  console.log(`Successfully retrieved ${availableSigns.length} horoscopes: ${availableSigns.join(', ')}`);
  
  return horoscopes;
}

// Debug function to test direct API access
export async function testDirectApiAccess(sign: string = 'aries'): Promise<any> {
  try {
    const baseUrl = getBaseUrl();
    const url = `${baseUrl}/api/horoscope?sign=${sign}`;
    console.log(`Testing direct API access at: ${url}`);
    
    const response = await fetch(url, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    console.log(`Direct API response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API error (${response.status}): ${errorText}`);
      return { error: errorText, status: response.status };
    }
    
    const data = await response.json();
    console.log('Direct API response:', data);
    return data;
  } catch (error) {
    console.error('Error in direct API test:', error);
    return { error: String(error) };
  }
} 