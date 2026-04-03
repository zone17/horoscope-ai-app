'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useMode } from '@/hooks/useMode';
import { getPhilosopher } from '@/constants/philosophers';

const MAX_PHILOSOPHERS = 5;

export default function ReadingPreview() {
  const { selectedPhilosophers } = useMode();
  const count = selectedPhilosophers.length;

  // Show the most recently added philosopher's quote
  const lastSelected = count > 0 ? selectedPhilosophers[count - 1] : null;
  const philosopher = lastSelected ? getPhilosopher(lastSelected) : null;

  return (
    <div className="w-full mt-6">
      {/* Council counter */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <span className="text-sm font-medium tracking-wide text-[#F0EEFF]">
          YOUR COUNCIL
        </span>
        <span
          className={`text-sm font-bold px-2.5 py-0.5 rounded-full ${
            count >= 3
              ? 'bg-indigo-500/30 text-indigo-200'
              : 'bg-white/10 text-indigo-200/60'
          }`}
        >
          {count}/{MAX_PHILOSOPHERS}
        </span>
      </div>

      {/* Selected philosopher pills */}
      <div className="flex flex-wrap justify-center gap-2 mb-4">
        <AnimatePresence mode="popLayout">
          {selectedPhilosophers.map((name) => (
            <motion.span
              key={name}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              layout
              className="text-xs px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200"
            >
              {name}
            </motion.span>
          ))}
        </AnimatePresence>
      </div>

      {/* Live preview quote */}
      <AnimatePresence mode="wait">
        {philosopher && (
          <motion.blockquote
            key={philosopher.name}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="text-center px-6"
          >
            <p className="text-indigo-100/80 text-sm italic font-light leading-relaxed">
              &ldquo;{philosopher.sampleQuote}&rdquo;
            </p>
            <cite className="block text-indigo-200/50 text-xs mt-2 not-italic">
              &mdash; {philosopher.name}
            </cite>
          </motion.blockquote>
        )}
      </AnimatePresence>

      {/* Hint text */}
      {count === 0 && (
        <p className="text-center text-indigo-200/40 text-xs font-light">
          Tap philosophers above to build your council (3-5 recommended)
        </p>
      )}
    </div>
  );
}
