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
          ? 'bg-black/70 backdrop-blur-lg shadow-xl' 
          : 'bg-transparent'
      }`}
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="container mx-auto px-4 py-4 md:py-5">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center">
            <motion.div 
              className="mr-2 text-amber-300"
              initial={{ rotate: 0 }}
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <SparklesIcon size={24} />
            </motion.div>
            
            <motion.h1 
              className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center"
              whileHover={{ scale: 1.03 }}
              transition={{ type: 'spring', stiffness: 400, damping: 10 }}
            >
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-300">
                {mode === 'day' ? "Today's Horoscope" : "Tonight's Thought"}
              </span>
            </motion.h1>
          </div>

          <div className="flex items-center space-x-4">
            <div className="bg-black/40 border border-indigo-500/20 backdrop-blur-md px-4 py-2 rounded-full text-white text-sm md:text-base">
              {currentDate}
            </div>
            
            <div className="bg-black/40 border border-indigo-500/20 backdrop-blur-md p-1 rounded-full flex">
              <AnimatePresence mode="wait">
                <motion.div
                  key={mode}
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 20, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="relative"
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleMode}
                    className={`relative rounded-full ${
                      mode === 'day' 
                        ? 'text-amber-300 bg-amber-500/10' 
                        : 'text-indigo-300 bg-indigo-500/10'
                    }`}
                    aria-label={mode === 'day' ? 'Switch to night mode' : 'Switch to day mode'}
                  >
                    {mode === 'day' ? (
                      <SunIcon className="h-5 w-5" />
                    ) : (
                      <MoonIcon className="h-5 w-5" />
                    )}
                  </Button>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"></div>
      
      {/* Blob decorations */}
      <div className="absolute -top-24 -right-20 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute -top-24 -left-20 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
    </motion.header>
  );
} 