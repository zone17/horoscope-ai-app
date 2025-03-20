'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define types
type Mode = 'day' | 'night';

interface ModeContextType {
  mode: Mode;
  toggleMode: () => void;
}

// Create context
const ModeContext = createContext<ModeContextType | undefined>(undefined);

// Custom hook for using the context
export function useMode() {
  const context = useContext(ModeContext);
  if (!context) {
    throw new Error('useMode must be used within a ModeProvider');
  }
  return context;
}

// Provider component
export function ModeProvider({ children }: { children: ReactNode }) {
  // Use localStorage to persist theme preference, with SSR compatibility
  const [mode, setMode] = useState<Mode>('day');
  
  // Initialize state from localStorage on mount
  useEffect(() => {
    const savedMode = localStorage.getItem('horoscope-app-mode');
    if (savedMode && (savedMode === 'day' || savedMode === 'night')) {
      setMode(savedMode);
    } else {
      // Default to night mode for first-time visitors
      setMode('day');
    }
  }, []);
  
  // Toggle between day and night modes
  const toggleMode = () => {
    const newMode = mode === 'day' ? 'night' : 'day';
    setMode(newMode);
    localStorage.setItem('horoscope-app-mode', newMode);
  };
  
  // Context value
  const value = {
    mode,
    toggleMode
  };
  
  return (
    <ModeContext.Provider value={value}>
      {children}
    </ModeContext.Provider>
  );
} 