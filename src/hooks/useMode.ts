import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Mode = 'day' | 'night';

interface ModeState {
  mode: Mode;
  toggleMode: () => void;
  setMode: (mode: Mode) => void;
}

export const useMode = create<ModeState>()(
  persist(
    (set) => ({
      mode: 'day',
      toggleMode: () => set((state) => ({ mode: state.mode === 'day' ? 'night' : 'day' })),
      setMode: (mode: Mode) => set({ mode }),
    }),
    {
      name: 'horoscope-mode-storage',
    }
  )
); 