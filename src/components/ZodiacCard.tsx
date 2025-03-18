'use client';

import { useMode } from './ModeProvider';
import { useState } from 'react';

// Define the horoscope data interface
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

interface ZodiacCardProps {
  sign: string;
  symbol: string;
  dateRange: string;
  horoscope: HoroscopeData | null;
}

export function ZodiacCard({ sign, symbol, dateRange, horoscope }: ZodiacCardProps) {
  const { mode } = useMode();
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Functions to capitalize first letter of a string
  const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

  // Display loading state if horoscope data is not available
  if (!horoscope) {
    return (
      <div className="relative rounded-xl overflow-hidden group">
        <div className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 p-6 sm:p-8 rounded-xl h-full flex flex-col items-center justify-center min-h-[360px] animate-pulse">
          <div className="text-4xl sm:text-5xl mb-4">{symbol}</div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-200 capitalize mb-2">{capitalize(sign)}</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">{dateRange}</p>
          <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="w-2/3 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <p className="mt-6 text-sm text-indigo-600 dark:text-indigo-400 font-medium">Loading cosmic insights...</p>
        </div>
      </div>
    );
  }

  // Determine what content to show based on mode (day/night)
  const showNightContent = mode === 'night' && horoscope.peaceful_thought;
  
  return (
    <div className="relative rounded-xl overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 dark:from-indigo-600/10 dark:to-purple-600/10 transform -translate-y-0 group-hover:-translate-y-2 opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
      <div className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 p-6 sm:p-8 rounded-xl h-full flex flex-col relative z-10 transform transition-transform duration-300 group-hover:translate-y-1">
        <div className="text-4xl sm:text-5xl mb-4">{symbol}</div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-200 capitalize mb-2">{capitalize(sign)}</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">{dateRange}</p>
        
        {showNightContent ? (
          <div className="flex-1">
            <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-3">Peaceful Nighttime Thought</h3>
            <p className="text-gray-700 dark:text-gray-300 text-sm sm:text-base">
              {horoscope.peaceful_thought}
            </p>
          </div>
        ) : (
          <div className="flex-1">
            <div className={`${isExpanded ? '' : 'line-clamp-4'} text-gray-700 dark:text-gray-300 text-sm sm:text-base`}>
              {horoscope.message}
            </div>
            
            {horoscope.message && horoscope.message.length > 150 && (
              <button 
                className="text-indigo-600 dark:text-indigo-400 text-sm font-medium mt-2 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? 'Read less' : 'Read more'}
              </button>
            )}
          </div>
        )}
        
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-xs text-gray-500 dark:text-gray-400 uppercase mb-1">Lucky Number</h3>
            <p className="font-medium text-gray-800 dark:text-gray-200">{horoscope.lucky_number}</p>
          </div>
          <div>
            <h3 className="text-xs text-gray-500 dark:text-gray-400 uppercase mb-1">Lucky Color</h3>
            <div className="flex items-center">
              <span 
                className="inline-block w-4 h-4 rounded-full mr-2"
                style={{ backgroundColor: horoscope.lucky_color.toLowerCase().replace(/\s+/g, '') }}
              ></span>
              <p className="font-medium text-gray-800 dark:text-gray-200">{horoscope.lucky_color}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 