'use client';

import { useMode } from './ModeProvider';
import { useState } from 'react';
import { VideoBanner } from './VideoBanner';
import { X, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Define the horoscope data interface
interface HoroscopeData {
  sign: string;
  type: string;
  date: string;
  message: string;
  best_match?: string;
  inspirational_quote?: string;
  quote_author?: string;
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
    bestMatchField: horoscope?.best_match ? typeof horoscope.best_match : 'missing',
    inspirationalQuoteField: horoscope?.inspirational_quote ? typeof horoscope.inspirational_quote : 'missing',
    quoteAuthorField: horoscope?.quote_author ? typeof horoscope.quote_author : 'missing',
    fullData: horoscope ? JSON.stringify(horoscope).substring(0, 100) + '...' : 'null'
  });
  
  // Display loading state if horoscope data is not available or has missing required fields
  if (!horoscope || !horoscope.message || !horoscope.best_match || !horoscope.inspirational_quote || !horoscope.quote_author) {
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
                  <h3 className="text-xs text-indigo-300 uppercase mb-1">Best Match</h3>
                  <div className="h-5 bg-indigo-700/50 animate-pulse rounded"></div>
                </div>
                <div>
                  <h3 className="text-xs text-indigo-300 uppercase mb-1">Quote</h3>
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
  const content = showNightContent ? horoscope.peaceful_thought : horoscope.message;
  
  // Get the first sentence for the preview
  const getFirstSentence = (text: string = '') => {
    if (!text) return '';
    const match = text.match(/^[^.!?]+[.!?]/);
    return match ? match[0].trim() : text.substring(0, 150) + '...';
  };
  
  const firstSentence = getFirstSentence(content);
  
  return (
    <>
      <div 
        className="group transform transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer"
        onClick={() => setIsExpanded(true)}
      >
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
            
            <div className="flex-1 overflow-y-auto mb-3 sm:mb-4 pr-1 pb-4">
              <div className="text-white text-xs sm:text-sm">
                {firstSentence}
              </div>
              
              <button 
                className="text-indigo-300 text-xs font-medium mt-2 px-4 py-1 border border-indigo-500/30 rounded-full hover:bg-indigo-500/10 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(true);
                }}
              >
                &lt;&gt; Read More &lt;&gt;
              </button>
            </div>
            
            <div className="mt-auto pt-3 sm:pt-4 border-t border-indigo-700/30">
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <h3 className="text-xs text-indigo-300 uppercase mb-1">Best Match</h3>
                  <p className="font-medium text-white text-base sm:text-lg capitalize">{
                    typeof horoscope.best_match === 'string' 
                      ? horoscope.best_match 
                      : ''
                  }</p>
                </div>
                <div>
                  <h3 className="text-xs text-indigo-300 uppercase mb-1">Quote</h3>
                  <div className="flex flex-col">
                    <p className="font-medium text-white text-xs italic line-clamp-2">{
                      typeof horoscope.inspirational_quote === 'string' 
                        ? `"${horoscope.inspirational_quote}"` 
                        : ''
                    }</p>
                    <p className="text-indigo-200 text-xs mt-0.5">{
                      typeof horoscope.quote_author === 'string' 
                        ? `- ${horoscope.quote_author}` 
                        : ''
                    }</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Expanded Modal */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setIsExpanded(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-indigo-950/90 border border-indigo-500/20 rounded-xl max-w-xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button - more prominent for mobile */}
              <button 
                className="absolute top-3 right-3 z-50 bg-black/40 text-white p-2.5 rounded-full hover:bg-black/60 transition-colors shadow-xl"
                onClick={() => setIsExpanded(false)}
                aria-label="Close details"
              >
                <X size={24} />
              </button>
              
              {/* Mobile swipe indicator */}
              <div className="absolute top-0 left-0 right-0 flex justify-center pt-2 pb-1 z-40 md:hidden">
                <motion.div
                  animate={{ y: [0, -4, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="bg-white/20 h-1 w-16 rounded-full"
                ></motion.div>
              </div>
              
              {/* Mobile close hint text - only on smaller screens */}
              <div className="absolute top-1 left-0 right-0 text-center text-xs text-white/50 z-40 md:hidden">
                <motion.div
                  animate={{ opacity: [0.5, 0.8, 0.5] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  Tap outside or swipe down to close
                </motion.div>
              </div>
              
              {/* Video header */}
              <div className="relative h-48 overflow-hidden">
                <VideoBanner sign={sign} />
                <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-indigo-950/90 to-transparent"></div>
              </div>
              
              {/* Content */}
              <div className="p-5 overflow-y-auto max-h-[60vh]">
                <div className="flex items-center mb-4">
                  <div className="bg-purple-500/30 p-2 rounded-lg shadow-md backdrop-blur-md border border-purple-500/20">
                    <div className="text-2xl">{symbol}</div>
                  </div>
                  <div className="ml-3">
                    <h2 className="text-xl font-bold text-white capitalize">{capitalize(sign)}</h2>
                    <p className="text-indigo-200 text-xs">{dateRange} • {element}</p>
                  </div>
                </div>
                
                <div className="mb-5 text-white text-sm leading-relaxed">
                  {content}
                </div>
                
                <div className="border-t border-indigo-700/30 pt-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-xs text-indigo-300 uppercase mb-1">Best Match</h3>
                      <p className="font-medium text-white text-lg capitalize">{
                        typeof horoscope.best_match === 'string' 
                          ? horoscope.best_match 
                          : ''
                      }</p>
                    </div>
                    <div>
                      <h3 className="text-xs text-indigo-300 uppercase mb-1">Inspirational Quote</h3>
                      <div className="flex flex-col">
                        <p className="font-medium text-white text-sm italic">{
                          typeof horoscope.inspirational_quote === 'string' 
                            ? `"${horoscope.inspirational_quote}"` 
                            : ''
                        }</p>
                        <p className="text-indigo-200 text-xs mt-1">{
                          typeof horoscope.quote_author === 'string' 
                            ? `- ${horoscope.quote_author}` 
                            : ''
                        }</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
