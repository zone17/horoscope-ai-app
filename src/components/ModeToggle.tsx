'use client';

import { MoonIcon, SunIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMode } from '@/hooks/useMode';

export function ModeToggle() {
  const { mode, toggleMode } = useMode();
  
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleMode}
      className="rounded-full h-8 px-3 bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
    >
      <span className="flex items-center gap-2">
        <span className="text-xs font-light text-white/70">
          {mode === 'day' ? 'Night Mode' : 'Day Mode'}
        </span>
        {mode === 'day' ? (
          <MoonIcon className="h-3.5 w-3.5 text-white/70" />
        ) : (
          <SunIcon className="h-3.5 w-3.5 text-white/70" />
        )}
      </span>
    </Button>
  );
} 