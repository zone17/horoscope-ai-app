'use client';

import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useMode } from '@/hooks/useMode';
import SignStep from './SignStep';
import PhilosopherStep from './PhilosopherStep';
import EmailGate from './EmailGate';
import ReadingDisplay from './ReadingDisplay';

type FlowState = 'pickSign' | 'pickPhilosophers' | 'emailGate' | 'reading';

export default function HomeFlow() {
  const { userSign, selectedPhilosophers, email, setPhilosophers } = useMode();
  const [step, setStep] = useState<FlowState>('pickSign');
  const [hydrated, setHydrated] = useState(false);

  // Wait for Zustand hydration before deciding initial step
  useEffect(() => {
    setHydrated(true);
  }, []);

  // Determine initial step based on persisted state (only on first hydration)
  useEffect(() => {
    if (!hydrated) return;

    // Return visitors with sign + selections + email: go straight to reading
    if (userSign && selectedPhilosophers.length > 0 && email) {
      setStep('reading');
    } else if (userSign && selectedPhilosophers.length > 0) {
      // Have sign + philosophers but no email: show gate
      setStep('emailGate');
    } else if (userSign) {
      // Have sign but no philosophers: go to philosopher selection
      setStep('pickPhilosophers');
    } else {
      setStep('pickSign');
    }
    // Only run on hydration
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  // Don't render until hydrated to avoid flash of wrong step
  if (!hydrated) {
    return (
      <div className="py-16 text-center">
        <div className="inline-flex space-x-2 items-center">
          <div className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce" />
          <div
            className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce"
            style={{ animationDelay: '150ms' }}
          />
          <div
            className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce"
            style={{ animationDelay: '300ms' }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 sm:py-12">
      <AnimatePresence mode="wait">
        {step === 'pickSign' && (
          <SignStep
            key="sign"
            onSignSelected={() => setStep('pickPhilosophers')}
          />
        )}

        {step === 'pickPhilosophers' && (
          <PhilosopherStep
            key="philosophers"
            onContinue={() => {
              // Skip gate for return visitors who already gave email
              if (email) {
                setStep('reading');
              } else {
                setStep('emailGate');
              }
            }}
            onBack={() => setStep('pickSign')}
          />
        )}

        {step === 'emailGate' && (
          <EmailGate
            key="emailGate"
            onUnlocked={() => setStep('reading')}
          />
        )}

        {step === 'reading' && (
          <ReadingDisplay
            key="reading"
            onEditCouncil={() => {
              setPhilosophers([]);
              setStep('pickPhilosophers');
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
