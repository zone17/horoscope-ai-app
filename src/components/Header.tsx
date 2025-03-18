'use client';

import { useMode } from './ModeProvider';

export function Header() {
  const { mode, toggleMode } = useMode();

  return (
    <header className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-b border-indigo-100 dark:border-indigo-900 sticky top-0 z-10 transition-colors duration-300">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <span className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
            Cosmic Insights
          </span>
        </div>
        
        <button
          onClick={toggleMode}
          className="relative p-2 sm:p-3 rounded-full bg-indigo-100 dark:bg-indigo-900 hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors duration-300 group"
          aria-label={mode === 'day' ? 'Switch to night mode' : 'Switch to day mode'}
        >
          {mode === 'day' ? (
            <div className="flex items-center">
              <span className="hidden sm:inline-block mr-2 text-indigo-700 dark:text-indigo-300 font-medium">
                Night Mode
              </span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-700 dark:text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            </div>
          ) : (
            <div className="flex items-center">
              <span className="hidden sm:inline-block mr-2 text-indigo-300 dark:text-indigo-300 font-medium">
                Day Mode
              </span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          )}
        </button>
      </div>
    </header>
  );
} 