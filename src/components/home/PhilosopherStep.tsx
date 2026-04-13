'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useMode } from '@/hooks/useMode';
import {
  PHILOSOPHERS,
  TRADITIONS,
  Tradition,
  getPhilosophersByTradition,
} from '@/constants/philosophers';
import { recommendPhilosophers } from '@/tools/philosopher/recommend';
import PhilosopherCard from './PhilosopherCard';
import ReadingPreview from './ReadingPreview';

const MAX_PHILOSOPHERS = 5;

/** Human-readable tradition labels */
const TRADITION_LABELS: Record<Tradition, string> = {
  [Tradition.Stoicism]: 'Stoicism',
  [Tradition.EasternWisdom]: 'Eastern Wisdom',
  [Tradition.ScienceWonder]: 'Science & Wonder',
  [Tradition.PoetrySoul]: 'Poetry & Soul',
  [Tradition.SpiritualLeaders]: 'Spiritual Leaders',
  [Tradition.ModernThinkers]: 'Modern Thinkers',
};

/** Capitalize first letter of a string */
function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

interface PhilosopherStepProps {
  onContinue: () => void;
  onBack: () => void;
}

export default function PhilosopherStep({
  onContinue,
  onBack,
}: PhilosopherStepProps) {
  const { selectedPhilosophers, togglePhilosopher, userSign } = useMode();
  const [activeFilter, setActiveFilter] = useState<Tradition | 'all'>('all');

  const recommended = useMemo(() => {
    if (!userSign) return [];
    try {
      return recommendPhilosophers({ sign: userSign, count: 5 }).recommended;
    } catch {
      return [];
    }
  }, [userSign]);

  const isAtMax = selectedPhilosophers.length >= MAX_PHILOSOPHERS;
  const canContinue = selectedPhilosophers.length >= 1;

  const filteredPhilosophers =
    activeFilter === 'all'
      ? PHILOSOPHERS
      : getPhilosophersByTradition(activeFilter);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-4xl mx-auto px-4"
    >
      <h2 className="font-display text-2xl sm:text-3xl text-center text-[#F0EEFF] mb-2">
        Build your council
      </h2>
      <p className="text-center text-indigo-200/60 text-sm font-light mb-6">
        Choose 3-5 philosophers whose wisdom will shape your daily reading
      </p>

      {/* Recommended for your sign */}
      {recommended.length > 0 && userSign && (
        <div className="mb-8">
          <p className="text-center text-indigo-200/60 text-xs uppercase tracking-wider mb-3">
            Recommended for {capitalize(userSign)}
          </p>
          <div className="flex flex-wrap justify-center gap-2 mb-2">
            {recommended.map((rec) => {
              const isSelected = selectedPhilosophers.includes(rec.name);
              const isDisabled = isAtMax && !isSelected;
              return (
                <button
                  key={rec.name}
                  onClick={() => {
                    if (!isDisabled) togglePhilosopher(rec.name);
                  }}
                  disabled={isDisabled}
                  className={`
                    group relative px-4 py-2.5 rounded-xl border backdrop-blur-md
                    transition-all duration-200 text-left max-w-[220px]
                    ${
                      isSelected
                        ? 'bg-amber-400/10 border-amber-400/40 shadow-[0_0_12px_rgba(251,191,36,0.1)]'
                        : 'bg-white/5 border-white/10 hover:bg-white/[0.08] hover:border-white/20'
                    }
                    ${isDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  <span
                    className={`block text-sm font-medium ${
                      isSelected ? 'text-amber-200' : 'text-[#F0EEFF]'
                    }`}
                  >
                    {rec.name}
                  </span>
                  <span className="block text-[10px] leading-tight text-indigo-200/50 mt-0.5">
                    {rec.reason}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Tradition filter tabs */}
      <div className="flex flex-wrap justify-center gap-2 mb-6">
        <button
          onClick={() => setActiveFilter('all')}
          className={`text-xs px-3 py-1.5 rounded-full border transition-all duration-200 ${
            activeFilter === 'all'
              ? 'bg-white/10 border-white/20 text-white'
              : 'bg-white/[0.02] border-white/10 text-indigo-200/60 hover:bg-white/5 hover:text-indigo-200'
          }`}
        >
          All ({PHILOSOPHERS.length})
        </button>
        {TRADITIONS.map((t) => (
          <button
            key={t}
            onClick={() => setActiveFilter(t)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-all duration-200 ${
              activeFilter === t
                ? 'bg-white/10 border-white/20 text-white'
                : 'bg-white/[0.02] border-white/10 text-indigo-200/60 hover:bg-white/5 hover:text-indigo-200'
            }`}
          >
            {TRADITION_LABELS[t]} ({getPhilosophersByTradition(t).length})
          </button>
        ))}
      </div>

      {/* Philosopher grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        {filteredPhilosophers.map((p) => (
          <PhilosopherCard
            key={p.name}
            philosopher={p}
            isSelected={selectedPhilosophers.includes(p.name)}
            onToggle={() => togglePhilosopher(p.name)}
            disabled={isAtMax}
          />
        ))}
      </div>

      {/* Live preview */}
      <ReadingPreview />

      {/* Navigation */}
      <div className="flex items-center justify-center gap-4 mt-8 mb-4">
        <button
          onClick={onBack}
          className="text-sm text-indigo-200/60 hover:text-indigo-200 transition-colors underline underline-offset-2"
        >
          Change sign
        </button>
        <button
          onClick={onContinue}
          disabled={!canContinue}
          className={`
            px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300
            ${
              canContinue
                ? 'bg-indigo-500/40 border border-indigo-400/30 text-white hover:bg-indigo-500/60 shadow-sm cursor-pointer'
                : 'bg-white/5 border border-white/10 text-indigo-200/40 cursor-not-allowed'
            }
          `}
        >
          {selectedPhilosophers.length === 0
            ? 'Select at least 1 philosopher'
            : `Continue with ${selectedPhilosophers.length} philosopher${selectedPhilosophers.length === 1 ? '' : 's'}`}
        </button>
      </div>
    </motion.div>
  );
}
