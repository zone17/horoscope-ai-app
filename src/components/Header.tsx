'use client';

import { useMode } from './ModeProvider';
import { useState, useEffect } from 'react';

export function Header() {
  const { mode, toggleMode } = useMode();
  const [currentDate, setCurrentDate] = useState<string>('');

  useEffect(() => {
    // Format the current date as "Tuesday, March 18, 2025"
    const date = new Date();
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    setCurrentDate(date.toLocaleDateString('en-US', options));
  }, []);

  return (
    <div className="bg-indigo-950/90 text-white pt-4 sm:pt-5 md:pt-6 pb-6 sm:pb-7 md:pb-8 border-b border-indigo-700/50 shadow-lg backdrop-blur-md relative z-20">
      {/* Header glow effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/3 w-1/3 h-12 bg-indigo-500/20 rounded-full blur-[60px]"></div>
      </div>
      
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-5 sm:mb-6 md:mb-8 gap-3 sm:gap-0">
          <div className="flex items-center space-x-2 sm:space-x-3 bg-indigo-900/50 backdrop-blur-md p-3 sm:p-4 rounded-xl shadow-lg border border-indigo-500/20 w-full sm:w-auto justify-center sm:justify-start">
            <span className="text-amber-300 text-xl sm:text-2xl font-bold">★</span>
            <span className="text-lg sm:text-xl md:text-2xl font-bold text-white">
              {mode === 'day' ? "Today's Horoscope" : "Tonight's Thought"}
            </span>
          </div>
          
          <div className="flex space-x-3 sm:space-x-4">
            <button
              onClick={() => toggleMode()}
              className={`relative p-2 sm:p-3 rounded-lg transition-all duration-300 shadow-lg backdrop-blur-md ${
                mode === 'day' 
                  ? 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-400/50 scale-110' 
                  : 'bg-indigo-900/50 text-indigo-300 border border-indigo-500/20'
              }`}
              aria-label="Day mode"
            >
              <span className="text-lg sm:text-xl">☀️</span>
            </button>
            
            <button
              onClick={() => toggleMode()}
              className={`relative p-2 sm:p-3 rounded-lg transition-all duration-300 shadow-lg backdrop-blur-md ${
                mode === 'night' 
                  ? 'bg-indigo-800/50 text-indigo-300 ring-1 ring-indigo-400/50 scale-110' 
                  : 'bg-indigo-900/50 text-indigo-300 border border-indigo-500/20'
              }`}
              aria-label="Night mode"
            >
              <span className="text-lg sm:text-xl">🌙</span>
            </button>
          </div>
        </div>
        
        <div className="flex justify-center">
          <div className="bg-indigo-900/50 backdrop-blur-md px-4 sm:px-6 md:px-8 py-2 sm:py-3 rounded-xl text-white text-center shadow-lg border border-indigo-500/20 text-sm sm:text-base">
            {currentDate}
          </div>
        </div>
      </div>
    </div>
  );
} 