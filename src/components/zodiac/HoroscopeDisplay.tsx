'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
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

export default function HoroscopeDisplay() {
  const { mode } = useMode();
  const [horoscopes, setHoroscopes] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [refreshed, setRefreshed] = useState(false);
  const [useLunarOrder, setUseLunarOrder] = useState(true); // Force lunar order
  
  // Check feature flag on component mount
  useEffect(() => {
    // Use feature flag to determine ordering instead of hardcoding
    setUseLunarOrder(isFeatureEnabled(FEATURE_FLAGS.USE_LUNAR_ZODIAC_ORDER));
  }, []);

  // Format today's date
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  // Use zodiac signs based on feature flag
  const ZODIAC_SIGNS = useLunarOrder ? LUNAR_ZODIAC_SIGNS : TRADITIONAL_ZODIAC_SIGNS;
  
  // Core Web Vitals optimization - Use memoized helper functions
  const getZodiacSymbol = useCallback((sign: string): string => {
    const zodiacInfo = ZODIAC_SIGNS.find(info => info.sign === sign);
    return zodiacInfo ? zodiacInfo.symbol : '';
  }, [ZODIAC_SIGNS]);
  
  const getZodiacDateRange = useCallback((sign: string): string => {
    const zodiacInfo = ZODIAC_SIGNS.find(info => info.sign === sign);
    return zodiacInfo ? zodiacInfo.dateRange : '';
  }, [ZODIAC_SIGNS]);
  
  const getZodiacElement = useCallback((sign: string): string => {
    const zodiacInfo = ZODIAC_SIGNS.find(info => info.sign === sign);
    return zodiacInfo ? zodiacInfo.element : '';
  }, [ZODIAC_SIGNS]);

  // Core Web Vitals optimization - Memoize fetch function
  const fetchHoroscopes = useCallback(async () => {
    try {
      setIsLoading(true);
      setIsError(false);
      
      // Get horoscopes for all signs
      const response = await getHoroscopesForAllSigns();
      
      if (response && response.horoscopes) {
        setHoroscopes(response.horoscopes);
      } else {
        setIsError(true);
      }
    } catch (error) {
      console.error('Error fetching horoscopes:', error);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load horoscopes on mount
  useEffect(() => {
    fetchHoroscopes();
  }, [fetchHoroscopes]);

  // Handle refresh button click - Core Web Vitals optimization for event handlers
  const handleRefresh = useCallback(async () => {
    await fetchHoroscopes();
    setRefreshed(true);
    setTimeout(() => setRefreshed(false), 2000);
  }, [fetchHoroscopes]);

  // Core Web Vitals optimization - Memoize the zodiac grid
  const zodiacGrid = useMemo(() => {
    // Check if Core Web Vitals optimizations are enabled
    const useOptimizations = isFeatureEnabled(FEATURE_FLAGS.USE_CORE_WEB_VITALS_OPTIMIZATIONS, false);
    
    return (
      <motion.div 
        initial={useOptimizations ? { opacity: 0 } : undefined}
        animate={useOptimizations ? { opacity: 1 } : undefined}
        transition={useOptimizations ? { duration: 0.5 } : undefined}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-4"
      >
        {ZODIAC_SIGNS.map((zodiacInfo, index) => (
          <div 
            key={zodiacInfo.sign}
            className={index === 0 ? 'lcp-target' : ''}
            style={useOptimizations && index === 0 ? { contain: 'layout' } : undefined}
          >
            <ZodiacCard
              sign={zodiacInfo.sign}
              symbol={zodiacInfo.symbol}
              dateRange={zodiacInfo.dateRange}
              element={zodiacInfo.element}
              horoscope={horoscopes[zodiacInfo.sign]}
              isLoading={isLoading}
            />
          </div>
        ))}
      </motion.div>
    );
  }, [ZODIAC_SIGNS, horoscopes, isLoading]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
      {/* Feature flag indicator for debugging */}
      <div className="fixed top-2 right-2 z-50 bg-black/60 text-xs text-white/70 px-2 py-1 rounded">
        Order: {useLunarOrder ? 'Lunar' : 'Traditional'}
      </div>
      
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
        zodiacGrid
      )}
    </div>
  );
} 