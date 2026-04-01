import { track } from '@vercel/analytics';

/**
 * Track a custom analytics event.
 *
 * Wraps Vercel Analytics `track()` so every call site stays decoupled
 * from the underlying provider.
 */
export function trackEvent(
  name: string,
  props?: Record<string, string | number | boolean | null>
) {
  try {
    track(name, props ?? {});
  } catch {
    // Analytics should never break the app
  }
}

// ── Pre-defined event helpers ───────────────────────────────────────

export function trackSignSelected(sign: string) {
  trackEvent('sign_selected', { sign });
}

export function trackReadingOpened(sign: string) {
  trackEvent('reading_opened', { sign });
}

export function trackShareTapped(sign: string, method: 'native' | 'clipboard') {
  trackEvent('share_tapped', { sign, method });
}

export function trackNightModeToggled(mode: 'day' | 'night') {
  trackEvent('night_mode_toggled', { mode });
}

export function trackStreakDay(sign: string, count: number) {
  trackEvent('streak_day', { sign, count });
}
