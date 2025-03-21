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
  lucky_number: string | number;
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
  
  // Log horoscope data for debugging
  console.log(`ZodiacCard ${sign} rendering:`, { 
    hasData: Boolean(horoscope),
    dataType: horoscope ? typeof horoscope : 'null',
    isObject: horoscope ? typeof horoscope === 'object' : false,
    keys: horoscope ? Object.keys(horoscope) : [],
    messageField: horoscope?.message ? typeof horoscope.message : 'missing',
    luckyNumberField: horoscope?.lucky_number !== undefined ? typeof horoscope.lucky_number : 'missing',
    luckyColorField: horoscope?.lucky_color ? typeof horoscope.lucky_color : 'missing',
    fullData: horoscope ? JSON.stringify(horoscope).substring(0, 100) + '...' : 'null'
  });
  
  // Display loading state if horoscope data is not available or has missing required fields
  if (!horoscope || !horoscope.message || horoscope.lucky_number === undefined || !horoscope.lucky_color) {
    return (
      <div className="group transform transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
        <div className="relative rounded-xl overflow-hidden shadow-xl h-[370px] sm:h-[380px] md:h-[400px] backdrop-blur-md bg-indigo-950/30 border border-indigo-500/20">
          {/* Top section with video projection */}
          <div className="relative h-36 sm:h-40 overflow-hidden">
            <VideoBanner sign={sign} />
            <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-indigo-950/90 to-transparent z-20"></div>
          </div>
          
          {/* Card content */}
          <div className="px-4 sm:px-5 py-3 sm:py-4 relative z-10 flex flex-col h-[calc(100%-9rem)] sm:h-[calc(100%-10rem)]">
            <div className="flex items-center mb-2 sm:mb-3">
              <div className="bg-purple-500/30 p-1.5 sm:p-2 rounded-lg shadow-md backdrop-blur-md border border-purple-500/20">
                <div className="text-xl sm:text-2xl">{symbol}</div>
              </div>
              <div className="ml-2 sm:ml-3">
                <h2 className="text-lg sm:text-xl font-bold text-white capitalize">{capitalize(sign)}</h2>
                <p className="text-indigo-200 text-xs">{dateRange} • {element}</p>
              </div>
            </div>
            
            <div className="flex-1 flex flex-col space-y-2 animate-pulse mb-3 sm:mb-4">
              <div className="bg-indigo-700/50 h-2.5 sm:h-3 rounded w-full"></div>
              <div className="bg-indigo-700/50 h-2.5 sm:h-3 rounded w-full"></div>
              <div className="bg-indigo-700/50 h-2.5 sm:h-3 rounded w-3/4"></div>
            </div>
            
            <div className="mt-auto pt-3 sm:pt-4 border-t border-indigo-700/30">
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <h3 className="text-xs text-indigo-300 uppercase mb-1">Lucky Number</h3>
                  <div className="h-5 bg-indigo-700/50 animate-pulse rounded"></div>
                </div>
                <div>
                  <h3 className="text-xs text-indigo-300 uppercase mb-1">Lucky Color</h3>
                  <div className="flex items-center">
                    <div className="h-3 w-3 rounded-full mr-2 bg-indigo-700/50 animate-pulse"></div>
                    <div className="h-4 w-16 bg-indigo-700/50 animate-pulse rounded"></div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Loading text outside of flex layout */}
            <div className="text-center text-indigo-200 font-medium text-xs sm:text-sm mt-4 pb-1 absolute bottom-1 left-0 right-0">
              Loading insights...
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Determine what content to show based on mode (day/night)
  const showNightContent = mode === 'night' && horoscope.peaceful_thought;
  
  return (
    <div className="group transform transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="relative rounded-xl overflow-hidden shadow-xl h-[370px] sm:h-[380px] md:h-[400px] backdrop-blur-md bg-indigo-950/30 border border-indigo-500/20">
        {/* Top section with video projection */}
        <div className="relative h-36 sm:h-40 overflow-hidden">
          <VideoBanner sign={sign} />
          <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-indigo-950/90 to-transparent z-20"></div>
        </div>
        
        {/* Card content */}
        <div className="px-4 sm:px-5 py-3 sm:py-4 relative z-10 flex flex-col h-[calc(100%-9rem)] sm:h-[calc(100%-10rem)]">
          <div className="flex items-center mb-2 sm:mb-3">
            <div className="bg-purple-500/30 p-1.5 sm:p-2 rounded-lg shadow-md backdrop-blur-md border border-purple-500/20">
              <div className="text-xl sm:text-2xl">{symbol}</div>
            </div>
            <div className="ml-2 sm:ml-3">
              <h2 className="text-lg sm:text-xl font-bold text-white capitalize">{capitalize(sign)}</h2>
              <p className="text-indigo-200 text-xs">{dateRange} • {element}</p>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto mb-3 sm:mb-4 pr-1 pb-8">
            {showNightContent ? (
              <div>
                <div className={`${isExpanded ? '' : 'line-clamp-4 sm:line-clamp-6'} text-white text-xs sm:text-sm`}>
                  {horoscope.peaceful_thought}
                </div>
                
                {horoscope.peaceful_thought && horoscope.peaceful_thought.length > 120 && (
                  <button 
                    className="text-indigo-300 text-xs font-medium mt-1 sm:mt-2 hover:text-indigo-100 transition-colors"
                    onClick={() => setIsExpanded(!isExpanded)}
                  >
                    {isExpanded ? 'Read less' : 'Read more'}
                  </button>
                )}
              </div>
            ) : (
              <div>
                <div className={`${isExpanded ? '' : 'line-clamp-4 sm:line-clamp-6'} text-white text-xs sm:text-sm`}>
                  {horoscope.message}
                </div>
                
                {horoscope.message && horoscope.message.length > 120 && (
                  <button 
                    className="text-indigo-300 text-xs font-medium mt-1 sm:mt-2 hover:text-indigo-100 transition-colors"
                    onClick={() => setIsExpanded(!isExpanded)}
                  >
                    {isExpanded ? 'Read less' : 'Read more'}
                  </button>
                )}
              </div>
            )}
          </div>
          
          <div className="mt-auto pt-3 sm:pt-4 border-t border-indigo-700/30">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div>
                <h3 className="text-xs text-indigo-300 uppercase mb-1">Lucky Number</h3>
                <p className="font-medium text-white text-base sm:text-lg">{String(horoscope.lucky_number)}</p>
              </div>
              <div>
                <h3 className="text-xs text-indigo-300 uppercase mb-1">Lucky Color</h3>
                <div className="flex items-center">
                  <span 
                    className="inline-block w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: typeof horoscope.lucky_color === 'string' 
                      ? horoscope.lucky_color.toLowerCase().replace(/\s+/g, '') 
                      : '' }}
                  ></span>
                  <p className="font-medium text-white">{
                    typeof horoscope.lucky_color === 'string' 
                      ? horoscope.lucky_color 
                      : ''
                  }</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 