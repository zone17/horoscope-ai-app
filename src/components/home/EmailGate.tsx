'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Loader2, Sparkles } from 'lucide-react';
import { useMode } from '@/hooks/useMode';
import { getPhilosopher } from '@/constants/philosophers';
import { capitalize } from '@/lib/utils';
import { trackEvent } from '@/utils/analytics';

interface EmailGateProps {
  /** Called after successful email submission to advance the flow */
  onUnlocked: () => void;
}

/**
 * Soft email gate shown between philosopher selection and full reading reveal.
 *
 * Shows a 2-sentence reading teaser + a featured quote from one of the user's
 * selected philosophers, then asks for email to unlock. Return visitors
 * (email already in Zustand) skip the gate entirely — handled by HomeFlow.
 */
export default function EmailGate({ onUnlocked }: EmailGateProps) {
  const { userSign, selectedPhilosophers, setEmail } = useMode();
  const [inputEmail, setInputEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  // Pick a featured philosopher for the teaser quote
  const featuredName = selectedPhilosophers[0];
  const featured = featuredName ? getPhilosopher(featuredName) : null;

  const signName = userSign ? capitalize(userSign) : 'Your sign';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!inputEmail || status === 'loading' || !userSign) return;

    // Basic client-side validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inputEmail)) {
      setErrorMsg('Please enter a valid email address.');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inputEmail,
          sign: userSign,
          philosophers: selectedPhilosophers,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to subscribe');
      }

      // Persist email in Zustand (gates future visits)
      setEmail(inputEmail);
      trackEvent('email_gate_unlocked', { sign: userSign });
      onUnlocked();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setStatus('error');
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-2xl mx-auto px-4"
    >
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 sm:p-8">
        {/* Teaser header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-indigo-400/70" />
            <span className="text-xs uppercase tracking-wider text-indigo-200/50">
              Reading Preview
            </span>
            <Sparkles className="h-4 w-4 text-indigo-400/70" />
          </div>
          <h2 className="font-display text-xl sm:text-2xl text-[#F0EEFF] mb-2">
            Your {signName} reading is ready
          </h2>
          <p className="text-indigo-200/70 text-sm font-light leading-relaxed max-w-md mx-auto">
            {selectedPhilosophers.length > 0
              ? `${selectedPhilosophers.join(', ')} ${selectedPhilosophers.length === 1 ? 'has' : 'have'} guidance waiting for you today.`
              : 'Your personalized philosophical guidance awaits.'}
          </p>
        </div>

        {/* Featured quote teaser */}
        {featured && featured.sampleQuote && (
          <blockquote className="border-l-2 border-indigo-400/30 pl-4 my-6">
            <p className="text-indigo-100/80 text-sm italic font-light leading-relaxed">
              &ldquo;{featured.sampleQuote}&rdquo;
            </p>
            <cite className="block text-indigo-200/50 text-xs mt-2 not-italic">
              &mdash; {featured.name}
            </cite>
          </blockquote>
        )}

        {/* Blurred teaser text */}
        <div className="relative mb-6">
          <div className="select-none" aria-hidden="true">
            <p className="text-[#F0EEFF]/40 text-base font-light leading-relaxed blur-[6px]">
              Today the stars align with ancient wisdom to reveal a truth you have been circling for weeks.
              The path forward requires both courage and patience, a paradox your council understands well.
            </p>
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0C0B1E]/80" />
        </div>

        {/* Divider */}
        <div className="w-12 h-px bg-indigo-400/20 mx-auto mb-6" />

        {/* Email capture */}
        <div className="text-center mb-4">
          <p className="text-[#F0EEFF] text-base font-light">
            Your full reading is ready. Where should we send it?
          </p>
          <p className="text-indigo-200/50 text-xs mt-1 font-light">
            Free daily readings from your philosopher council
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <div className="relative flex-1">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-300/40" />
            <input
              type="email"
              required
              placeholder="your@email.com"
              value={inputEmail}
              onChange={(e) => {
                setInputEmail(e.target.value);
                if (status === 'error') setStatus('idle');
              }}
              className="w-full rounded-lg bg-white/5 border border-white/10 pl-10 pr-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-indigo-400/50 transition-colors font-light"
            />
          </div>
          <button
            type="submit"
            disabled={status === 'loading'}
            className="px-6 py-2.5 rounded-lg bg-indigo-500/30 border border-indigo-400/30 text-sm text-indigo-100 hover:bg-indigo-500/50 transition-all duration-300 disabled:opacity-50 font-medium whitespace-nowrap"
          >
            {status === 'loading' ? (
              <span className="flex items-center gap-2 justify-center">
                <Loader2 className="h-4 w-4 animate-spin" />
                Unlocking...
              </span>
            ) : (
              'Unlock Reading'
            )}
          </button>
        </form>

        {status === 'error' && errorMsg && (
          <p className="text-xs text-red-300/70 mt-3 text-center font-light">
            {errorMsg}
          </p>
        )}

        {/* Skip link for those who prefer not to share email */}
        <button
          onClick={onUnlocked}
          className="block mx-auto mt-4 text-xs text-indigo-200/60 hover:text-indigo-200/80 transition-colors underline underline-offset-2"
        >
          Skip for now
        </button>
      </div>
    </motion.div>
  );
}
