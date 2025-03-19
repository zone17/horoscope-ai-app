'use client';

import { useState, useEffect } from 'react';
import { ZodiacCard } from './ZodiacCard';
import { getHoroscopesForAllSigns } from '@/utils/horoscope-service';

// Zodiac sign data with symbols, date ranges, and elements
const ZODIAC_SIGNS = [
  { sign: 'aries', symbol: '♈', dateRange: 'Mar 21 - Apr 19', element: 'Fire' },
  { sign: 'taurus', symbol: '♉', dateRange: 'Apr 20 - May 20', element: 'Earth' },
  { sign: 'gemini', symbol: '♊', dateRange: 'May 21 - Jun 20', element: 'Air' },
  { sign: 'cancer', symbol: '♋', dateRange: 'Jun 21 - Jul 22', element: 'Water' },
  { sign: 'leo', symbol: '♌', dateRange: 'Jul 23 - Aug 22', element: 'Fire' },
  { sign: 'virgo', symbol: '♍', dateRange: 'Aug 23 - Sep 22', element: 'Earth' },
  { sign: 'libra', symbol: '♎', dateRange: 'Sep 23 - Oct 22', element: 'Air' },
  { sign: 'scorpio', symbol: '♏', dateRange: 'Oct 23 - Nov 21', element: 'Water' },
  { sign: 'sagittarius', symbol: '♐', dateRange: 'Nov 22 - Dec 21', element: 'Fire' },
  { sign: 'capricorn', symbol: '♑', dateRange: 'Dec 22 - Jan 19', element: 'Earth' },
  { sign: 'aquarius', symbol: '♒', dateRange: 'Jan 20 - Feb 18', element: 'Air' },
  { sign: 'pisces', symbol: '♓', dateRange: 'Feb 19 - Mar 20', element: 'Water' },
];

export function HoroscopeDisplay() {
  const [horoscopes, setHoroscopes] = useState({});
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch horoscopes on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getHoroscopesForAllSigns();
        
        // Debug log the entire data structure
        console.log('Raw horoscope data received:', {
          type: typeof data,
          isArray: Array.isArray(data),
          isObject: typeof data === 'object' && data !== null,
          keys: Object.keys(data),
          samplesign: data['aries'] ? JSON.stringify(data['aries']).substring(0, 100) : 'No aries data'
        });
        
        // Check if all horoscopes failed to load or if data is empty
        const isEmpty = Object.keys(data).length === 0;
        const allFailed = !isEmpty && Object.values(data).every(h => h === null);
        
        if (isEmpty || allFailed) {
          setErrorMessage('Unable to load any horoscopes. Please try again later.');
          console.error(isEmpty ? 'Empty horoscope data' : 'All horoscopes failed to load');
        } else {
          console.log('Horoscope data loaded successfully:', { 
            count: Object.keys(data).length,
            keys: Object.keys(data),
            validData: Object.values(data).filter(Boolean).length 
          });
          
          // Validate data structure for each sign
          Object.entries(data).forEach(([sign, horoscope]) => {
            if (horoscope) {
              // Check for missing required fields
              if (!horoscope.message) {
                console.error(`Missing message field for ${sign}:`, horoscope);
              }
              if (horoscope.lucky_number === undefined) {
                console.error(`Missing lucky_number field for ${sign}:`, horoscope);
              }
              if (!horoscope.lucky_color) {
                console.error(`Missing lucky_color field for ${sign}:`, horoscope);
              }
              
              // Check for incorrect data types
              if (horoscope.message && typeof horoscope.message !== 'string') {
                console.error(`Invalid message data type for ${sign}: expected string, got ${typeof horoscope.message}`);
              }
              if (horoscope.lucky_color && typeof horoscope.lucky_color !== 'string') {
                console.error(`Invalid lucky_color data type for ${sign}: expected string, got ${typeof horoscope.lucky_color}`);
              }
            }
          });
        }
        
        setHoroscopes(data);
      } catch (error) {
        setErrorMessage('An error occurred while loading horoscopes. Please try again later.');
        console.error('Error loading horoscopes:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Retry loading horoscopes
  const handleRetry = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      const data = await getHoroscopesForAllSigns();
      
      // Debug log the entire data structure
      console.log('Retry: Raw horoscope data received:', {
        type: typeof data,
        isArray: Array.isArray(data),
        isObject: typeof data === 'object' && data !== null,
        keys: Object.keys(data),
        samplesign: data['aries'] ? JSON.stringify(data['aries']).substring(0, 100) : 'No aries data'
      });
      
      // Check if all horoscopes failed to load or if data is empty
      const isEmpty = Object.keys(data).length === 0;
      const allFailed = !isEmpty && Object.values(data).every(h => h === null);
      
      if (isEmpty || allFailed) {
        setErrorMessage('Unable to load any horoscopes. Please try again later.');
        console.error(isEmpty ? 'Empty horoscope data' : 'All horoscopes failed to load');
      } else {
        console.log('Horoscope data loaded successfully on retry:', { 
          count: Object.keys(data).length,
          keys: Object.keys(data),
          validData: Object.values(data).filter(Boolean).length 
        });
        
        // Validate data structure for each sign
        Object.entries(data).forEach(([sign, horoscope]) => {
          if (horoscope) {
            // Check for missing required fields
            if (!horoscope.message) {
              console.error(`Missing message field for ${sign}:`, horoscope);
            }
            if (horoscope.lucky_number === undefined) {
              console.error(`Missing lucky_number field for ${sign}:`, horoscope);
            }
            if (!horoscope.lucky_color) {
              console.error(`Missing lucky_color field for ${sign}:`, horoscope);
            }
            
            // Check for incorrect data types
            if (horoscope.message && typeof horoscope.message !== 'string') {
              console.error(`Invalid message data type for ${sign}: expected string, got ${typeof horoscope.message}`);
            }
            if (horoscope.lucky_color && typeof horoscope.lucky_color !== 'string') {
              console.error(`Invalid lucky_color data type for ${sign}: expected string, got ${typeof horoscope.lucky_color}`);
            }
          }
        });
      }
      
      setHoroscopes(data);
    } catch (error) {
      setErrorMessage('An error occurred while loading horoscopes. Please try again later.');
      console.error('Error loading horoscopes:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-3 sm:px-4 md:px-6 py-6 sm:py-8 md:py-10">
      {/* Background glow effects */}
      <div className="fixed top-0 left-0 right-0 bottom-0 pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/4 w-1/3 sm:w-1/2 h-1/3 sm:h-1/2 bg-purple-500/20 rounded-full blur-[80px] sm:blur-[100px]"></div>
        <div className="absolute top-1/3 right-1/4 w-1/4 sm:w-1/3 h-1/4 sm:h-1/3 bg-indigo-600/20 rounded-full blur-[90px] sm:blur-[120px]"></div>
        <div className="absolute bottom-1/4 left-1/3 w-1/4 sm:w-1/3 h-1/4 sm:h-1/3 bg-blue-500/20 rounded-full blur-[90px] sm:blur-[120px]"></div>
      </div>
      
      {/* Loading state */}
      {loading && (
        <div className="text-center py-20 text-white">
          <div className="inline-flex space-x-2 items-center">
            <div className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce"></div>
            <div className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            <span className="ml-2">Loading cosmic insights...</span>
          </div>
        </div>
      )}
      
      {/* Display error message if any */}
      {!loading && errorMessage && (
        <div className="bg-red-500/20 border border-red-500/40 rounded-lg p-4 mb-6 text-white text-center">
          <p>{errorMessage}</p>
          <button 
            onClick={handleRetry}
            className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-md text-sm font-medium transition-colors"
          >
            Retry
          </button>
        </div>
      )}
      
      {/* Display horoscopes */}
      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5 md:gap-6 lg:gap-7 relative z-10">
          {ZODIAC_SIGNS.map(({ sign, symbol, dateRange, element }) => (
            <ZodiacCard
              key={sign}
              sign={sign}
              symbol={symbol}
              dateRange={dateRange}
              element={element}
              horoscope={horoscopes[sign] || null}
            />
          ))}
        </div>
      )}
    </div>
  );
} 