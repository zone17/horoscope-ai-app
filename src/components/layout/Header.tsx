'use client';

import React from 'react';
import { ModeToggle } from '@/components/ModeToggle';
import { SparklesIcon } from 'lucide-react';
import Link from 'next/link';
import { useMode } from '@/hooks/useMode';

export function Header() {
  const { mode } = useMode();
  
  const formattedDate = React.useMemo(() => {
    const today = new Date();
    return today.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  }, []);
  
  return (
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-[#1c1a42]/80 border-b border-white/5">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo and title */}
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <SparklesIcon className="h-5 w-5 text-amber-200" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-200 to-indigo-100 text-lg font-light">
              Today's Horoscope
            </span>
          </Link>
        </div>
        
        {/* Central date on larger screens */}
        <div className="hidden md:flex absolute left-1/2 transform -translate-x-1/2 items-center">
          <div className="px-3 py-1.5 rounded-full bg-purple-800/20 backdrop-blur-sm">
            <span className="text-xs text-white/70 font-light tracking-wider">
              {formattedDate}
            </span>
          </div>
        </div>
        
        {/* Mode toggle */}
        <div className="flex items-center gap-4">
          <ModeToggle />
        </div>
      </div>
    </header>
  );
} 