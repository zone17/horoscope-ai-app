'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Mode = 'day' | 'night';

interface ModeContextType {
  mode: Mode;
  toggleMode: () => void;
}

const ModeContext = createContext<ModeContextType | undefined>(undefined);

export function ModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Mode>('day');

  // Toggle between day and night modes
  const toggleMode = () => {
    setMode((current) => {
      const newMode = current === 'day' ? 'night' : 'day';
      
      // Save preference to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('horoscopeMode', newMode);
      }
      
      return newMode;
    });
  };

  // Initialize from localStorage and apply theme class
  useEffect(() => {
    // Get saved preference from localStorage
    const savedMode = localStorage.getItem('horoscopeMode') as Mode | null;
    if (savedMode) {
      setMode(savedMode);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setMode('night');
    }
    
    // Apply dark mode class to document
    if (mode === 'night') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [mode]);

  return (
    <ModeContext.Provider value={{ mode, toggleMode }}>
      {children}
    </ModeContext.Provider>
  );
}

// Custom hook to use the mode context
export function useMode() {
  const context = useContext(ModeContext);
  if (context === undefined) {
    throw new Error('useMode must be used within a ModeProvider');
  }
  return context;
} 