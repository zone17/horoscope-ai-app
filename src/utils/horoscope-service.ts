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
  lucky_number: string;
  lucky_color: string;
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
  // Use NEXT_PUBLIC_API_BASE_URL if defined
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }
  
  // Handle Vercel deployments
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
  }
  
  // If running in browser, use window.location.origin
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  
  // Fallback for server-side rendering where we're making absolute URL calls
  return 'http://localhost:3000';
}

// Function to fetch a horoscope for a specific sign
async function fetchHoroscope(sign: string, type: string = 'daily'): Promise<HoroscopeData | null> {
  try {
    const baseUrl = getBaseUrl();
    const url = `${baseUrl}/api/horoscope?sign=${sign}&type=${type}`;
    console.log(`Fetching horoscope from: ${url}`);
    
    // Call the API endpoint to fetch horoscope data with complete URL
    const response = await fetch(url, {
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
    
    return data.data;
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