'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMode } from '@/hooks/useMode';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { SunIcon, MoonIcon, SparklesIcon } from 'lucide-react';

export function Header() {
  const { mode, toggleMode } = useMode();
  const [currentDate, setCurrentDate] = useState<string>('');
  const [isScrolled, setIsScrolled] = useState(false);

  // Listen for scroll events
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Set current date on component mount
  useEffect(() => {
    setCurrentDate(formatDate(new Date()));
  }, []);

  return (
    <motion.header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled 
          ? 'bg-white/5 backdrop-blur-md shadow-lg' 
          : 'bg-transparent'
      }`}
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between relative">
          {/* Left: Logo/Title */}
          <div className="flex items-center z-10">
            <motion.div 
              className="mr-2 text-amber-200"
              initial={{ rotate: 0 }}
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <SparklesIcon size={20} className="text-amber-200/80" />
            </motion.div>
            
            <motion.h1 
              className="text-xl font-extralight tracking-tight flex items-center"
              whileHover={{ scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 400, damping: 10 }}
            >
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-200 to-indigo-100 font-extralight">
                Today's Horoscope
              </span>
            </motion.h1>
          </div>

          {/* Right: Mode Toggle */}
          <div className="flex items-center z-10">
            <div className="relative">
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-purple-400/5 to-indigo-400/5 rounded-full blur-md"
                animate={{ 
                  opacity: mode === 'night' ? 0.6 : 0 
                }}
                transition={{ duration: 0.3 }}
              />
              
              <Button
                variant="cosmic"
                size="sm"
                onClick={toggleMode}
                className={`rounded-full px-4 py-1.5 transition-all duration-300 ${
                  mode === 'night' 
                    ? 'bg-indigo-900/20 text-indigo-100 border-0' 
                    : 'bg-white/5 text-indigo-200/90 hover:text-amber-200/90 border-0'
                }`}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={mode}
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 10, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center"
                  >
                    {mode === 'day' ? (
                      <>
                        <span className="mr-2 font-extralight text-xs">Night Mode</span>
                        <MoonIcon className="h-4 w-4" />
                      </>
                    ) : (
                      <>
                        <span className="mr-2 font-extralight text-xs">Day Mode</span>
                        <SunIcon className="h-4 w-4" /> 
                      </>
                    )}
                  </motion.div>
                </AnimatePresence>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Subtle glassmorphic line */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
    </motion.header>
  );
} 