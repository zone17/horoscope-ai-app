'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useMode } from '@/hooks/useMode';
import { getPhilosopher } from '@/constants/philosophers';
import { capitalize } from '@/lib/utils';
import Link from 'next/link';
import ShareButton from './ShareButton';

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

interface ReadingDisplayProps {
  onEditCouncil: () => void;
}

export default function ReadingDisplay({ onEditCouncil }: ReadingDisplayProps) {
  const { userSign, selectedPhilosophers, mode, recordReading } = useMode();
  const [data, setData] = useState<HoroscopeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReading = useCallback(async () => {
    if (!userSign) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ sign: userSign, type: 'daily' });
      // Include philosopher selections if the API supports them
      if (selectedPhilosophers.length > 0) {
        params.set('philosophers', selectedPhilosophers.join(','));
      }

      const res = await fetch(`/api/horoscope?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch your reading');

      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
        recordReading();
      } else {
        throw new Error('Unexpected response format');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [userSign, selectedPhilosophers, recordReading]);

  useEffect(() => {
    fetchReading();
  }, [fetchReading]);

  // Format today's date
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  // Choose day vs night content
  const content =
    mode === 'night' && data?.peaceful_thought
      ? data.peaceful_thought
      : data?.message;

  // Loading skeleton
  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full max-w-2xl mx-auto px-4"
      >
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 sm:p-8">
          <div className="space-y-3 animate-pulse">
            <div className="h-6 bg-indigo-700/20 rounded w-2/3 mx-auto" />
            <div className="h-3 bg-indigo-700/10 rounded w-1/3 mx-auto mt-4" />
            <div className="mt-6 space-y-2">
              <div className="h-3 bg-indigo-700/10 rounded w-full" />
              <div className="h-3 bg-indigo-700/10 rounded w-full" />
              <div className="h-3 bg-indigo-700/10 rounded w-full" />
              <div className="h-3 bg-indigo-700/10 rounded w-5/6" />
              <div className="h-3 bg-indigo-700/10 rounded w-4/6" />
            </div>
            <div className="mt-6 space-y-2">
              <div className="h-3 bg-indigo-700/10 rounded w-full" />
              <div className="h-3 bg-indigo-700/10 rounded w-3/4" />
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Error state
  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full max-w-2xl mx-auto px-4"
      >
        <div className="bg-white/5 backdrop-blur-md border border-red-500/20 rounded-xl p-6 sm:p-8 text-center">
          <p className="text-red-300 text-sm mb-4">{error}</p>
          <button
            onClick={fetchReading}
            className="px-4 py-2 rounded-full bg-indigo-500/40 border border-indigo-400/30 text-sm text-white hover:bg-indigo-500/60 transition-all duration-300"
          >
            Try again
          </button>
        </div>
      </motion.div>
    );
  }

  if (!data || !userSign) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-2xl mx-auto px-4"
    >
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 sm:p-8">
        {/* Greeting */}
        <div className="text-center mb-6">
          <h2 className="font-display text-2xl sm:text-3xl text-[#F0EEFF] mb-1">
            {capitalize(userSign)}
          </h2>
          <p className="text-indigo-200/60 text-xs font-light tracking-wide">
            {formattedDate}
          </p>
        </div>

        {/* Philosopher council display */}
        {selectedPhilosophers.length > 0 && (
          <div className="mb-6">
            <p className="text-center text-indigo-200/50 text-xs uppercase tracking-wider mb-3">
              Your Philosopher Council
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {selectedPhilosophers.map((name) => {
                const p = getPhilosopher(name);
                return (
                  <span
                    key={name}
                    className="text-xs px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-400/20 text-indigo-200/80"
                  >
                    {p?.name || name}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Divider */}
        <div className="w-12 h-px bg-indigo-400/20 mx-auto mb-6" />

        {/* Full reading text */}
        <div className="mb-6">
          <p className="text-[#F0EEFF]/90 text-base font-light leading-relaxed font-sans whitespace-pre-line">
            {content}
          </p>
        </div>

        {/* Inspirational quote */}
        {data.inspirational_quote && (
          <blockquote className="border-l-2 border-indigo-400/30 pl-4 my-6">
            <p className="text-indigo-100/80 text-sm italic font-light leading-relaxed">
              &ldquo;{data.inspirational_quote}&rdquo;
            </p>
            {data.quote_author && (
              <cite className="block text-indigo-200/50 text-xs mt-2 not-italic">
                &mdash; {data.quote_author}
              </cite>
            )}
          </blockquote>
        )}

        {/* Peaceful thought */}
        {data.peaceful_thought && mode !== 'night' && (
          <div className="bg-white/[0.03] rounded-lg p-4 mb-6">
            <p className="text-indigo-200/50 text-xs uppercase tracking-wider mb-2">
              Tonight&apos;s Reflection
            </p>
            <p className="text-indigo-100/70 text-sm italic font-light leading-relaxed">
              {data.peaceful_thought}
            </p>
          </div>
        )}

        {/* Share button */}
        <div className="flex justify-center mt-6">
          <ShareButton
            sign={userSign}
            date={formattedDate}
            quote={data.inspirational_quote}
            quoteAuthor={data.quote_author}
          />
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-4 pt-6 border-t border-white/5">
          <button
            onClick={onEditCouncil}
            className="text-sm text-indigo-200/60 hover:text-indigo-200 transition-colors underline underline-offset-2"
          >
            Edit your council
          </button>
          <span className="hidden sm:inline text-indigo-200/20">|</span>
          <Link
            href={`/horoscope/${userSign.toLowerCase()}`}
            className="text-sm text-indigo-200/60 hover:text-indigo-200 transition-colors underline underline-offset-2"
          >
            Full {capitalize(userSign)} page
          </Link>
          <span className="hidden sm:inline text-indigo-200/20">|</span>
          <Link
            href="#horoscope"
            className="text-sm text-indigo-200/60 hover:text-indigo-200 transition-colors underline underline-offset-2"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            Browse all signs
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
