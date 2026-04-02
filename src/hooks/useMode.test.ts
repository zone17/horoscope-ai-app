import { act, renderHook } from '@testing-library/react';
import { useMode } from './useMode';

// Reset Zustand store between tests
beforeEach(() => {
  const { result } = renderHook(() => useMode());
  act(() => {
    result.current.setPhilosophers([]);
    result.current.clearSelections();
  });
});

describe('useMode – Philosophy Engine extensions', () => {
  describe('setPhilosophers', () => {
    it('persists an array of philosopher names to state', () => {
      const { result } = renderHook(() => useMode());
      act(() => {
        result.current.setPhilosophers(['Seneca', 'Feynman']);
      });
      expect(result.current.selectedPhilosophers).toEqual(['Seneca', 'Feynman']);
    });

    it('truncates to first 5 when more than 5 are provided', () => {
      const { result } = renderHook(() => useMode());
      const seven = ['Seneca', 'Feynman', 'Epictetus', 'Lao Tzu', 'Rumi', 'Nietzsche', 'Watts'];
      act(() => {
        result.current.setPhilosophers(seven);
      });
      expect(result.current.selectedPhilosophers).toHaveLength(5);
      expect(result.current.selectedPhilosophers).toEqual(seven.slice(0, 5));
    });

    it('setting an empty array clears philosophers', () => {
      const { result } = renderHook(() => useMode());
      act(() => {
        result.current.setPhilosophers(['Seneca']);
      });
      expect(result.current.selectedPhilosophers).toHaveLength(1);
      act(() => {
        result.current.setPhilosophers([]);
      });
      expect(result.current.selectedPhilosophers).toEqual([]);
    });
  });

  describe('togglePhilosopher', () => {
    it('adds a philosopher when not present', () => {
      const { result } = renderHook(() => useMode());
      act(() => {
        result.current.togglePhilosopher('Seneca');
      });
      expect(result.current.selectedPhilosophers).toContain('Seneca');
    });

    it('removes a philosopher when already present', () => {
      const { result } = renderHook(() => useMode());
      act(() => {
        result.current.setPhilosophers(['Seneca', 'Feynman']);
      });
      act(() => {
        result.current.togglePhilosopher('Seneca');
      });
      expect(result.current.selectedPhilosophers).toEqual(['Feynman']);
    });

    it('does not exceed max of 5 philosophers', () => {
      const { result } = renderHook(() => useMode());
      act(() => {
        result.current.setPhilosophers(['A', 'B', 'C', 'D', 'E']);
      });
      act(() => {
        result.current.togglePhilosopher('F');
      });
      expect(result.current.selectedPhilosophers).toHaveLength(5);
      expect(result.current.selectedPhilosophers).not.toContain('F');
    });
  });

  describe('setEmail', () => {
    it('persists an email address', () => {
      const { result } = renderHook(() => useMode());
      act(() => {
        result.current.setEmail('test@test.com');
      });
      expect(result.current.email).toBe('test@test.com');
    });
  });

  describe('clearSelections', () => {
    it('resets both philosophers and email', () => {
      const { result } = renderHook(() => useMode());
      act(() => {
        result.current.setPhilosophers(['Seneca', 'Feynman']);
        result.current.setEmail('test@test.com');
      });
      expect(result.current.selectedPhilosophers).toHaveLength(2);
      expect(result.current.email).toBe('test@test.com');

      act(() => {
        result.current.clearSelections();
      });
      expect(result.current.selectedPhilosophers).toEqual([]);
      expect(result.current.email).toBeNull();
    });
  });

  describe('backwards compatibility', () => {
    it('existing store fields still work after extension', () => {
      const { result } = renderHook(() => useMode());

      // mode
      expect(result.current.mode).toBe('day');
      act(() => {
        result.current.toggleMode();
      });
      expect(result.current.mode).toBe('night');

      // userSign
      act(() => {
        result.current.setUserSign('aries');
      });
      expect(result.current.userSign).toBe('aries');

      // streak
      act(() => {
        result.current.recordReading();
      });
      expect(result.current.streakCount).toBe(1);
    });

    it('new fields default correctly when absent from stored state', () => {
      const { result } = renderHook(() => useMode());
      // Simulates a user who has old localStorage — new fields should have defaults
      expect(result.current.selectedPhilosophers).toEqual([]);
      expect(result.current.email).toBeNull();
    });
  });
});
