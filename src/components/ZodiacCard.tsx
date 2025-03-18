'use client';

import { useMode } from './ModeProvider';
import { useState } from 'react';
import { VideoBanner } from './VideoBanner';

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
  element?: string;
  horoscope: HoroscopeData | null;
}

export function ZodiacCard({ sign, symbol, dateRange, element = 'Fire', horoscope }: ZodiacCardProps) {
  const { mode } = useMode();
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Functions to capitalize first letter of a string
  const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);
  
  // Display loading state if horoscope data is not available
  if (!horoscope) {
    return (
      <div className="relative rounded-lg overflow-hidden bg-indigo-900/80">
        <VideoBanner sign={sign} />
        <div className="relative z-10 p-6 min-h-[360px] flex flex-col">
          <div className="flex items-center mb-2">
            <div className="bg-purple-500/30 p-2 rounded-lg">
              <div className="text-3xl">{symbol}</div>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white capitalize mb-1">{capitalize(sign)}</h2>
          <p className="text-indigo-200 text-sm mb-6">{dateRange} • {element}</p>
          
          <div className="flex-1 flex flex-col space-y-2 animate-pulse">
            <div className="bg-indigo-700/50 h-4 rounded w-full"></div>
            <div className="bg-indigo-700/50 h-4 rounded w-full"></div>
            <div className="bg-indigo-700/50 h-4 rounded w-3/4"></div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-indigo-800 grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-xs text-indigo-300 uppercase mb-1">Lucky Number</h3>
              <p className="font-medium text-white text-xl">0</p>
            </div>
            <div>
              <h3 className="text-xs text-indigo-300 uppercase mb-1">Lucky Color</h3>
              <div className="flex items-center">
                <span className="inline-block w-4 h-4 rounded-full mr-2 bg-indigo-700/50"></span>
                <p className="font-medium text-white">Unknown</p>
              </div>
            </div>
          </div>
          
          <div className="absolute bottom-6 left-0 right-0 text-center text-indigo-300 text-sm">
            Loading insights...
          </div>
        </div>
      </div>
    );
  }

  // Determine what content to show based on mode (day/night)
  const showNightContent = mode === 'night' && horoscope.peaceful_thought;
  
  return (
    <div className="relative rounded-lg overflow-hidden bg-indigo-900/80">
      <VideoBanner sign={sign} />
      <div className="relative z-10 p-6 min-h-[360px] flex flex-col">
        <div className="flex items-center mb-2">
          <div className="bg-purple-500/30 p-2 rounded-lg">
            <div className="text-3xl">{symbol}</div>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-white capitalize mb-1">{capitalize(sign)}</h2>
        <p className="text-indigo-200 text-sm mb-6">{dateRange} • {element}</p>
        
        {showNightContent ? (
          <div className="flex-1">
            <div className={`${isExpanded ? '' : 'line-clamp-4'} text-white`}>
              {horoscope.peaceful_thought}
            </div>
            
            {horoscope.peaceful_thought && horoscope.peaceful_thought.length > 150 && (
              <button 
                className="text-indigo-300 text-sm font-medium mt-2 hover:text-indigo-100 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? 'Read less' : 'Read more'}
              </button>
            )}
          </div>
        ) : (
          <div className="flex-1">
            <div className={`${isExpanded ? '' : 'line-clamp-4'} text-white`}>
              {horoscope.message}
            </div>
            
            {horoscope.message && horoscope.message.length > 150 && (
              <button 
                className="text-indigo-300 text-sm font-medium mt-2 hover:text-indigo-100 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? 'Read less' : 'Read more'}
              </button>
            )}
          </div>
        )}
        
        <div className="mt-6 pt-4 border-t border-indigo-800 grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-xs text-indigo-300 uppercase mb-1">Lucky Number</h3>
            <p className="font-medium text-white text-xl">{horoscope.lucky_number}</p>
          </div>
          <div>
            <h3 className="text-xs text-indigo-300 uppercase mb-1">Lucky Color</h3>
            <div className="flex items-center">
              <span 
                className="inline-block w-4 h-4 rounded-full mr-2"
                style={{ backgroundColor: horoscope.lucky_color.toLowerCase().replace(/\s+/g, '') }}
              ></span>
              <p className="font-medium text-white">{horoscope.lucky_color}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 