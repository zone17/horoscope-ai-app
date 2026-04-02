import {
  PHILOSOPHERS,
  TRADITIONS,
  Tradition,
  getPhilosophersByTradition,
  getPhilosopher,
} from '@/constants/philosophers';

describe('PHILOSOPHERS constant', () => {
  it('has 50+ entries', () => {
    expect(PHILOSOPHERS.length).toBeGreaterThanOrEqual(50);
  });

  it('every philosopher has all required fields populated', () => {
    for (const p of PHILOSOPHERS) {
      expect(p.name).toBeTruthy();
      expect(p.tradition).toBeTruthy();
      expect(p.description).toBeTruthy();
      expect(p.sampleQuote).toBeTruthy();
      expect(typeof p.name).toBe('string');
      expect(typeof p.description).toBe('string');
      expect(typeof p.sampleQuote).toBe('string');
      expect(TRADITIONS).toContain(p.tradition);
    }
  });

  it('has no duplicate philosopher names', () => {
    const names = PHILOSOPHERS.map((p) => p.name);
    const unique = new Set(names);
    expect(unique.size).toBe(names.length);
  });

  it('includes all 14 original philosophers', () => {
    const names = PHILOSOPHERS.map((p) => p.name);
    const originals = [
      'Alan Watts',
      'Marcus Aurelius',
      'Lao Tzu',
      'Seneca',
      'Albert Einstein',
      'Epicurus',
      'Friedrich Nietzsche',
      'Plato',
      'Richard Feynman',
      'Aristotle',
      'Dr. Joe Dispenza',
      'Walter Russell',
      'Jiddu Krishnamurti',
      'Socrates',
    ];
    for (const original of originals) {
      expect(names).toContain(original);
    }
  });
});

describe('TRADITIONS', () => {
  it('has exactly 6 traditions', () => {
    expect(TRADITIONS).toHaveLength(6);
  });

  it('every tradition has at least 5 philosophers', () => {
    for (const tradition of TRADITIONS) {
      const count = PHILOSOPHERS.filter((p) => p.tradition === tradition).length;
      expect(count).toBeGreaterThanOrEqual(5);
    }
  });
});

describe('getPhilosophersByTradition', () => {
  it('returns only philosophers of the requested tradition', () => {
    const stoics = getPhilosophersByTradition(Tradition.Stoicism);
    expect(stoics.length).toBeGreaterThanOrEqual(5);
    for (const p of stoics) {
      expect(p.tradition).toBe(Tradition.Stoicism);
    }
  });

  it('returns an array for every tradition', () => {
    for (const tradition of TRADITIONS) {
      const result = getPhilosophersByTradition(tradition as Tradition);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    }
  });
});

describe('getPhilosopher', () => {
  it('returns the correct philosopher for a known name', () => {
    const marcus = getPhilosopher('Marcus Aurelius');
    expect(marcus).toBeDefined();
    expect(marcus!.name).toBe('Marcus Aurelius');
    expect(marcus!.tradition).toBe(Tradition.Stoicism);
  });

  it('returns undefined for a nonexistent philosopher', () => {
    const result = getPhilosopher('Nonexistent Person');
    expect(result).toBeUndefined();
  });
});
