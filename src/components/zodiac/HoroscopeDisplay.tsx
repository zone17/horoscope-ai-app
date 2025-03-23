'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ZodiacCard } from './ZodiacCard';
import { getHoroscopesForAllSigns } from '@/utils/horoscope-service';
import { Button } from '@/components/ui/button';
import { RefreshCwIcon } from 'lucide-react';
import { CheckCircle2, RotateCcw } from 'lucide-react';
import { useMode } from '@/hooks/useMode';
import { isFeatureEnabled, FEATURE_FLAGS } from '@/utils/feature-flags';

// Traditional zodiac sign order (solar calendar)
const TRADITIONAL_ZODIAC_SIGNS = [
  { sign: 'capricorn', symbol: '♑', dateRange: 'Dec 22 - Jan 19', element: 'Earth' },
  { sign: 'aquarius', symbol: '♒', dateRange: 'Jan 20 - Feb 18', element: 'Air' },
  { sign: 'pisces', symbol: '♓', dateRange: 'Feb 19 - Mar 20', element: 'Water' },
  { sign: 'aries', symbol: '♈', dateRange: 'Mar 21 - Apr 19', element: 'Fire' },
  { sign: 'taurus', symbol: '♉', dateRange: 'Apr 20 - May 20', element: 'Earth' },
  { sign: 'gemini', symbol: '♊', dateRange: 'May 21 - Jun 20', element: 'Air' },
  { sign: 'cancer', symbol: '♋', dateRange: 'Jun 21 - Jul 22', element: 'Water' },
  { sign: 'leo', symbol: '♌', dateRange: 'Jul 23 - Aug 22', element: 'Fire' },
  { sign: 'virgo', symbol: '♍', dateRange: 'Aug 23 - Sep 22', element: 'Earth' },
  { sign: 'libra', symbol: '♎', dateRange: 'Sep 23 - Oct 22', element: 'Air' },
  { sign: 'scorpio', symbol: '♏', dateRange: 'Oct 23 - Nov 21', element: 'Water' },
  { sign: 'sagittarius', symbol: '♐', dateRange: 'Nov 22 - Dec 21', element: 'Fire' },
];

// Lunar calendar order of zodiac signs
const LUNAR_ZODIAC_SIGNS = [
  { sign: 'aquarius', symbol: '♒', dateRange: 'Jan 20 - Feb 18', element: 'Air' },
  { sign: 'pisces', symbol: '♓', dateRange: 'Feb 19 - Mar 20', element: 'Water' },
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
];

// Directly check for NEXT_PUBLIC environment variable on the client side for this feature
const isLunarOrderEnabled = typeof window !== 'undefined' && 
  (window.ENV_LUNAR_ORDER === 'true' || process.env.NEXT_PUBLIC_FEATURE_FLAG_USE_LUNAR_ZODIAC_ORDER === 'true');

// Determine zodiac sign order based on direct environment check
const useLunarOrder = isLunarOrderEnabled;
// Log for debugging
console.log('Lunar calendar ordering enabled:', useLunarOrder);

const ZODIAC_SIGNS = useLunarOrder 
  ? LUNAR_ZODIAC_SIGNS 
  : TRADITIONAL_ZODIAC_SIGNS;

// Helper functions to get zodiac sign information
function getZodiacSymbol(sign: string): string {
  const zodiacSign = ZODIAC_SIGNS.find(z => z.sign === sign);
  return zodiacSign ? zodiacSign.symbol : '';
}

function getZodiacDateRange(sign: string): string {
  const zodiacSign = ZODIAC_SIGNS.find(z => z.sign === sign);
  return zodiacSign ? zodiacSign.dateRange : '';
}

function getZodiacElement(sign: string): string {
  const zodiacSign = ZODIAC_SIGNS.find(z => z.sign === sign);
  return zodiacSign ? zodiacSign.element : '';
}

export default function HoroscopeDisplay() {
  const { mode } = useMode();
  const [horoscopes, setHoroscopes] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [refreshed, setRefreshed] = useState(false);
  
  // Format today's date
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
  
  // Fetch horoscopes data
  useEffect(() => {
    async function fetchHoroscopes() {
      try {
        setIsLoading(true);
        const data = await getHoroscopesForAllSigns();
        setHoroscopes(data);
        setIsError(false);
        setRefreshed(true);
        
        // Hide the refresh confirmation after 5 seconds
        const timer = setTimeout(() => {
          setRefreshed(false);
        }, 5000);
        return () => clearTimeout(timer);
      } catch (error) {
        console.error('Error fetching horoscopes:', error);
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchHoroscopes();
  }, []);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
      {/* Hero section */}
      <div className="relative w-full mb-16 px-4 py-20 flex flex-col items-center justify-center overflow-hidden rounded-2xl bg-black/80">
        {/* Background video */}
        <div className="absolute inset-0 z-0 overflow-hidden rounded-2xl">
          <video
            className="w-full h-full object-cover opacity-40"
            autoPlay
            muted
            loop
            playsInline
          >
            <source src="/videos/zodiac/space.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-black/50 z-10"></div>
        </div>
        
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 mix-blend-overlay z-20"></div>
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent z-20"></div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent z-20"></div>
        
        <h1 className="text-4xl md:text-5xl font-normal text-center bg-clip-text text-transparent bg-gradient-to-b from-purple-200 to-indigo-200 mb-4 relative z-30">
          Today's Horoscope
        </h1>
        
        <p className="text-center text-white/80 max-w-2xl font-light text-lg mb-8 relative z-30">
          Your celestial guidance for what the cosmos has aligned today
        </p>
      </div>
      
      {/* Refresh notification */}
      {refreshed && (
        <div className="fixed bottom-5 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-full text-sm text-white/70 font-normal backdrop-blur-md bg-white/5 border border-white/10 flex items-center gap-2 z-50">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>Content refreshed</span>
        </div>
      )}
      
      {/* Loading state */}
      {isLoading && (
        <div className="flex justify-center my-20">
          <div className="w-20 h-20 rounded-full border-t-2 border-b-2 border-purple-300 animate-spin"></div>
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="max-w-xl mx-auto glassmorphic text-center my-20">
          <p className="text-white/70 mb-4 font-normal">We couldn't connect to the cosmos right now.</p>
          <Button
            variant="outline"
            className="border-white/10 hover:border-white/20 text-white/80"
            onClick={() => window.location.reload()}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Try again
          </Button>
        </div>
      )}

      {/* Zodiac cards grid */}
      {!isLoading && !isError && Object.keys(horoscopes).length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ZODIAC_SIGNS.map(({ sign, symbol, dateRange, element }) => (
            <ZodiacCard 
              key={sign}
              sign={sign}
              symbol={symbol}
              dateRange={dateRange}
              element={element}
              horoscope={horoscopes[sign] || null}
              isLoading={isLoading}
            />
          ))}
        </div>
      )}
    </div>
  );
} 