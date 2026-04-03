'use client';

import { motion } from 'framer-motion';
import type { Philosopher } from '@/constants/philosophers';
import { Tradition } from '@/constants/philosophers';

/** Map tradition enum to human-readable labels */
const TRADITION_LABELS: Record<Tradition, string> = {
  [Tradition.Stoicism]: 'Stoicism',
  [Tradition.EasternWisdom]: 'Eastern Wisdom',
  [Tradition.ScienceWonder]: 'Science & Wonder',
  [Tradition.PoetrySoul]: 'Poetry & Soul',
  [Tradition.SpiritualLeaders]: 'Spiritual Leaders',
  [Tradition.ModernThinkers]: 'Modern Thinkers',
};

/** Map tradition to accent color for the tag */
const TRADITION_COLORS: Record<Tradition, string> = {
  [Tradition.Stoicism]: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  [Tradition.EasternWisdom]: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  [Tradition.ScienceWonder]: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
  [Tradition.PoetrySoul]: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  [Tradition.SpiritualLeaders]: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  [Tradition.ModernThinkers]: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
};

interface PhilosopherCardProps {
  philosopher: Philosopher;
  isSelected: boolean;
  onToggle: () => void;
  disabled: boolean;
}

export default function PhilosopherCard({
  philosopher,
  isSelected,
  onToggle,
  disabled,
}: PhilosopherCardProps) {
  return (
    <motion.button
      layout
      whileTap={{ scale: 0.97 }}
      onClick={onToggle}
      disabled={disabled && !isSelected}
      className={`
        relative text-left w-full p-4 rounded-xl border transition-all duration-300
        ${
          isSelected
            ? 'bg-white/10 border-indigo-400/40 shadow-lg shadow-indigo-500/10'
            : disabled
              ? 'bg-white/[0.02] border-white/5 opacity-50 cursor-not-allowed'
              : 'bg-white/5 border-white/10 hover:bg-white/[0.08] hover:border-white/20 cursor-pointer'
        }
      `}
      aria-pressed={isSelected}
      aria-label={`${isSelected ? 'Remove' : 'Add'} ${philosopher.name} to your council`}
    >
      {/* Selection indicator */}
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-2 right-2 w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center"
        >
          <svg
            className="w-3 h-3 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </motion.div>
      )}

      {/* Philosopher name */}
      <h3 className="font-display text-base text-[#F0EEFF] mb-1 pr-6">
        {philosopher.name}
      </h3>

      {/* Tradition tag */}
      <span
        className={`inline-block text-[10px] font-medium tracking-wide uppercase px-2 py-0.5 rounded-full border mb-2 ${TRADITION_COLORS[philosopher.tradition]}`}
      >
        {TRADITION_LABELS[philosopher.tradition]}
      </span>

      {/* Description */}
      <p className="text-xs text-indigo-200/70 font-light leading-relaxed">
        {philosopher.description}
      </p>
    </motion.button>
  );
}
