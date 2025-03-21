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
 * Creates a fetch request with proper CORS credentials
 * @param url The URL to fetch
 * @param options Additional fetch options
 * @returns Promise resolving to the fetch Response
 */
async function corsAwareFetch(url: string, options: RequestInit = {}): Promise<Response> {
  console.log(`Making corsAwareFetch request to: ${url}`);
  
  // Ensure URL is correctly formatted
  const normalizedUrl = url.replace(/\/+$/, '');
  
  // For cross-domain requests, we need specific CORS settings
  const corsOptions: RequestInit = {
    ...options,
    // Use 'cors' mode for same-origin or properly configured CORS
    // when dealing with a remote API endpoint
    mode: 'cors',
    // Don't send credentials by default for cross-origin
    credentials: 'same-origin',
    headers: {
      ...options.headers,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  };
  
  // Make the fetch call with appropriate error handling
  try {
    console.log(`Fetch request options:`, {
      url: normalizedUrl,
      method: corsOptions.method || 'GET'
    });
    
    const response = await fetch(normalizedUrl, corsOptions);
    
    // Log detailed response info for debugging
    console.log(`Fetch response for ${normalizedUrl}:`, {
      status: response.status,
      ok: response.ok,
      statusText: response.statusText
    });
    
    if (!response.ok) {
      console.error(`Response not OK (${response.status}): ${response.statusText}`);
    }
    
    return response;
  } catch (error) {
    console.error(`Network error for ${normalizedUrl}:`, error);
    throw error;
  }
}

// Function to fetch a horoscope for a specific sign
async function fetchHoroscope(sign: string, type: string = 'daily'): Promise<HoroscopeData | null> {
  try {
    const baseUrl = getBaseUrl();
    const url = `${baseUrl}/api/horoscope?sign=${sign}&type=${type}`;
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
    if (!horoscopeData.message || horoscopeData.best_match === undefined || !horoscopeData.inspirational_quote || !horoscopeData.quote_author) {
      console.error(`Missing required fields in horoscope data for ${sign}`, horoscopeData);
      return null;
    }
    
    // Normalize data types to ensure consistency
    return {
      ...horoscopeData,
      message: String(horoscopeData.message),
      best_match: String(horoscopeData.best_match),
      inspirational_quote: String(horoscopeData.inspirational_quote),
      quote_author: String(horoscopeData.quote_author),
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