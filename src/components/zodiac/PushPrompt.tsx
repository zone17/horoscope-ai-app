'use client';

import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { trackEvent } from '@/utils/analytics';

interface PushPromptProps {
  sign: string;
}

export default function PushPrompt({ sign }: PushPromptProps) {
  const [visible, setVisible] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setPermission('unsupported');
      return;
    }

    const current = Notification.permission;
    setPermission(current);

    // Only show the prompt if permission hasn't been decided yet
    if (current === 'default') {
      // Delay showing so it doesn't appear on first render
      const timer = setTimeout(() => setVisible(true), 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  async function handleEnable() {
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      trackEvent('push_permission', { result, sign });

      if (result === 'granted') {
        // Register the service worker subscription (server push infra deferred)
        setVisible(false);
      }
    } catch {
      setVisible(false);
    }
  }

  if (!visible || permission !== 'default') return null;

  // Push-delivery server infra is deferred. The permission request works
  // (browser-level), but no server is currently configured to send pushes,
  // so even granted permissions yield no notifications. Hiding the prompt
  // until delivery ships avoids the misleading-CTA pattern flagged by Wave
  // 1A QA finding 3.3 / punch list 3.3. Re-enable by removing this guard
  // once /api/push/subscribe is wired.
  return null;

  // Disabled UI preserved below for the re-enable path.
  // eslint-disable-next-line no-unreachable
  return (
    <div className="mt-6 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-4 flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <Bell className="h-5 w-5 text-indigo-300 shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm text-white/90 font-light">
          Get your daily {sign.charAt(0).toUpperCase() + sign.slice(1)} reading delivered each morning.
        </p>
        <p className="text-xs text-indigo-200/50 mt-1 font-light">
          Coming soon — enable notifications to be first in line.
        </p>
        <button
          onClick={handleEnable}
          className="mt-3 text-xs font-medium px-4 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 hover:bg-indigo-500/30 transition-colors"
        >
          Enable notifications
        </button>
      </div>
      <button
        onClick={() => setVisible(false)}
        className="text-white/30 hover:text-white/60 transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
