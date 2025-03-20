'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useMode } from '@/hooks/useMode';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { capitalize, getColorFromString } from '@/lib/utils';

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
  const [isHovered, setIsHovered] = useState(false);
  
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
    hover: { 
      y: -8, 
      transition: { 
        type: 'spring', 
        stiffness: 400, 
        damping: 17 
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
  
  // Display loading state if horoscope data is not available or has missing required fields
  if (!horoscope || !horoscope.message || horoscope.lucky_number === undefined || !horoscope.lucky_color) {
    return (
      <motion.div
        variants={cardVariants}
        initial="initial"
        animate="animate"
        whileHover="hover"
        className="group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Card className="h-[400px] relative overflow-hidden backdrop-blur-md bg-black/30 border border-indigo-500/20">
          <motion.div 
            className="absolute -inset-1 rounded-xl opacity-0 bg-gradient-to-r from-purple-600 to-indigo-600 blur-xl z-0"
            variants={glowVariants}
            initial="initial"
            animate="animate"
          />
          
          {/* Card video/image container */}
          <div className="relative h-40 overflow-hidden rounded-t-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-700 to-indigo-900">
              <div className="absolute inset-0 opacity-30 mix-blend-overlay bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-500/40 via-transparent to-transparent"></div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black/80 to-transparent z-10"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-4xl">{symbol}</div>
          </div>
          
          <CardHeader className="pt-4 pb-2">
            <div className="flex items-center gap-2">
              <div className="bg-purple-500/30 p-2 rounded-lg shadow-md backdrop-blur-md border border-purple-500/20">
                <div className="text-xl">{symbol}</div>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white capitalize">{capitalize(sign)}</h2>
                <p className="text-indigo-200 text-xs">{dateRange} • {element}</p>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="flex flex-col space-y-2 animate-pulse">
              <div className="bg-indigo-700/50 h-3 rounded w-full"></div>
              <div className="bg-indigo-700/50 h-3 rounded w-full"></div>
              <div className="bg-indigo-700/50 h-3 rounded w-3/4"></div>
            </div>
          </CardContent>
          
          <CardFooter className="pt-4 border-t border-indigo-700/30 flex flex-col space-y-4">
            <div className="grid grid-cols-2 gap-4 w-full">
              <div>
                <h3 className="text-xs text-indigo-300 uppercase mb-1">Lucky Number</h3>
                <motion.p 
                  className="font-medium text-white text-lg"
                  animate={{ opacity: [0.4, 0.8, 0.4] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >?</motion.p>
              </div>
              <div>
                <h3 className="text-xs text-indigo-300 uppercase mb-1">Lucky Color</h3>
                <div className="flex items-center">
                  <motion.span 
                    className="inline-block w-4 h-4 rounded-full mr-2 bg-indigo-700/50"
                    animate={{ opacity: [0.4, 0.8, 0.4] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  ></motion.span>
                  <motion.p 
                    className="font-medium text-white"
                    animate={{ opacity: [0.4, 0.8, 0.4] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  >Loading...</motion.p>
                </div>
              </div>
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    );
  }

  // Determine what content to show based on mode (day/night)
  const showNightContent = mode === 'night' && horoscope.peaceful_thought;
  const content = showNightContent ? horoscope.peaceful_thought : horoscope.message;
  
  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
      className="group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Card className="h-[400px] relative overflow-hidden backdrop-blur-md bg-black/30 border border-indigo-500/20">
        <motion.div 
          className="absolute -inset-1 rounded-xl opacity-0 bg-gradient-to-r from-purple-600 to-indigo-600 blur-xl z-0"
          variants={glowVariants}
          initial="initial"
          animate="animate"
        />
        
        {/* Card video/image container */}
        <div className="relative h-40 overflow-hidden rounded-t-xl">
          <video 
            className="w-full h-full object-cover brightness-110 contrast-125"
            loop
            muted
            playsInline
            autoPlay
          >
            <source src={`/videos/zodiac/${sign}.mp4`} type="video/mp4" />
          </video>
          
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 to-indigo-900/30 mix-blend-overlay"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-transparent to-black/40"></div>
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black/80 to-transparent z-10"></div>
        </div>
        
        <CardHeader className="pt-4 pb-2">
          <div className="flex items-center gap-2">
            <motion.div 
              whileHover={{ rotate: [0, -5, 5, -5, 0] }}
              transition={{ duration: 0.5 }}
              className="bg-purple-500/30 p-2 rounded-lg shadow-md backdrop-blur-md border border-purple-500/20"
            >
              <div className="text-xl">{symbol}</div>
            </motion.div>
            <div>
              <h2 className="text-xl font-bold text-white capitalize">{capitalize(sign)}</h2>
              <p className="text-indigo-200 text-xs">{dateRange} • {element}</p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="h-[120px] overflow-y-auto pr-1 custom-scrollbar">
          <div className={isExpanded ? '' : 'line-clamp-4'}>
            <p className="text-white text-sm">{content}</p>
          </div>
          
          {content && content.length > 120 && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-2 text-indigo-300 hover:text-indigo-100 px-2 py-1 h-auto text-xs"
            >
              {isExpanded ? 'Read less' : 'Read more'}
            </Button>
          )}
        </CardContent>
        
        <CardFooter className="pt-4 border-t border-indigo-700/30 mt-auto">
          <div className="grid grid-cols-2 gap-4 w-full">
            <div>
              <h3 className="text-xs text-indigo-300 uppercase mb-1">Lucky Number</h3>
              <p className="font-medium text-white text-lg">{String(horoscope.lucky_number)}</p>
            </div>
            <div>
              <h3 className="text-xs text-indigo-300 uppercase mb-1">Lucky Color</h3>
              <div className="flex items-center">
                <motion.span 
                  whileHover={{ scale: 1.2 }}
                  className="inline-block w-4 h-4 rounded-full mr-2"
                  style={{ 
                    backgroundColor: typeof horoscope.lucky_color === 'string' 
                      ? horoscope.lucky_color.toLowerCase().replace(/\s+/g, '') 
                      : getColorFromString(String(horoscope.lucky_color))
                  }}
                ></motion.span>
                <p className="font-medium text-white">{
                  typeof horoscope.lucky_color === 'string' 
                    ? horoscope.lucky_color 
                    : String(horoscope.lucky_color || 'Unknown')
                }</p>
              </div>
            </div>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
} 