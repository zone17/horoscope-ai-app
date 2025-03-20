'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ZodiacCard } from './ZodiacCard';
import { getHoroscopesForAllSigns } from '@/utils/horoscope-service';
import { Button } from '@/components/ui/button';
import { RefreshCwIcon } from 'lucide-react';

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
  const [horoscopes, setHoroscopes] = useState<Record<string, any>>({});
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  // Staggered animation for the grid items
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  };

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
  }, [retryCount]);

  // Retry loading horoscopes
  const handleRetry = async () => {
    setErrorMessage('');
    setRetryCount(prev => prev + 1);
  };

  return (
    <div className="container mx-auto px-4 pt-24 pb-20">
      {/* Hero section */}
      <section className="relative py-12 mb-16 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-600/3 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-600/3 rounded-full blur-3xl"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-white/3 to-indigo-950/3 backdrop-blur-[1px] mix-blend-overlay pointer-events-none"></div>
        
        <motion.div 
          className="max-w-3xl mx-auto text-center relative z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extralight mb-4 leading-tight tracking-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-200 via-indigo-200 to-indigo-300">
              Cosmic Insights
            </span>
          </h1>
          <p className="text-lg md:text-xl text-indigo-100/80 mb-4 font-extralight tracking-wide max-w-2xl mx-auto">
            Explore your celestial guidance and discover what the cosmos has aligned for you today.
          </p>
          
          <div className="flex justify-center mt-4">
            <motion.div
              className="glassmorphic px-5 py-2 rounded-full"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <span className="text-sm font-extralight text-indigo-100/90 tracking-wider">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </span>
            </motion.div>
          </div>
        </motion.div>
      </section>
      
      {/* Error display */}
      {errorMessage && (
        <motion.div 
          className="glassmorphic p-5 mb-10 max-w-2xl mx-auto text-center rounded-xl"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <p className="text-red-200 mb-3 font-extralight">{errorMessage}</p>
          <Button 
            variant="cosmic"
            onClick={handleRetry}
            className="mx-auto bg-white/5 hover:bg-white/10"
          >
            <RefreshCwIcon className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </motion.div>
      )}
      
      {/* Data refresh indicator */}
      {!errorMessage && !loading && (
        <motion.div
          className="glassmorphic p-2 mb-8 max-w-md mx-auto text-center rounded-full flex items-center justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
        >
          <div className="bg-green-500/20 p-1 rounded-full mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <span className="text-xs font-extralight text-indigo-100/90">
            Data refresh complete! New horoscopes loaded.
          </span>
        </motion.div>
      )}
      
      {/* Zodiac Cards Grid */}
      <motion.div 
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 px-4 md:px-8 pb-16"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {ZODIAC_SIGNS.map((zodiacSign, index) => (
          <motion.div
            key={zodiacSign.sign}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 * index }}
          >
            <ZodiacCard
              sign={zodiacSign.sign}
              symbol={zodiacSign.symbol}
              dateRange={zodiacSign.dateRange}
              element={zodiacSign.element}
              horoscope={horoscopes[zodiacSign.sign] || null}
              isLoading={loading}
            />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
} 