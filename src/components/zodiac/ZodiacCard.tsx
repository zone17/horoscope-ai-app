'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useMode } from '@/hooks/useMode';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { capitalize, getColorFromString } from '@/lib/utils';
import { ArrowRightIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';

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
  isLoading?: boolean;
}

export function ZodiacCard({ sign, symbol, dateRange, element = 'Fire', horoscope, isLoading }: ZodiacCardProps) {
  const { mode } = useMode();
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
        className="group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Card className="h-auto relative overflow-hidden border border-white/10 rounded-xl backdrop-blur-md bg-white/5">
          <motion.div 
            className="absolute -inset-1 rounded-xl opacity-0 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 blur-xl"
            variants={glowVariants}
            initial="initial"
            animate="animate"
          />
          
          {/* Card video/image container */}
          <div className="relative h-40 overflow-hidden rounded-t-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-700/10 to-indigo-900/10">
              <div className="absolute inset-0 opacity-20 mix-blend-overlay bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-500/20 via-transparent to-transparent"></div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-transparent to-transparent"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-4xl">{symbol}</div>
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
                <h3 className="text-xs uppercase mb-1 font-normal tracking-wider text-indigo-300/70">Lucky Number</h3>
                <motion.p 
                  className="font-light text-white text-lg"
                  animate={{ opacity: [0.4, 0.8, 0.4] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >?</motion.p>
              </div>
              <div>
                <h3 className="text-xs uppercase mb-1 font-normal tracking-wider text-indigo-300/70">Lucky Color</h3>
                <div className="flex items-center">
                  <motion.span 
                    className="inline-block w-4 h-4 rounded-full mr-2 bg-indigo-700/10"
                    animate={{ opacity: [0.4, 0.8, 0.4] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  ></motion.span>
                  <motion.p 
                    className="font-light text-white"
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
      className="group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Card className="h-auto pb-4 relative overflow-hidden border border-white/10 rounded-xl backdrop-blur-md bg-white/5">
        <motion.div 
          className="absolute -inset-1 rounded-xl opacity-0 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 blur-xl"
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
          
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/5 to-indigo-900/5 mix-blend-overlay"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-transparent to-black/5"></div>
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-transparent to-transparent"></div>
        </div>
        
        <CardHeader className="pt-3 pb-1 bg-transparent">
          <div className="flex items-center gap-3">
            <motion.div 
              whileHover={{ rotate: [0, -5, 5, -5, 0] }}
              transition={{ duration: 0.5 }}
              className="text-2xl text-indigo-100"
            >
              {symbol}
            </motion.div>
            <div>
              <h2 className="text-xl font-light text-white capitalize tracking-tight leading-tight">{capitalize(sign)}</h2>
              <p className="text-indigo-200/80 text-xs font-light tracking-wide">{dateRange} • {element}</p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pb-0 bg-transparent">
          <p className="text-white/90 text-sm font-light leading-relaxed tracking-normal">
            {content}
          </p>
        </CardContent>
        
        <CardFooter className="pt-3 border-t border-white/5 mt-3 flex-col items-stretch space-y-2 bg-transparent">
          <div className="grid grid-cols-2 gap-3 w-full">
            <div>
              <h3 className="text-xs uppercase mb-1 font-normal tracking-wider text-indigo-100/80">Lucky Number</h3>
              <p className="font-light text-white text-lg leading-none">
                {typeof horoscope.lucky_number === 'object' 
                  ? '7' // Fallback value if it's an object
                  : String(horoscope.lucky_number)}
              </p>
            </div>
            <div>
              <h3 className="text-xs uppercase mb-1 font-normal tracking-wider text-indigo-100/80">Lucky Color</h3>
              <div className="flex items-center">
                <motion.span 
                  whileHover={{ scale: 1.2 }}
                  className="inline-block w-4 h-4 rounded-full mr-2"
                  style={{ 
                    backgroundColor: typeof horoscope.lucky_color === 'string' 
                      ? horoscope.lucky_color.toLowerCase().replace(/\s+/g, '') 
                      : '#6366F1' // Default to indigo if not a string
                  }}
                ></motion.span>
                <p className="font-light text-white truncate">
                  {typeof horoscope.lucky_color === 'object'
                    ? 'Indigo' // Fallback value if it's an object
                    : typeof horoscope.lucky_color === 'string'
                      ? horoscope.lucky_color
                      : String(horoscope.lucky_color || 'Indigo')
                  }
                </p>
              </div>
            </div>
          </div>

          {(horoscope.mood && typeof horoscope.mood === 'string') && (
            <div className="border-t border-white/5 pt-2 mt-1 w-full">
              <h3 className="text-xs uppercase mb-1 font-normal tracking-wider text-indigo-100/80">Mood</h3>
              <p className="font-light text-white text-sm">{horoscope.mood}</p>
            </div>
          )}
          
          {(horoscope.compatibility && typeof horoscope.compatibility === 'string') && (
            <div className="w-full">
              <h3 className="text-xs uppercase mb-1 font-normal tracking-wider text-indigo-100/80">Compatibility</h3>
              <p className="font-light text-white text-sm">{horoscope.compatibility}</p>
            </div>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  );
} 