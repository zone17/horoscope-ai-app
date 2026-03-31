'use client';

import { useEffect, useState, useCallback } from 'react';
import { Share2, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HoroscopeData {
  sign: string;
  message: string;
  best_match?: string;
  inspirational_quote?: string;
  quote_author?: string;
  peaceful_thought?: string;
  mood?: string;
}

interface SignPageClientProps {
  sign: string;
  symbol: string;
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function SignPageClient({ sign, symbol }: SignPageClientProps) {
  const [horoscope, setHoroscope] = useState<HoroscopeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        const apiBase =
          process.env.NEXT_PUBLIC_API_URL ||
          (typeof window !== 'undefined' && window.location.origin) ||
          'http://localhost:3000';

        const res = await fetch(`${apiBase}/api/horoscope?sign=${sign}&type=daily`, {
          cache: 'no-store',
        });

        if (!res.ok) throw new Error(`${res.status}`);
        const json = await res.json();

        if (!json.success || !json.data) throw new Error('No data');
        setHoroscope(json.data);
      } catch {
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [sign]);

  const shareUrl =
    typeof window !== 'undefined'
      ? window.location.href
      : `https://www.gettodayshoroscope.com/horoscope/${sign}`;

  const handleShare = useCallback(async () => {
    const shareData = {
      title: `${capitalize(sign)} Horoscope Today ${symbol}`,
      text: horoscope?.message?.slice(0, 140) ?? `Today's ${capitalize(sign)} horoscope`,
      url: shareUrl,
    };

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // User cancelled or share failed — fall through to copy
      }
    }

    // Fallback: copy link to clipboard
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // clipboard API unavailable
    }
  }, [sign, symbol, horoscope, shareUrl]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-12 h-12 rounded-full border-t-2 border-b-2 border-purple-300 animate-spin" />
      </div>
    );
  }

  if (isError || !horoscope) {
    return (
      <div className="text-center py-16">
        <p className="text-white/60 mb-4 font-light">
          The cosmos is temporarily unreachable. Try again in a moment.
        </p>
        <Button
          variant="outline"
          className="border-white/10 hover:border-white/20 text-white/80"
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </div>
    );
  }

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="space-y-8">
      {/* Reading card */}
      <div className="rounded-2xl border border-white/10 backdrop-blur-md bg-white/5 p-6 sm:p-8">
        <p className="text-indigo-200/60 text-xs uppercase tracking-widest mb-4 font-light">
          Daily Horoscope &bull; {today}
        </p>

        <p className="text-white/90 text-base sm:text-lg font-light leading-relaxed">
          {horoscope.message}
        </p>

        {horoscope.peaceful_thought && (
          <>
            <div className="my-6 border-t border-white/10" />
            <p className="text-indigo-200/70 text-sm uppercase tracking-widest mb-3 font-light">
              Nightly Reflection
            </p>
            <p className="text-white/80 text-base italic font-light leading-relaxed">
              &ldquo;{horoscope.peaceful_thought}&rdquo;
            </p>
          </>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4">
        {horoscope.best_match && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-wider text-indigo-100/60 mb-1 font-light">
              Best Match
            </p>
            <p className="text-white text-lg font-light capitalize">{horoscope.best_match}</p>
          </div>
        )}
        {horoscope.inspirational_quote && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-wider text-indigo-100/60 mb-1 font-light">
              Quote
            </p>
            <p className="text-white text-sm italic font-light line-clamp-3">
              &ldquo;{horoscope.inspirational_quote}&rdquo;
            </p>
            {horoscope.quote_author && (
              <p className="text-indigo-200/60 text-xs mt-1 font-light">
                — {horoscope.quote_author}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Share button */}
      <div className="flex justify-end">
        <Button
          onClick={handleShare}
          variant="outline"
          className="gap-2 border-white/10 hover:border-white/20 text-white/70 hover:text-white transition-all"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 text-emerald-400" />
              Link copied
            </>
          ) : (
            <>
              <Share2 className="h-4 w-4" />
              Share
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
