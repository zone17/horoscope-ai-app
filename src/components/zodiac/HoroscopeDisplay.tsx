'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ZodiacCard } from './ZodiacCard';
import { getHoroscopesForAllSigns } from '@/utils/horoscope-service';
import { Button } from '@/components/ui/button';
import { CheckCircle2, RotateCcw } from 'lucide-react';
import { useMode } from '@/hooks/useMode';
import SchemaMarkup from '@/components/seo/SchemaMarkup';

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

export default function HoroscopeDisplay() {
  const { mode } = useMode();
  const [horoscopes, setHoroscopes] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [refreshed, setRefreshed] = useState(false);
  // Lunar ordering is the standard — no feature flag needed
  const useLunarOrder = true;

  // Format today's date
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  // Always use lunar zodiac signs for now
  const ZODIAC_SIGNS = LUNAR_ZODIAC_SIGNS;
  
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

  return (
    <>
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        {/* Hero section moved to HeroIntro server component in page.tsx */}
        
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
      
      {/* Add Schema Markup if horoscopes are loaded */}
      {!isLoading && !isError && Object.keys(horoscopes).length > 0 && (
        <SchemaMarkup zodiacSigns={ZODIAC_SIGNS} horoscopes={horoscopes} />
      )}
    </>
  );
} 