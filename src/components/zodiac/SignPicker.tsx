'use client';

import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useMode } from '@/hooks/useMode';

const ZODIAC_SYMBOLS: { sign: string; symbol: string; label: string }[] = [
  { sign: 'aquarius',    symbol: '♒', label: 'Aquarius' },
  { sign: 'pisces',      symbol: '♓', label: 'Pisces' },
  { sign: 'aries',       symbol: '♈', label: 'Aries' },
  { sign: 'taurus',      symbol: '♉', label: 'Taurus' },
  { sign: 'gemini',      symbol: '♊', label: 'Gemini' },
  { sign: 'cancer',      symbol: '♋', label: 'Cancer' },
  { sign: 'leo',         symbol: '♌', label: 'Leo' },
  { sign: 'virgo',       symbol: '♍', label: 'Virgo' },
  { sign: 'libra',       symbol: '♎', label: 'Libra' },
  { sign: 'scorpio',     symbol: '♏', label: 'Scorpio' },
  { sign: 'sagittarius', symbol: '♐', label: 'Sagittarius' },
  { sign: 'capricorn',   symbol: '♑', label: 'Capricorn' },
];

export function SignPicker() {
  const { userSign, setUserSign } = useMode();
  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
      <AnimatePresence>
        {!userSign && (
          <motion.p
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="text-center text-indigo-200/80 text-sm font-light mb-3 tracking-wide"
          >
            What&apos;s your sign? Select it to see your reading first.
          </motion.p>
        )}
      </AnimatePresence>

      {/* Horizontal scroll row */}
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide justify-start sm:justify-center"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        role="listbox"
        aria-label="Select your zodiac sign"
      >
        {ZODIAC_SYMBOLS.map(({ sign, symbol, label }) => {
          const isSelected = userSign === sign;
          return (
            <motion.button
              key={sign}
              role="option"
              aria-selected={isSelected}
              whileTap={{ scale: 0.92 }}
              onClick={() => {
                setUserSign(sign);
                router.push(`/horoscope/${sign}`);
              }}
              className={`
                flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl
                border transition-all duration-200 cursor-pointer select-none
                ${isSelected
                  ? 'bg-indigo-500/40 border-indigo-400/60 text-white shadow-lg shadow-indigo-500/20'
                  : 'bg-white/5 border-white/10 text-indigo-200/70 hover:bg-white/10 hover:border-white/20 hover:text-white'
                }
              `}
            >
              <span className="text-xl leading-none">{symbol}</span>
              <span className="text-[10px] font-light tracking-wide whitespace-nowrap">{label}</span>
            </motion.button>
          );
        })}
      </div>

      {userSign && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-indigo-200/80 text-xs mt-2 font-light"
        >
          Your sign is highlighted below.{' '}
          <button
            onClick={() => setUserSign('')}
            className="underline underline-offset-2 hover:text-indigo-200 transition-colors"
          >
            Change
          </button>
        </motion.p>
      )}
    </div>
  );
}
