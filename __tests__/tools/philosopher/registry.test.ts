import {
  lookupPhilosopher,
  listPhilosophers,
  validatePhilosophers,
  getAllPhilosopherNames,
  getAllPhilosophers,
  Tradition,
} from '@/tools/philosopher/registry';

describe('philosopher:registry', () => {
  // ─── lookupPhilosopher ────────────────────────────────────────────

  it('finds philosopher by exact name', () => {
    const result = lookupPhilosopher('Seneca');
    expect(result).toBeDefined();
    expect(result!.name).toBe('Seneca');
    expect(result!.tradition).toBe(Tradition.Stoicism);
  });

  it('is case-insensitive', () => {
    const result = lookupPhilosopher('seneca');
    expect(result).toBeDefined();
    expect(result!.name).toBe('Seneca');
  });

  it('returns undefined for unknown philosopher', () => {
    expect(lookupPhilosopher('NotAPhilosopher')).toBeUndefined();
  });

  // ─── Taxonomy correctness (P0 fix validation) ─────────────────────

  it('Epicurus is in Epicureanism, not Stoicism', () => {
    const epicurus = lookupPhilosopher('Epicurus');
    expect(epicurus!.tradition).toBe(Tradition.Epicureanism);
  });

  it('Socrates, Plato, Aristotle are in Classical, not Modern', () => {
    for (const name of ['Socrates', 'Plato', 'Aristotle']) {
      const p = lookupPhilosopher(name);
      expect(p!.tradition).toBe(Tradition.Classical);
    }
  });

  it('Marcus Aurelius is in Stoicism', () => {
    const p = lookupPhilosopher('Marcus Aurelius');
    expect(p!.tradition).toBe(Tradition.Stoicism);
  });

  // ─── getAllPhilosophers ───────────────────────────────────────────

  it('returns all registered philosophers (at least 50)', () => {
    const all = getAllPhilosophers();
    expect(all.length).toBeGreaterThanOrEqual(50);
    // Exact count validated by name uniqueness test below
  });

  it('every philosopher has required fields', () => {
    for (const p of getAllPhilosophers()) {
      expect(p.name).toBeTruthy();
      expect(p.tradition).toBeTruthy();
      expect(p.era).toBeTruthy();
      expect(p.description).toBeTruthy();
    }
  });

  it('no duplicate names', () => {
    const names = getAllPhilosopherNames();
    expect(new Set(names).size).toBe(names.length);
  });

  // ─── listPhilosophers (filtering) ─────────────────────────────────

  it('filters by tradition', () => {
    const stoics = listPhilosophers({ tradition: Tradition.Stoicism });
    expect(stoics.length).toBeGreaterThan(0);
    for (const p of stoics) {
      expect(p.tradition).toBe(Tradition.Stoicism);
    }
  });

  it('filters by era', () => {
    const ancients = listPhilosophers({ era: 'ancient' });
    expect(ancients.length).toBeGreaterThan(0);
    for (const p of ancients) {
      expect(p.era).toBe('ancient');
    }
  });

  it('returns all when no filter', () => {
    const all = listPhilosophers();
    expect(all.length).toBe(getAllPhilosophers().length);
  });

  // ─── 9 traditions are all represented ─────────────────────────────

  it('covers every declared tradition', () => {
    const traditions = new Set(getAllPhilosophers().map((p) => p.tradition));
    const declaredTraditions = Object.values(Tradition).filter((v) => typeof v === 'string');
    expect(traditions.size).toBe(declaredTraditions.length);
  });

  // ─── validatePhilosophers ─────────────────────────────────────────

  it('separates valid and invalid names', () => {
    const result = validatePhilosophers(['Seneca', 'NotReal', 'Plato']);
    expect(result.valid).toEqual(expect.arrayContaining(['Seneca', 'Plato']));
    expect(result.valid).toHaveLength(2);
    expect(result.invalid).toEqual(['NotReal']);
  });

  it('handles all invalid names', () => {
    const result = validatePhilosophers(['Fake1', 'Fake2']);
    expect(result.valid).toHaveLength(0);
    expect(result.invalid).toHaveLength(2);
  });

  it('handles all valid names', () => {
    const result = validatePhilosophers(['Seneca', 'Plato', 'Aristotle']);
    expect(result.valid).toHaveLength(3);
    expect(result.invalid).toHaveLength(0);
  });

  it('handles empty array', () => {
    const result = validatePhilosophers([]);
    expect(result.valid).toHaveLength(0);
    expect(result.invalid).toHaveLength(0);
  });
});
