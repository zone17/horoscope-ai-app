'use client';

import { motion } from 'framer-motion';
import { useMode } from '@/hooks/useMode';
import { VALID_SIGNS, SIGN_META, type ValidSign } from '@/constants/zodiac';
import { capitalize } from '@/lib/utils';
import { ConstellationIcon, USE_CONSTELLATION_ICONS } from '@/components/icons/ConstellationIcon';

/** Element to accent color mapping */
const ELEMENT_COLORS: Record<string, string> = {
  Fire: 'hover:border-orange-500/40 hover:shadow-orange-500/10',
  Earth: 'hover:border-lime-500/40 hover:shadow-lime-500/10',
  Air: 'hover:border-sky-500/40 hover:shadow-sky-500/10',
  Water: 'hover:border-violet-500/40 hover:shadow-violet-500/10',
};

const ELEMENT_SELECTED: Record<string, string> = {
  Fire: 'border-orange-500/50 bg-orange-500/10 shadow-lg shadow-orange-500/10',
  Earth: 'border-lime-500/50 bg-lime-500/10 shadow-lg shadow-lime-500/10',
  Air: 'border-sky-500/50 bg-sky-500/10 shadow-lg shadow-sky-500/10',
  Water: 'border-violet-500/50 bg-violet-500/10 shadow-lg shadow-violet-500/10',
};

interface SignStepProps {
  onSignSelected: () => void;
}

export default function SignStep({ onSignSelected }: SignStepProps) {
  const { userSign, setUserSign } = useMode();

  const handleSelect = (sign: string) => {
    setUserSign(sign);
    // Small delay for visual feedback before advancing
    setTimeout(onSignSelected, 300);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-3xl mx-auto px-4"
    >
      <h2 className="font-display text-2xl sm:text-3xl text-center text-[#F0EEFF] mb-2">
        What&apos;s your sign?
      </h2>
      <p className="text-center text-indigo-200/60 text-sm font-light mb-8">
        Select your zodiac sign to begin
      </p>

      <div
        className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3"
        role="listbox"
        aria-label="Select your zodiac sign"
      >
        {VALID_SIGNS.map((sign, i) => {
          const meta = SIGN_META[sign as ValidSign];
          const isSelected = userSign === sign;
          const elementColor = ELEMENT_COLORS[meta.element] || '';
          const selectedColor = ELEMENT_SELECTED[meta.element] || '';

          return (
            <motion.button
              key={sign}
              role="option"
              aria-selected={isSelected}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSelect(sign)}
              className={`
                flex flex-col items-center gap-1.5 p-4 rounded-xl border
                transition-all duration-300 cursor-pointer select-none backdrop-blur-md
                ${
                  isSelected
                    ? `${selectedColor} text-white`
                    : `bg-white/5 border-white/10 text-indigo-200/70 ${elementColor} hover:bg-white/[0.08] hover:text-white`
                }
              `}
            >
              {USE_CONSTELLATION_ICONS ? (
                <ConstellationIcon sign={sign} size={32} className="text-amber-400" />
              ) : (
                <span className="text-3xl leading-none">{meta.symbol}</span>
              )}
              <span className="font-display text-sm tracking-wide">
                {capitalize(sign)}
              </span>
              <span className="text-[10px] text-indigo-200/50 font-light">
                {meta.dateRange}
              </span>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
