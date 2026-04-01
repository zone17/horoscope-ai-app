'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ZodiacCard } from './ZodiacCard';
import { SignPicker } from './SignPicker';
import { getHoroscopesForAllSigns } from '@/utils/horoscope-service';
import { Button } from '@/components/ui/button';
import { CheckCircle2, RotateCcw, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useMode } from '@/hooks/useMode';
import { isFeatureEnabled, FEATURE_FLAGS } from '@/utils/feature-flags';
import SchemaMarkup from '@/components/seo/SchemaMarkup';

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
  const { mode, userSign } = useMode();
  const [horoscopes, setHoroscopes] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [refreshed, setRefreshed] = useState(false);
  const userSignRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    async function fetchHoroscopes() {
      try {
        setIsLoading(true);
        const data = await getHoroscopesForAllSigns();
        setHoroscopes(data);
        setIsError(false);
        setRefreshed(true);
        const timer = setTimeout(() => setRefreshed(false), 5000);
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

  useEffect(() => {
    if (!isLoading && userSign && userSignRef.current) {
      setTimeout(() => {
        userSignRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  }, [isLoading, userSign]);

  const orderedSigns = userSign
    ? [
        ...LUNAR_ZODIAC_SIGNS.filter((z) => z.sign === userSign),
        ...LUNAR_ZODIAC_SIGNS.filter((z) => z.sign !== userSign),
      ]
    : LUNAR_ZODIAC_SIGNS;

  return (
    <>
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        {/* Hero section — compact, reading IS the hero (C1) */}
        <div className="relative w-full mb-10 px-4 py-10 flex flex-col items-center justify-center overflow-hidden rounded-2xl bg-black/80">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 mix-blend-overlay z-20"></div>
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent z-20"></div>
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent z-20"></div>

          <h1 className="text-4xl md:text-5xl font-display font-medium text-center bg-clip-text text-transparent bg-gradient-to-b from-purple-200 to-indigo-200 mb-4 relative z-30">
            Your sign is not a prediction.
          </h1>

          <p className="text-center text-white/80 max-w-2xl font-light text-lg mb-4 relative z-30">
            It is a lens. Every morning, a philosopher looks through it — and says the one thing you needed to hear.
          </p>
        </div>

        {/* Return visitor CTA (C2) */}
        {userSign && !isLoading && (
          <div className="flex justify-center mb-8">
            <Link
              href={`/horoscope/${userSign}`}
              className="group inline-flex items-center gap-3 px-6 py-3 rounded-full bg-indigo-500/30 border border-indigo-400/40 hover:bg-indigo-500/50 hover:border-indigo-400/60 transition-all duration-300 text-white font-medium"
            >
              Read your {userSign.charAt(0).toUpperCase() + userSign.slice(1)} reading
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        )}

        {/* Sign Picker */}
        <SignPicker />

        {/* Browse all signs label (C2) */}
        {userSign && !isLoading && !isError && Object.keys(horoscopes).length > 0 && (
          <p className="text-center text-indigo-200/60 text-sm font-light mb-4 mt-2">Browse all signs</p>
        )}

        {refreshed && (
          <div className="fixed bottom-5 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-full text-sm text-white/70 font-normal backdrop-blur-md bg-white/5 border border-white/10 flex items-center gap-2 z-50">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>Content refreshed</span>
          </div>
        )}

        {isLoading && (
          <div className="flex justify-center my-20">
            <div className="w-20 h-20 rounded-full border-t-2 border-b-2 border-purple-300 animate-spin"></div>
          </div>
        )}

        {isError && (
          <div className="max-w-xl mx-auto glassmorphic text-center my-20">
            <p className="text-white/70 mb-4 font-normal">We couldn&apos;t connect to the cosmos right now.</p>
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

        {!isLoading && !isError && Object.keys(horoscopes).length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orderedSigns.map(({ sign, symbol, dateRange, element }) => {
              const isUserSign = userSign === sign;
              return (
                <div
                  key={sign}
                  ref={isUserSign ? userSignRef : null}
                  className={isUserSign ? 'ring-2 ring-indigo-400/50 ring-offset-2 ring-offset-transparent rounded-xl' : ''}
                >
                  <ZodiacCard
                    sign={sign}
                    symbol={symbol}
                    dateRange={dateRange}
                    element={element}
                    horoscope={horoscopes[sign] || null}
                    isLoading={isLoading}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {!isLoading && !isError && Object.keys(horoscopes).length > 0 && (
        <SchemaMarkup zodiacSigns={LUNAR_ZODIAC_SIGNS} horoscopes={horoscopes} />
      )}
    </>
  );
}
