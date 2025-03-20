'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getHoroscopesForAllSigns } from '@/utils/horoscope-service';

// Define types
export type ZodiacSign = 
  | 'aries' | 'taurus' | 'gemini' | 'cancer' 
  | 'leo' | 'virgo' | 'libra' | 'scorpio'
  | 'sagittarius' | 'capricorn' | 'aquarius' | 'pisces';

interface HoroscopeData {
  message: string;
  lucky_number: number | string;
  lucky_color: string;
  mood?: string;
  compatibility?: string;
  peaceful_thought?: string;
}

interface AllHoroscopesContextType {
  data: Record<string, HoroscopeData> | null;
  isLoading: boolean;
  isError: boolean;
  refetch: () => Promise<void>;
}

// Create context
const AllHoroscopesContext = createContext<AllHoroscopesContextType | undefined>(undefined);

// Custom hook for using the context
export function useAllHoroscopes() {
  const context = useContext(AllHoroscopesContext);
  if (!context) {
    throw new Error('useAllHoroscopes must be used within an AllHoroscopesProvider');
  }
  return context;
}

// Provider component
export function AllHoroscopesProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Record<string, HoroscopeData> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  
  // Function to fetch horoscope data
  const fetchHoroscopes = async () => {
    try {
      setIsLoading(true);
      const horoscopeData = await getHoroscopesForAllSigns();
      setData(horoscopeData);
      setIsError(false);
    } catch (error) {
      console.error('Error fetching horoscopes:', error);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch data on mount
  useEffect(() => {
    fetchHoroscopes();
  }, []);
  
  // Context value
  const value = {
    data,
    isLoading,
    isError,
    refetch: fetchHoroscopes
  };
  
  return (
    <AllHoroscopesContext.Provider value={value}>
      {children}
    </AllHoroscopesContext.Provider>
  );
} 