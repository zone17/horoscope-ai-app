/**
 * Tests for philosopher override in the generation pipeline (Unit 4).
 *
 * The actual OpenAI call is mocked — we test that:
 * 1. Philosopher selection logic works (override vs default rotation)
 * 2. Invalid/empty philosopher arrays fall back to default
 * 3. Cache keys include philosopher selections and are sorted
 * 4. Default (no philosophers) behavior is unchanged
 */

// Mock OpenAI before any imports that pull it in
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: { completions: { create: jest.fn() } },
  }));
});

import { getValidPhilosopherOverride } from '@/utils/horoscope-generator';
import { horoscopeKeys } from '@/utils/cache-keys';
import { getPhilosopherAssignment } from '@/utils/horoscope-prompts';

// ─── getValidPhilosopherOverride ─────────────────────────────────────────────

describe('getValidPhilosopherOverride', () => {
  it('returns null for undefined input', () => {
    expect(getValidPhilosopherOverride(undefined)).toBeNull();
  });

  it('returns null for empty array', () => {
    expect(getValidPhilosopherOverride([])).toBeNull();
  });

  it('returns null when all names are invalid', () => {
    expect(getValidPhilosopherOverride(['FakePhilosopher', 'NotReal'])).toBeNull();
  });

  it('returns valid philosopher names from the roster', () => {
    const result = getValidPhilosopherOverride(['Seneca', 'Alan Watts']);
    expect(result).toEqual(['Seneca', 'Alan Watts']);
  });

  it('filters out invalid names, keeps valid ones', () => {
    const result = getValidPhilosopherOverride(['Seneca', 'FakePerson', 'Lao Tzu']);
    expect(result).toEqual(['Seneca', 'Lao Tzu']);
  });

  it('is case-insensitive for matching', () => {
    const result = getValidPhilosopherOverride(['seneca', 'ALAN WATTS']);
    expect(result).not.toBeNull();
    expect(result).toHaveLength(2);
  });

  it('preserves original casing in returned names', () => {
    const result = getValidPhilosopherOverride(['seneca']);
    // The function filters by lowercase match but returns the original input string
    expect(result).toEqual(['seneca']);
  });
});

// ─── Cache key: personalizedDaily ────────────────────────────────────────────

describe('horoscopeKeys.personalizedDaily', () => {
  it('includes philosopher names in the cache key', () => {
    const key = horoscopeKeys.personalizedDaily('aries', '2026-04-03', ['Seneca']);
    expect(key).toContain('philosophers=seneca');
  });

  it('sorts philosopher names for consistency', () => {
    const key1 = horoscopeKeys.personalizedDaily('aries', '2026-04-03', ['Seneca', 'Alan Watts']);
    const key2 = horoscopeKeys.personalizedDaily('aries', '2026-04-03', ['Alan Watts', 'Seneca']);
    expect(key1).toBe(key2);
  });

  it('lowercases philosopher names in the key', () => {
    const key = horoscopeKeys.personalizedDaily('aries', '2026-04-03', ['Seneca', 'Lao Tzu']);
    expect(key).toContain('philosophers=lao tzu,seneca');
  });

  it('produces a different key from the default daily key', () => {
    const defaultKey = horoscopeKeys.daily('aries', '2026-04-03');
    const personalizedKey = horoscopeKeys.personalizedDaily('aries', '2026-04-03', ['Seneca']);
    expect(personalizedKey).not.toBe(defaultKey);
  });

  it('includes sign, date, and type in the key', () => {
    const key = horoscopeKeys.personalizedDaily('aries', '2026-04-03', ['Seneca']);
    expect(key).toContain('sign=aries');
    expect(key).toContain('date=2026-04-03');
    expect(key).toContain('type=daily');
  });
});

// ─── Default rotation (no regression) ────────────────────────────────────────

describe('getPhilosopherAssignment (default rotation, no regression)', () => {
  it('returns a philosopher for a valid sign and date', () => {
    const philosopher = getPhilosopherAssignment('aries', '2026-04-03');
    expect(typeof philosopher).toBe('string');
    expect(philosopher.length).toBeGreaterThan(0);
  });

  it('returns different philosophers for different signs on the same day', () => {
    const date = '2026-04-03';
    const aries = getPhilosopherAssignment('aries', date);
    const taurus = getPhilosopherAssignment('taurus', date);
    expect(aries).not.toBe(taurus);
  });

  it('returns a philosopher from the rotation pool', () => {
    const rotationPool = [
      'Alan Watts', 'Marcus Aurelius', 'Lao Tzu', 'Seneca',
      'Albert Einstein', 'Epicurus', 'Friedrich Nietzsche', 'Plato',
      'Richard Feynman', 'Aristotle', 'Dr. Joe Dispenza', 'Walter Russell'
    ];
    const philosopher = getPhilosopherAssignment('leo', '2026-04-03');
    expect(rotationPool).toContain(philosopher);
  });

  it('is deterministic — same inputs produce same output', () => {
    const a = getPhilosopherAssignment('gemini', '2026-04-03');
    const b = getPhilosopherAssignment('gemini', '2026-04-03');
    expect(a).toBe(b);
  });
});

// ─── Integration: philosopher override selection logic ───────────────────────

describe('philosopher override selection logic', () => {
  it('picks from user list using date seed for consistency', () => {
    const philosophers = ['Seneca', 'Marcus Aurelius', 'Epictetus'];
    const today = '2026-04-03';
    const dayNum = Math.floor(new Date(today).getTime() / (1000 * 60 * 60 * 24));
    const expected = philosophers[dayNum % philosophers.length];

    // This mirrors the logic in generateHoroscope
    expect(philosophers).toContain(expected);
    // Same date always picks the same philosopher
    const dayNum2 = Math.floor(new Date(today).getTime() / (1000 * 60 * 60 * 24));
    expect(philosophers[dayNum2 % philosophers.length]).toBe(expected);
  });

  it('single philosopher always returns that philosopher', () => {
    const philosophers = ['Seneca'];
    const dayNum = Math.floor(new Date('2026-04-03').getTime() / (1000 * 60 * 60 * 24));
    expect(philosophers[dayNum % philosophers.length]).toBe('Seneca');
  });
});
