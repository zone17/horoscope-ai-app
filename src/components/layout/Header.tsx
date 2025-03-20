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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-black/70 backdrop-blur-lg border-b border-indigo-900/30' 
          : 'bg-transparent'
      }`}
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between relative">
          {/* Left: Logo/Title */}
          <div className="flex items-center z-10">
            <motion.div 
              className="mr-2 text-amber-300"
              initial={{ rotate: 0 }}
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <SparklesIcon size={20} className="text-amber-300/90" />
            </motion.div>
            
            <motion.h1 
              className="text-xl font-medium tracking-tight flex items-center"
              whileHover={{ scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 400, damping: 10 }}
            >
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-300 font-light">
                Today's Horoscope
              </span>
            </motion.h1>
          </div>

          {/* Center: Date */}
          <motion.div 
            className="absolute left-1/2 transform -translate-x-1/2 hidden sm:block"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="bg-black/30 backdrop-blur-sm border border-indigo-500/20 rounded-full px-4 py-1.5">
              <span className="text-sm font-light text-white">
                {currentDate}
              </span>
            </div>
          </motion.div>

          {/* Right: Mode Toggle */}
          <div className="flex items-center z-10">
            <div className="relative">
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-indigo-600/20 rounded-full blur-md"
                animate={{ 
                  opacity: mode === 'night' ? 0.8 : 0 
                }}
                transition={{ duration: 0.3 }}
              />
              
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMode}
                className={`rounded-full px-3 py-2 transition-all duration-300 ${
                  mode === 'night' 
                    ? 'bg-indigo-900/40 text-indigo-200 border border-indigo-700/50' 
                    : 'bg-transparent text-indigo-300/70 hover:text-amber-300/90'
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
                        <span className="mr-2 font-light text-xs">Night Mode</span>
                        <MoonIcon className="h-4 w-4" />
                      </>
                    ) : (
                      <>
                        <span className="mr-2 font-light text-xs">Day Mode</span>
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

      {/* Subtle gradient line at bottom */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent"></div>
    </motion.header>
  );
} 