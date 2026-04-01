'use client';

import { useState } from 'react';
import { Mail, Check, Loader2 } from 'lucide-react';
import { trackEvent } from '@/utils/analytics';

interface EmailCaptureProps {
  sign: string;
}

export default function EmailCapture({ sign }: EmailCaptureProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || status === 'loading') return;

    setStatus('loading');
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, sign }),
      });

      if (!res.ok) throw new Error('Failed');
      setStatus('success');
      trackEvent('email_subscribed', { sign });
    } catch {
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div className="mt-8 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex items-center gap-3">
        <Check className="h-5 w-5 text-emerald-400 shrink-0" />
        <p className="text-sm text-emerald-200/80 font-light">
          You are signed up. Daily readings for {sign.charAt(0).toUpperCase() + sign.slice(1)} are coming soon.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-5">
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-1">
          <Mail className="h-4 w-4 text-indigo-300/70 shrink-0" />
          <p className="text-sm text-white/90 font-normal">
            Your morning philosophy, delivered to your inbox
          </p>
        </div>
        <p className="text-xs text-indigo-200/60 font-light pl-6">
          Start each day with a fresh philosophical horoscope for your sign — sign up free.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          required
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-indigo-400/50 transition-colors font-light"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="px-4 py-2 rounded-lg bg-indigo-500/20 border border-indigo-400/30 text-sm text-indigo-200 hover:bg-indigo-500/30 transition-colors disabled:opacity-50 font-medium"
        >
          {status === 'loading' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Subscribe'
          )}
        </button>
      </form>

      {status === 'error' && (
        <p className="text-xs text-red-300/70 mt-2 font-light">
          Something went wrong. Please try again.
        </p>
      )}
    </div>
  );
}
