import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Mode = 'day' | 'night';

interface ModeState {
  mode: Mode;
  toggleMode: () => void;
  setMode: (mode: Mode) => void;
  userSign: string | null;
  setUserSign: (sign: string) => void;
  // Reading streak
  lastReadDate: string | null;
  streakCount: number;
  recordReading: () => void;
}

/**
 * Get today's date as YYYY-MM-DD in local timezone.
 */
function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Check if dateA is exactly one day before dateB (both YYYY-MM-DD).
 */
function isYesterday(dateA: string, dateB: string): boolean {
  const a = new Date(dateA + 'T00:00:00');
  const b = new Date(dateB + 'T00:00:00');
  const diff = b.getTime() - a.getTime();
  return diff === 86_400_000;
}

/**
 * Sync mode to document dataset for CSS custom properties (C4).
 */
function syncModeToDOM(mode: Mode): void {
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.mode = mode;
  }
}

export const useMode = create<ModeState>()(
  persist(
    (set, get) => ({
      mode: 'day' as Mode,
      toggleMode: () => set((state) => {
        const newMode: Mode = state.mode === 'day' ? 'night' : 'day';
        syncModeToDOM(newMode);
        return { mode: newMode };
      }),
      setMode: (mode: Mode) => {
        syncModeToDOM(mode);
        set({ mode });
      },
      userSign: null,
      setUserSign: (sign: string) => set({ userSign: sign }),

      // Streak state
      lastReadDate: null,
      streakCount: 0,

      recordReading: () => {
        const today = todayStr();
        const { lastReadDate, streakCount } = get();

        if (lastReadDate === today) {
          // Already recorded today
          return;
        }

        if (lastReadDate && isYesterday(lastReadDate, today)) {
          // Consecutive day — increment streak
          set({ lastReadDate: today, streakCount: streakCount + 1 });
        } else {
          // First read or gap — reset to 1
          set({ lastReadDate: today, streakCount: 1 });
        }
      },
    }),
    {
      name: 'horoscope-mode-storage',
      onRehydrateStorage: () => {
        return (state?: ModeState) => {
          // Sync mode to DOM after store rehydration (C4)
          if (state?.mode) {
            syncModeToDOM(state.mode);
          }
        };
      },
    }
  )
);
