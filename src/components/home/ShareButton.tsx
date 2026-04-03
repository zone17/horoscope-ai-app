'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface ShareButtonProps {
  sign: string;
  date: string;
  quote?: string;
  quoteAuthor?: string;
}

export default function ShareButton({
  sign,
  date,
  quote,
  quoteAuthor,
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const signCapitalized = sign.charAt(0).toUpperCase() + sign.slice(1);
  const shareTitle = `${signCapitalized} Horoscope \u2022 ${date}`;
  const shareText = quote
    ? `"${quote}"${quoteAuthor ? ` \u2014 ${quoteAuthor}` : ''}`
    : `${signCapitalized} daily horoscope`;
  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/horoscope/${sign.toLowerCase()}`
      : `https://gettodayshoroscope.com/horoscope/${sign.toLowerCase()}`;

  async function handleShare() {
    // Try Web Share API first
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch (err) {
        // User cancelled or API failed — fall through to clipboard
        if (err instanceof Error && err.name === 'AbortError') return;
      }
    }

    // Clipboard fallback
    const fallbackText = `${shareTitle}\n\n${shareText}\n\n${shareUrl}`;
    try {
      await navigator.clipboard.writeText(fallbackText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Last resort: prompt
      window.prompt('Copy this link:', shareUrl);
    }
  }

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={handleShare}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-sm text-indigo-200/70 hover:text-indigo-100 hover:bg-white/10 hover:border-white/20 transition-all duration-300"
      aria-label="Share this reading"
    >
      {copied ? (
        <>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-4 h-4 text-green-400"
          >
            <path
              fillRule="evenodd"
              d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
              clipRule="evenodd"
            />
          </svg>
          <span>Copied!</span>
        </>
      ) : (
        <>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-4 h-4"
          >
            <path d="M13 4.5a2.5 2.5 0 11.702 1.737L6.97 9.604a2.518 2.518 0 010 .792l6.733 3.367a2.5 2.5 0 11-.671 1.341l-6.733-3.367a2.5 2.5 0 110-3.474l6.733-3.367A2.52 2.52 0 0113 4.5z" />
          </svg>
          <span>Share</span>
        </>
      )}
    </motion.button>
  );
}
