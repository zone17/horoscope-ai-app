'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useMode } from '@/hooks/useMode';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { capitalize, getColorFromString } from '@/lib/utils';
import { ArrowRightIcon, X, ChevronDown } from 'lucide-react';
import { isFeatureEnabled, FEATURE_FLAGS } from '@/utils/feature-flags';

// Element-based accent colors (C3)
const ELEMENT_COLORS: Record<string, string> = {
  Fire: '#F97316',
  Earth: '#84CC16',
  Air: '#38BDF8',
  Water: '#A78BFA',
};

// Define the horoscope data interface
interface HoroscopeData {
  sign: string;
  type: string;
  date: string;
  message: string;
  best_match?: string;
  inspirational_quote?: string;
  quote_author?: string;
  peaceful_thought?: string;
  mood?: string;
  compatibility?: string;
}

interface ZodiacCardProps {
  sign: string;
  symbol: string;
  dateRange: string;
  element?: string;
  horoscope: HoroscopeData | null;
  isLoading?: boolean;
}

export function ZodiacCard({ sign, symbol, dateRange, element = 'Fire', horoscope, isLoading }: ZodiacCardProps) {
  const { mode } = useMode();
  const [isHovered, setIsHovered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const expandedRef = useRef<HTMLDivElement>(null);
  const elementColor = ELEMENT_COLORS[element] || ELEMENT_COLORS.Fire;

  useEffect(() => {
    if (isExpanded && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [isExpanded]);

  useEffect(() => {
    if (!isExpanded) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsExpanded(false);
      if (e.key === 'Tab' && expandedRef.current) {
        const focusable = expandedRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault(); last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault(); first.focus();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded]);

  const handleCardKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIsExpanded(true); }
  }, []);

  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  const cardVariants = prefersReducedMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1, transition: { duration: 0.01 } }, exit: { opacity: 0, transition: { duration: 0.01 } } }
    : { initial: { y: 20, opacity: 0 }, animate: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 260, damping: 20 } }, exit: { scale: 0.8, opacity: 0, transition: { duration: 0.2 } } };

  const glowVariants = { initial: { opacity: 0, scale: 0.2 }, animate: { opacity: isHovered ? 0.15 : 0, scale: isHovered ? 1.1 : 0.2, transition: { duration: 0.8 } } };

  const getPreviewSentences = (text: string) => {
    if (!text) return '';
    const sentences = text.match(/[^.!?]+[.!?]+/g);
    if (!sentences) return text.split(' ').slice(0, 30).join(' ') + '...';
    return sentences.slice(0, 3).join(' ').trim();
  };

  const processHoroscopeData = (data: HoroscopeData | null) => {
    if (!data) return null;
    return { ...data, best_match: data.best_match || 'Coming soon', inspirational_quote: data.inspirational_quote || 'Coming soon', quote_author: data.quote_author || '', message: data.message };
  };

  if (!horoscope || !horoscope.message) {
    return (
      <motion.div variants={cardVariants} initial="initial" animate="animate" className="group" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
        <Card className="min-h-[280px] relative overflow-hidden rounded-xl backdrop-blur-md bg-white/[0.05]" style={{ borderLeft: `3px solid ${elementColor}`, borderTop: '1px solid rgba(255,255,255,0.1)', borderRight: '1px solid rgba(255,255,255,0.1)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <motion.div className="absolute -inset-1 rounded-xl opacity-0 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 blur-xl" variants={glowVariants} initial="initial" animate="animate" />
          <CardHeader className="pt-4 pb-1 bg-transparent">
            <div className="flex items-center gap-3">
              <div className="text-2xl text-indigo-200">{symbol}</div>
              <div>
                <h2 className="text-xl font-display font-medium text-white capitalize tracking-tight">{capitalize(sign)}</h2>
                <p className="text-indigo-200/70 text-xs font-medium tracking-wider">{dateRange} • {element}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pb-0 bg-transparent">
            <div className="space-y-1.5 animate-pulse">
              <div className="bg-indigo-700/10 h-3 rounded w-full"></div>
              <div className="bg-indigo-700/10 h-3 rounded w-full"></div>
              <div className="bg-indigo-700/10 h-3 rounded w-3/4"></div>
            </div>
          </CardContent>
          <CardFooter className="pt-3 border-t border-white/5 mt-3 flex-col items-stretch space-y-2 bg-transparent">
            <div className="grid grid-cols-2 gap-3 w-full">
              <div>
                <h3 className="text-xs uppercase mb-1 font-medium tracking-wider text-indigo-100/80">Best Match</h3>
                <div className="h-5 w-20 animate-pulse bg-indigo-800/30 rounded"></div>
              </div>
              <div>
                <h3 className="text-xs uppercase mb-1 font-medium tracking-wider text-indigo-100/80">Quote Author</h3>
                <div className="flex flex-col">
                  <div className="h-3 w-full animate-pulse bg-indigo-800/30 rounded mb-1"></div>
                  <div className="h-2 w-16 animate-pulse bg-indigo-800/30 rounded"></div>
                </div>
              </div>
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    );
  }

  const processedHoroscope = processHoroscopeData(horoscope) || null;
  const showNightContent = mode === 'night' && processedHoroscope?.peaceful_thought;
  const content = showNightContent ? processedHoroscope.peaceful_thought : processedHoroscope?.message;
  const previewText = getPreviewSentences(content || '');

  const getColorForDisplay = (colorValue: string): string => {
    const commonColors: Record<string, string> = { 'red': '#EF4444', 'blue': '#3B82F6', 'green': '#22C55E', 'purple': '#9333EA', 'pink': '#EC4899', 'orange': '#F97316', 'yellow': '#EAB308', 'indigo': '#6366F1', 'violet': '#8B5CF6', 'teal': '#14B8A6', 'cyan': '#06B6D4', 'amber': '#F59E0B', 'emerald': '#10B981', 'rose': '#E11D48' };
    const lowerColor = colorValue.toLowerCase();
    if (commonColors[lowerColor]) return commonColors[lowerColor];
    if (lowerColor.startsWith('#') || lowerColor.startsWith('rgb')) return lowerColor;
    return getColorFromString(colorValue);
  };

  return (
    <>
      <AnimatePresence>
        {!isExpanded && (
          <motion.div key="card" variants={cardVariants} initial="initial" animate="animate" exit="exit" className="group" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
            <Card
              className="min-h-[280px] relative flex flex-col overflow-hidden rounded-xl backdrop-blur-md bg-white/[0.05] cursor-pointer transition-all hover:border-white/30 hover:shadow-lg"
              style={{ borderLeft: `3px solid ${elementColor}`, borderTop: '1px solid rgba(255,255,255,0.1)', borderRight: '1px solid rgba(255,255,255,0.1)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}
              onClick={() => setIsExpanded(true)}
              tabIndex={0}
              onKeyDown={handleCardKeyDown}
              role="button"
              aria-label={`Open horoscope reading for ${capitalize(sign)}`}
            >
              <motion.div className="absolute -inset-1 rounded-xl opacity-0 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 blur-xl" variants={glowVariants} initial="initial" animate="animate" />

              <CardHeader className="p-4 pb-2 bg-transparent shrink-0">
                <div className="flex items-center gap-3">
                  <motion.div whileHover={prefersReducedMotion ? {} : { rotate: [0, -5, 5, -5, 0] }} transition={{ duration: 0.5 }} className="text-2xl text-indigo-100">{symbol}</motion.div>
                  <div>
                    <h2 className="text-xl font-display font-medium text-white capitalize tracking-tight leading-tight">{capitalize(sign)}</h2>
                    <p className="text-indigo-200/80 text-xs font-medium tracking-wide">{dateRange} • {element}</p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-4 pt-2 pb-0 bg-transparent flex-grow">
                <div className="flex flex-col">
                  <p className="text-white/90 text-[15px] font-normal leading-relaxed tracking-normal text-left mx-auto w-full card-content font-satoshi">{previewText}</p>
                  <div className="mt-4 mb-0 flex justify-center">
                    <Button onClick={(e) => { e.stopPropagation(); setIsExpanded(true); }} className="px-4 py-1.5 text-xs bg-indigo-500/40 hover:bg-indigo-500/60 transition-all duration-300 rounded-full text-white font-medium shadow-sm border border-indigo-400/30 min-h-[44px] min-w-[44px]" aria-label={`Read full horoscope for ${sign}`}>Read More</Button>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="p-4 pt-2 border-t border-white/5 mt-auto flex-col items-stretch space-y-3 bg-transparent shrink-0">
                <div className="grid grid-cols-2 gap-3 w-full">
                  <div>
                    <h3 className="text-xs uppercase mb-1 font-medium tracking-wider text-indigo-100/80">Best Match</h3>
                    <p className="font-light text-white text-lg leading-none capitalize">{processedHoroscope?.best_match || 'Coming soon'}</p>
                  </div>
                  <div>
                    <h3 className="text-xs uppercase mb-1 font-medium tracking-wider text-indigo-100/80">Quote</h3>
                    <div className="flex flex-col">
                      <p className="font-light text-white text-xs italic line-clamp-2">{processedHoroscope?.inspirational_quote ? `"${processedHoroscope.inspirational_quote}"` : 'Coming soon'}</p>
                    </div>
                  </div>
                </div>
              </CardFooter>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isExpanded && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setIsExpanded(false)}>
            <motion.div
              ref={expandedRef}
              initial={prefersReducedMotion ? { opacity: 0 } : { scale: 0.9, opacity: 0 }}
              animate={prefersReducedMotion ? { opacity: 1 } : { scale: 1, opacity: 1 }}
              exit={prefersReducedMotion ? { opacity: 0 } : { scale: 0.9, opacity: 0 }}
              className="relative bg-indigo-950/90 border border-indigo-500/20 rounded-xl max-w-xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
              style={{ borderLeft: `3px solid ${elementColor}` }}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label={`Horoscope reading for ${capitalize(sign)}`}
            >
              <button ref={closeButtonRef} className="absolute top-3 right-3 z-50 bg-black/40 text-white p-2.5 rounded-full hover:bg-black/60 transition-colors shadow-xl min-h-[44px] min-w-[44px] flex items-center justify-center" onClick={() => setIsExpanded(false)} aria-label="Close details">
                <X size={24} />
              </button>

              <div className="absolute top-0 left-0 right-0 flex justify-center pt-2 pb-1 z-40 md:hidden">
                <motion.div animate={prefersReducedMotion ? {} : { y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 1.5 }} className="bg-white/20 h-1 w-16 rounded-full"></motion.div>
              </div>

              <div className="absolute top-1 left-0 right-0 text-center text-xs text-white/50 z-40 md:hidden">
                <motion.div animate={prefersReducedMotion ? {} : { opacity: [0.5, 0.8, 0.5] }} transition={{ repeat: Infinity, duration: 2 }}>Tap outside or swipe down to close</motion.div>
              </div>

              <Card className="w-full h-full max-h-[90vh] overflow-auto border-0 bg-transparent shadow-none">
                <CardHeader className="pt-6 pb-2 bg-transparent">
                  <div className="flex items-center gap-4">
                    <motion.div animate={prefersReducedMotion ? {} : { rotate: [0, -2, 2, -2, 0] }} transition={{ duration: 5, repeat: Infinity }} className="text-3xl text-indigo-100">{symbol}</motion.div>
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-display font-medium text-white capitalize tracking-tight leading-tight">{capitalize(sign)}</h2>
                      <p className="text-indigo-200/80 text-sm font-medium tracking-wide">{dateRange} • {element}</p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-4 pb-6 px-6 sm:px-8 bg-transparent">
                  <h3 className="text-sm uppercase tracking-wider text-indigo-200/80 mb-2 font-light">
                    Daily Horoscope <span className="normal-case text-indigo-200/70 text-sm">• {formattedDate}</span>
                  </h3>
                  <p className="text-white/90 text-base font-light leading-relaxed tracking-normal text-left mx-auto mb-6 font-satoshi">{content}</p>

                  {processedHoroscope?.peaceful_thought && (
                    <>
                      <div className="my-4 border-t border-white/10"></div>
                      <h3 className="text-sm uppercase tracking-wider text-indigo-200/80 mb-2 font-light">Nightly Reflection</h3>
                      <p className="text-white/90 text-base italic font-light leading-relaxed tracking-normal text-left mx-auto font-satoshi">&ldquo;{processedHoroscope.peaceful_thought}&rdquo;</p>
                    </>
                  )}
                </CardContent>

                <CardFooter className="pt-4 border-t border-white/10 flex-col items-stretch space-y-4 bg-transparent px-6 sm:px-8 pb-6">
                  <div className="border-t border-indigo-700/30 pt-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-xs uppercase mb-1 font-medium tracking-wider text-indigo-100/80">Best Match</h3>
                        <p className="font-light text-white text-lg leading-none capitalize">{processedHoroscope?.best_match || 'Coming soon'}</p>
                      </div>
                      <div>
                        <h3 className="text-xs uppercase mb-1 font-medium tracking-wider text-indigo-100/80">Inspirational Quote</h3>
                        <p className="font-light text-white text-lg leading-none">{processedHoroscope?.inspirational_quote ? `"${processedHoroscope.inspirational_quote}"` : 'Coming soon'}</p>
                        {processedHoroscope?.quote_author && (<p className="font-light text-indigo-200 text-xs mt-1">- {processedHoroscope.quote_author}</p>)}
                      </div>
                    </div>
                  </div>
                </CardFooter>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
