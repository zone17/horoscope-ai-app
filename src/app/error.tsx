'use client';

import { useEffect } from 'react';
import Link from 'next/link';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950 p-4">
      <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-lg p-8 md:p-12 rounded-xl shadow-lg border border-white/50 dark:border-slate-700/50 max-w-lg w-full text-center">
        <h1 className="text-2xl md:text-3xl font-bold text-red-500 dark:text-red-400 mb-6">Cosmic Disturbance Detected</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Something disrupted our cosmic alignment. Our astrological engineers have been notified.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button
            onClick={reset}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-300"
          >
            Try Again
          </button>
          <Link 
            href="/" 
            className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium py-3 px-6 rounded-lg transition-colors duration-300"
          >
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
} 