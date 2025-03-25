'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMode } from '@/hooks/useMode';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { capitalize, getColorFromString } from '@/lib/utils';
import { ArrowRightIcon, X, ChevronDown } from 'lucide-react';
import { VideoBanner } from '@/components/VideoBanner';
import { isFeatureEnabled, FEATURE_FLAGS } from '@/utils/feature-flags';

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
  isLoading?: boolean;
}

export function ZodiacCard({ sign, symbol, dateRange, element = 'Fire', horoscope, isLoading }: ZodiacCardProps) {
  const { mode } = useMode();
  const [isHovered, setIsHovered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Format the current date
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
  
  // Card animation variants
  const cardVariants = {
    initial: { 
      y: 20, 
      opacity: 0,
    },
    animate: { 
      y: 0, 
      opacity: 1,
      transition: { 
        type: 'spring',
        stiffness: 260,
        damping: 20 
      }
    },
    exit: {
      scale: 0.8,
      opacity: 0,
      transition: {
        duration: 0.2
      }
    }
  };

  // Expanded card variants
  const expandedCardVariants = {
    initial: {
      scale: 0.8,
      opacity: 0,
    },
    animate: {
      scale: 1,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 25
      }
    },
    exit: {
      scale: 0.8,
      opacity: 0,
      transition: {
        duration: 0.2
      }
    }
  };

  // Glow effect animation variants
  const glowVariants = {
    initial: {
      opacity: 0,
      scale: 0.2,
    },
    animate: {
      opacity: isHovered ? 0.15 : 0,
      scale: isHovered ? 1.1 : 0.2,
      transition: { 
        duration: 0.8,
      }
    }
  };

  // Standardize content processing for all zodiac signs
  const getFirstSentence = (text: string) => {
    if (!text) return '';
    const match = text.match(/^[^.!?]+[.!?]/);
    return match ? match[0].trim() : text.split(' ').slice(0, 15).join(' ') + '...';
  };
  
  // Ensure consistent handling of horoscope data
  const processHoroscopeData = (data: HoroscopeData | null) => {
    if (!data) return null;
    
    return {
      ...data,
      best_match: data.best_match || 'Coming soon',
      inspirational_quote: data.inspirational_quote || 'Coming soon',
      quote_author: data.quote_author || '',
      message: data.message,
    };
  };
  
  // Display loading state if horoscope data is not available or has missing required fields
  if (!horoscope || !horoscope.message) {
    return (
      <motion.div
        variants={cardVariants}
        initial="initial"
        animate="animate"
        className="group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Card className="h-[480px] relative overflow-hidden border border-white/10 rounded-xl backdrop-blur-md bg-white/5">
          <motion.div 
            className="absolute -inset-1 rounded-xl opacity-0 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 blur-xl"
            variants={glowVariants}
            initial="initial"
            animate="animate"
          />
          
          {/* Card video/image container */}
          <div className="relative h-40 overflow-hidden rounded-t-xl">
            <VideoBanner sign={sign} />
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-transparent to-transparent"></div>
          </div>
          
          <CardHeader className="pt-3 pb-1 bg-transparent">
            <div className="flex items-center gap-3">
              <div className="text-2xl text-indigo-200">{symbol}</div>
              <div>
                <h2 className="text-xl font-light text-white capitalize tracking-tight">{capitalize(sign)}</h2>
                <p className="text-indigo-200/70 text-xs font-light tracking-wider">{dateRange} • {element}</p>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pb-0 bg-transparent">
            <div className="space-y-1.5 animate-pulse">
              <div className="bg-indigo-700/10 h-3 rounded w-full"></div>
              <div className="bg-indigo-700/10 h-3 rounded w-full"></div>
              <div className="bg-indigo-700/10 h-3 rounded w-3/4"></div>
            </div>
          </CardContent>
          
          <CardFooter className="pt-3 border-t border-white/5 mt-3 flex-col items-stretch space-y-2 bg-transparent">
            <div className="grid grid-cols-2 gap-3 w-full">
              <div>
                <h3 className="text-xs uppercase mb-1 font-normal tracking-wider text-indigo-100/80">Best Match</h3>
                <div className="h-5 w-20 animate-pulse bg-indigo-800/30 rounded"></div>
              </div>
              <div>
                <h3 className="text-xs uppercase mb-1 font-normal tracking-wider text-indigo-100/80">Quote</h3>
                <div className="flex flex-col">
                  <div className="h-3 w-full animate-pulse bg-indigo-800/30 rounded mb-1"></div>
                  <div className="h-2 w-16 animate-pulse bg-indigo-800/30 rounded"></div>
                </div>
              </div>
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    );
  }

  // Process the horoscope data for consistency
  const processedHoroscope = processHoroscopeData(horoscope) || null;
  
  // Determine what content to show based on mode (day/night)
  const showNightContent = mode === 'night' && processedHoroscope?.peaceful_thought;
  const content = showNightContent ? processedHoroscope.peaceful_thought : processedHoroscope?.message;
  const firstSentence = getFirstSentence(content || '');
  
  // Helper function to properly handle color values
  const getColorForDisplay = (colorValue: string): string => {
    // Handle common color names directly
    const commonColors: Record<string, string> = {
      'red': '#EF4444',
      'blue': '#3B82F6',
      'green': '#22C55E',
      'purple': '#9333EA',
      'pink': '#EC4899',
      'orange': '#F97316',
      'yellow': '#EAB308',
      'indigo': '#6366F1',
      'violet': '#8B5CF6',
      'teal': '#14B8A6',
      'cyan': '#06B6D4',
      'amber': '#F59E0B',
      'emerald': '#10B981',
      'rose': '#E11D48'
    };
    
    // Check if it's a common color name
    const lowerColor = colorValue.toLowerCase();
    if (commonColors[lowerColor]) {
      return commonColors[lowerColor];
    }
    
    // Try to use the color directly if it seems to be a valid color format
    if (lowerColor.startsWith('#') || lowerColor.startsWith('rgb')) {
      return lowerColor;
    }
    
    // For other strings, use the hash function for consistent color mapping
    return getColorFromString(colorValue);
  };
  
  return (
    <>
      <AnimatePresence>
        {!isExpanded && (
          <motion.div
            key="card"
            variants={cardVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="group"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <Card 
              className="h-[480px] relative flex flex-col overflow-hidden border border-white/10 rounded-xl backdrop-blur-md bg-white/5 cursor-pointer transition-all hover:border-white/20 hover:shadow-lg"
              onClick={() => setIsExpanded(true)}
            >
              <motion.div 
                className="absolute -inset-1 rounded-xl opacity-0 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 blur-xl"
                variants={glowVariants}
                initial="initial"
                animate="animate"
              />
              
              {/* Card video/image container - fixed height */}
              <div className="relative h-40 w-full overflow-hidden rounded-t-xl shrink-0">
                <VideoBanner sign={sign} />
                <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-transparent to-transparent"></div>
              </div>
              
              {/* Header - consistent padding */}
              <CardHeader className="p-4 pb-2 bg-transparent shrink-0">
                <div className="flex items-center gap-3">
                  <motion.div 
                    whileHover={{ rotate: [0, -5, 5, -5, 0] }}
                    transition={{ duration: 0.5 }}
                    className="text-2xl text-indigo-100"
                  >
                    {symbol}
                  </motion.div>
                  <div>
                    <h2 className="text-xl font-normal text-white capitalize tracking-tight leading-tight">{capitalize(sign)}</h2>
                    <p className="text-indigo-200/80 text-xs font-light tracking-wide">{dateRange} • {element}</p>
                  </div>
                </div>
              </CardHeader>
              
              {/* Content - with fixed height for consistent card sizing */}
              <CardContent className="p-4 pt-2 pb-0 bg-transparent flex-grow">
                <div className="h-[120px] flex flex-col">
                  <p className="text-white/90 text-[15px] font-normal leading-relaxed tracking-normal text-left mx-auto w-full card-content font-satoshi">
                    {firstSentence}
                  </p>
                  <div className="mt-auto mb-0 flex justify-center">
                    <Button
                      onClick={() => setIsExpanded(true)}
                      className="px-4 py-1.5 text-xs bg-indigo-500/40 hover:bg-indigo-500/60 transition-all duration-300 rounded-full text-white font-medium shadow-sm border border-indigo-400/30"
                      aria-label={`Read full horoscope for ${sign}`}
                    >
                      Read More
                    </Button>
                  </div>
                </div>
              </CardContent>
              
              {/* Footer - consistent positioning */}
              <CardFooter className="p-4 pt-2 border-t border-white/5 mt-auto flex-col items-stretch space-y-3 bg-transparent shrink-0">
                <div className="grid grid-cols-2 gap-3 w-full">
                  <div>
                    <h3 className="text-xs uppercase mb-1 font-normal tracking-wider text-indigo-100/80">Best Match</h3>
                    <p className="font-light text-white text-lg leading-none capitalize">
                      {processedHoroscope?.best_match || 'Coming soon'}
                    </p>
                  </div>
                  {isFeatureEnabled(FEATURE_FLAGS.USE_TIMEZONE_CONTENT, false) && (
                    <div>
                      <h3 className="text-xs uppercase mb-1 font-normal tracking-wider text-indigo-100/80">Quote Author</h3>
                      <p className="font-light text-white text-lg leading-none capitalize">
                        {processedHoroscope?.quote_author || 'Coming soon'}
                      </p>
                    </div>
                  )}
                </div>
              </CardFooter>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expanded Card Modal */}
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
              
              <Card className="w-full h-full max-h-[90vh] overflow-auto border-0 bg-transparent shadow-none">
                {/* Close button */}
                <button 
                  onClick={() => setIsExpanded(false)}
                  className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white/80 hover:text-white transition-all duration-300"
                >
                  <X className="h-5 w-5" />
                </button>
                
                {/* Card video/image container */}
                <div className="relative h-48 sm:h-56 overflow-hidden rounded-t-xl">
                  <VideoBanner sign={sign} />
                </div>
                
                <CardHeader className="pt-6 pb-2 bg-transparent">
                  <div className="flex items-center gap-4">
                    <motion.div 
                      animate={{ rotate: [0, -2, 2, -2, 0] }}
                      transition={{ duration: 5, repeat: Infinity }}
                      className="text-3xl text-indigo-100"
                    >
                      {symbol}
                    </motion.div>
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-normal text-white capitalize tracking-tight leading-tight">{capitalize(sign)}</h2>
                      <p className="text-indigo-200/80 text-sm font-light tracking-wide">{dateRange} • {element}</p>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-4 pb-6 px-6 sm:px-8 bg-transparent">
                  <h3 className="text-sm uppercase tracking-wider text-indigo-200/80 mb-2 font-light">
                    Daily Horoscope <span className="normal-case text-indigo-200/70 text-sm">• {formattedDate}</span>
                  </h3>
                  <p className="text-white/90 text-base font-light leading-relaxed tracking-normal text-left mx-auto mb-6 font-satoshi">
                    {content}
                  </p>
                  
                  {processedHoroscope?.peaceful_thought && (
                    <>
                      <div className="my-4 border-t border-white/10"></div>
                      <h3 className="text-sm uppercase tracking-wider text-indigo-200/80 mb-2 font-light">Nightly Reflection</h3>
                      <p className="text-white/90 text-base italic font-light leading-relaxed tracking-normal text-left mx-auto font-satoshi">
                        "{processedHoroscope.peaceful_thought}"
                      </p>
                    </>
                  )}
                </CardContent>
                
                <CardFooter className="pt-4 border-t border-white/10 flex-col items-stretch space-y-4 bg-transparent px-6 sm:px-8 pb-6">
                  <div className="border-t border-indigo-700/30 pt-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-xs uppercase mb-1 font-normal tracking-wider text-indigo-100/80">Best Match</h3>
                        <p className="font-light text-white text-lg leading-none capitalize">
                          {processedHoroscope?.best_match || 'Coming soon'}
                        </p>
                      </div>
                      {isFeatureEnabled(FEATURE_FLAGS.USE_TIMEZONE_CONTENT, false) && (
                        <div>
                          <h3 className="text-xs uppercase mb-1 font-normal tracking-wider text-indigo-100/80">Quote Author</h3>
                          <p className="font-light text-white text-lg leading-none capitalize">
                            {processedHoroscope?.quote_author || 'Coming soon'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  {isFeatureEnabled(FEATURE_FLAGS.USE_TIMEZONE_CONTENT, false) && (
                    <div>
                      <h3 className="text-xs uppercase mb-1 font-normal tracking-wider text-indigo-100/80">Inspirational Quote</h3>
                      <div className="flex flex-col">
                        <p className="font-light text-white text-sm italic">
                          {processedHoroscope?.inspirational_quote ? 
                           `"${processedHoroscope.inspirational_quote}"` : 
                           'Coming soon'}
                        </p>
                        {processedHoroscope?.quote_author && (
                          <p className="font-light text-indigo-200 text-xs mt-1">
                            - {processedHoroscope.quote_author}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </CardFooter>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
} 