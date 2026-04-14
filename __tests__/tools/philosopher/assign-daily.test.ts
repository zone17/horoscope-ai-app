import { assignDaily } from '@/tools/philosopher/assign-daily';

describe('philosopher:assign-daily', () => {
  // ─── Determinism ──────────────────────────────────────────────────

  it('returns same philosopher for same inputs', () => {
    const result1 = assignDaily({ sign: 'aries', date: '2026-04-14' });
    const result2 = assignDaily({ sign: 'aries', date: '2026-04-14' });
    expect(result1.philosopher).toBe(result2.philosopher);
  });

  it('returns different philosopher for different dates', () => {
    const day1 = assignDaily({ sign: 'aries', date: '2026-04-14' });
    const day2 = assignDaily({ sign: 'aries', date: '2026-04-15' });
    // Not guaranteed to differ on adjacent days (modular arithmetic),
    // but over 12 days at least 2 different philosophers should appear
    const philosophers = Array.from({ length: 12 }, (_, i) =>
      assignDaily({ sign: 'aries', date: `2026-04-${String(i + 1).padStart(2, '0')}` }).philosopher
    );
    expect(new Set(philosophers).size).toBeGreaterThan(1);
  });

  it('returns different philosopher for different signs on same date', () => {
    const aries = assignDaily({ sign: 'aries', date: '2026-04-14' });
    const leo = assignDaily({ sign: 'leo', date: '2026-04-14' });
    expect(aries.philosopher).not.toBe(leo.philosopher);
  });

  // ─── Default mode (no council) ────────────────────────────────────

  it('assigns from default rotation when no council provided', () => {
    const result = assignDaily({ sign: 'aries', date: '2026-04-14' });
    expect(result.philosopher).toBeTruthy();
    expect(result.reason).toBeTruthy();
    // Default rotation includes tradition info in reason
    expect(result.reason).not.toContain('personal council');
  });

  it('always returns a philosopher from the default 12', () => {
    const DEFAULT_ROTATION = [
      'Alan Watts', 'Marcus Aurelius', 'Lao Tzu', 'Seneca',
      'Albert Einstein', 'Epicurus', 'Friedrich Nietzsche', 'Plato',
      'Richard Feynman', 'Aristotle', 'Dr. Joe Dispenza', 'Walter Russell',
    ];
    // Check all 12 signs across 30 days
    const signs = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
      'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'];
    for (const sign of signs) {
      for (let d = 1; d <= 30; d++) {
        const date = `2026-04-${String(d).padStart(2, '0')}`;
        const result = assignDaily({ sign, date });
        expect(DEFAULT_ROTATION).toContain(result.philosopher);
      }
    }
  });

  // ─── Council mode ─────────────────────────────────────────────────

  it('assigns from council when valid philosophers provided', () => {
    const result = assignDaily({
      sign: 'aries',
      council: ['Seneca', 'Alan Watts', 'Rumi'],
      date: '2026-04-14',
    });
    expect(['Seneca', 'Alan Watts', 'Rumi']).toContain(result.philosopher);
    expect(result.reason).toContain('personal council');
  });

  it('rotates through council across days', () => {
    const council = ['Seneca', 'Alan Watts', 'Rumi'];
    const assignments = Array.from({ length: 30 }, (_, i) =>
      assignDaily({
        sign: 'aries',
        council,
        date: `2026-04-${String(i + 1).padStart(2, '0')}`,
      }).philosopher
    );
    // Should see all 3 council members across 30 days
    for (const member of council) {
      expect(assignments).toContain(member);
    }
  });

  it('returns the sole philosopher when council has one member', () => {
    const result = assignDaily({
      sign: 'aries',
      council: ['Seneca'],
      date: '2026-04-14',
    });
    expect(result.philosopher).toBe('Seneca');
  });

  // ─── Council validation ───────────────────────────────────────────

  it('falls back to default when all council names are invalid', () => {
    const result = assignDaily({
      sign: 'aries',
      council: ['NotAPhilosopher', 'AlsoFake'],
      date: '2026-04-14',
    });
    // Should use default rotation, not mention council
    expect(result.reason).not.toContain('personal council');
  });

  it('filters invalid names and uses valid ones', () => {
    const result = assignDaily({
      sign: 'aries',
      council: ['Seneca', 'NotAPhilosopher', 'Plato'],
      date: '2026-04-14',
    });
    expect(['Seneca', 'Plato']).toContain(result.philosopher);
    expect(result.reason).toContain('personal council');
    // Reason should mention 2 philosophers (the valid ones)
    expect(result.reason).toContain('2 philosopher');
  });

  // ─── Sign validation ──────────────────────────────────────────────

  it('throws on invalid sign', () => {
    expect(() => assignDaily({ sign: 'unicorn', date: '2026-04-14' }))
      .toThrow('Invalid sign');
  });

  it('accepts case-insensitive signs', () => {
    const result = assignDaily({ sign: 'ARIES', date: '2026-04-14' });
    expect(result.philosopher).toBeTruthy();
  });

  // ─── Date handling ────────────────────────────────────────────────

  it('defaults to today when no date provided', () => {
    const result = assignDaily({ sign: 'aries' });
    expect(result.philosopher).toBeTruthy();
    expect(result.reason).toBeTruthy();
  });
});
