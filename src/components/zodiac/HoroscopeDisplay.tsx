'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ZodiacCard } from './ZodiacCard';
import { getHoroscopesForAllSigns } from '@/utils/horoscope-service';
import { Button } from '@/components/ui/button';
import { RefreshCwIcon } from 'lucide-react';
import { CheckCircle2, RotateCcw } from 'lucide-react';
import { useMode } from '@/contexts/ModeContext';
import { useAllHoroscopes } from '@/contexts/AllHoroscopesContext';

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

export default function HoroscopeDisplay() {
  const { mode } = useMode();
  const { data: allHoroscopes, isLoading, isError } = useAllHoroscopes();
  const [refreshed, setRefreshed] = useState(false);
  
  // Format today's date
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
  
  // Calculate next update time (15h from now)
  const nextUpdate = new Date(today.getTime() + 15 * 60 * 60 * 1000);
  const hours = nextUpdate.getHours();
  const minutes = nextUpdate.getMinutes();
  const nextUpdateText = `Next update in ${15}h ${minutes}m`;

  // If data loaded successfully, show a refresh confirmation
  useEffect(() => {
    if (allHoroscopes && !isLoading) {
      setRefreshed(true);
      // Hide the refresh confirmation after 5 seconds
      const timer = setTimeout(() => {
        setRefreshed(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [allHoroscopes, isLoading]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
      {/* Hero section */}
      <div className="relative w-full mb-16 px-4 py-20 flex flex-col items-center justify-center overflow-hidden rounded-2xl bg-black/80">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 mix-blend-overlay"></div>
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
        
        <h1 className="text-4xl md:text-5xl font-light text-center bg-clip-text text-transparent bg-gradient-to-b from-purple-200 to-indigo-200 mb-4">
          Get Today's Horoscope
        </h1>
        
        <p className="text-center text-white/80 max-w-2xl font-extralight text-lg mb-8">
          Your celestial guidance for what the cosmos has aligned today
        </p>
        
        <div className="px-4 py-2 rounded-full glassmorphic inline-flex items-center">
          <time className="text-white/90 font-extralight">{formattedDate}</time>
        </div>
      </div>
      
      {/* Refresh notification */}
      {refreshed && (
        <div className="fixed bottom-5 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-full text-sm text-white/70 font-extralight backdrop-blur-md bg-white/5 border border-white/10 flex items-center gap-2 z-50">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{nextUpdateText}</span>
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
          <p className="text-white/70 mb-4">We couldn't connect to the cosmos right now.</p>
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
      {!isLoading && !isError && allHoroscopes && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(allHoroscopes).map(([sign, horoscope]) => (
            <ZodiacCard 
              key={sign}
              sign={sign as ZodiacSign}
              symbol={getZodiacSymbol(sign as ZodiacSign)}
              dateRange={getZodiacDateRange(sign as ZodiacSign)}
              element={getZodiacElement(sign as ZodiacSign)}
              horoscope={horoscope}
              isLoading={isLoading}
            />
          ))}
        </div>
      )}
    </div>
  );
} 