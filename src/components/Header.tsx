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
    <div className="bg-indigo-900/95 text-white pb-8 pt-4">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-2 bg-indigo-800/60 p-3 rounded-lg">
            <span className="text-amber-300 text-2xl">★</span>
            <span className="text-xl sm:text-2xl font-bold text-white">
              {mode === 'day' ? "Today's Horoscope" : "Tonight's Thought"}
            </span>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => toggleMode()}
              className={`relative p-2 rounded-lg transition-colors duration-300 ${
                mode === 'day' 
                  ? 'bg-amber-500/20 text-amber-400' 
                  : 'bg-indigo-800/60 text-indigo-300'
              }`}
              aria-label="Day mode"
            >
              <span className="text-xl">☀️</span>
            </button>
            
            <button
              onClick={() => toggleMode()}
              className={`relative p-2 rounded-lg transition-colors duration-300 ${
                mode === 'night' 
                  ? 'bg-indigo-500/30 text-indigo-300' 
                  : 'bg-indigo-800/60 text-indigo-300'
              }`}
              aria-label="Night mode"
            >
              <span className="text-xl">🌙</span>
            </button>
            
            <button
              className="relative p-2 rounded-lg bg-indigo-800/60 text-indigo-300 transition-colors duration-300"
              aria-label="Settings"
            >
              <span className="text-xl">⚙️</span>
            </button>
            
            <button
              className="relative p-2 rounded-lg bg-indigo-800/60 text-indigo-300 transition-colors duration-300"
              aria-label="Refresh"
            >
              <span className="text-xl">♻️</span>
            </button>
            
            <button
              className="relative p-2 rounded-lg bg-indigo-800/60 text-rose-400 transition-colors duration-300"
              aria-label="Favorites"
            >
              <span className="text-xl">🔥</span>
            </button>
          </div>
        </div>
        
        <div className="flex justify-center">
          <div className="bg-indigo-800/60 px-6 py-2 rounded-lg text-white text-center">
            {currentDate}
          </div>
        </div>
      </div>
    </div>
  );
} 