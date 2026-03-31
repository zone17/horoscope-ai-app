import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Mode = 'day' | 'night';

interface ModeState {
  mode: Mode;
  toggleMode: () => void;
  setMode: (mode: Mode) => void;
  userSign: string | null;
  setUserSign: (sign: string) => void;
}

export const useMode = create<ModeState>()(
  persist(
    (set) => ({
      mode: 'day',
      toggleMode: () => set((state) => ({ mode: state.mode === 'day' ? 'night' : 'day' })),
      setMode: (mode: Mode) => set({ mode }),
      userSign: null,
      setUserSign: (sign: string) => set({ userSign: sign }),
    }),
    {
      name: 'horoscope-mode-storage',
    }
  )
);
