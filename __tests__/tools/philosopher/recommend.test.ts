import { recommendPhilosophers } from '@/tools/philosopher/recommend';
import { lookupPhilosopher, Tradition } from '@/tools/philosopher/registry';

describe('philosopher:recommend', () => {
  // ─── Basic output shape ───────────────────────────────────────────

  it('returns 5 recommendations by default', () => {
    const result = recommendPhilosophers({ sign: 'aries' });
    expect(result.recommended).toHaveLength(5);
  });

  it('each recommendation has name and reason', () => {
    const result = recommendPhilosophers({ sign: 'aries' });
    for (const rec of result.recommended) {
      expect(rec.name).toBeTruthy();
      expect(rec.reason).toBeTruthy();
    }
  });

  it('all recommended names are valid philosophers', () => {
    const result = recommendPhilosophers({ sign: 'aries' });
    for (const rec of result.recommended) {
      expect(lookupPhilosopher(rec.name)).toBeDefined();
    }
  });

  // ─── Determinism ──────────────────────────────────────────────────

  it('same sign always gets same recommendations', () => {
    const r1 = recommendPhilosophers({ sign: 'aries' });
    const r2 = recommendPhilosophers({ sign: 'aries' });
    expect(r1.recommended.map((r) => r.name)).toEqual(
      r2.recommended.map((r) => r.name)
    );
  });

  it('different signs get different recommendations', () => {
    const aries = recommendPhilosophers({ sign: 'aries' });
    const cancer = recommendPhilosophers({ sign: 'cancer' });
    const ariesNames = aries.recommended.map((r) => r.name);
    const cancerNames = cancer.recommended.map((r) => r.name);
    // At least some should differ (different elements = different affinity traditions)
    expect(ariesNames).not.toEqual(cancerNames);
  });

  // ─── Element-to-tradition affinity ────────────────────────────────

  it('Fire sign gets mostly Stoicism + Poetry & Soul philosophers', () => {
    const result = recommendPhilosophers({ sign: 'aries', count: 5 });
    const affinityCount = result.recommended.filter((rec) => {
      const p = lookupPhilosopher(rec.name);
      return p && (p.tradition === Tradition.Stoicism || p.tradition === Tradition.PoetrySoul);
    }).length;
    // At least count-1 should be from affinity traditions (1 wildcard slot)
    expect(affinityCount).toBeGreaterThanOrEqual(3);
  });

  it('Water sign gets mostly Eastern Wisdom + Spiritual + Poetry', () => {
    const result = recommendPhilosophers({ sign: 'pisces', count: 5 });
    const affinityCount = result.recommended.filter((rec) => {
      const p = lookupPhilosopher(rec.name);
      return p && (
        p.tradition === Tradition.EasternWisdom ||
        p.tradition === Tradition.SpiritualLeaders ||
        p.tradition === Tradition.PoetrySoul
      );
    }).length;
    expect(affinityCount).toBeGreaterThanOrEqual(3);
  });

  // ─── Wildcard inclusion ───────────────────────────────────────────

  it('includes at least 1 wildcard when count > 1', () => {
    const result = recommendPhilosophers({ sign: 'aries', count: 5 });
    const wildcards = result.recommended.filter((rec) =>
      rec.reason.includes('surprising pairing')
    );
    expect(wildcards.length).toBeGreaterThanOrEqual(1);
  });

  it('no wildcard when count is 1', () => {
    const result = recommendPhilosophers({ sign: 'aries', count: 1 });
    expect(result.recommended).toHaveLength(1);
    expect(result.recommended[0].reason).not.toContain('surprising pairing');
  });

  // ─── Count handling ───────────────────────────────────────────────

  it('respects custom count', () => {
    const result = recommendPhilosophers({ sign: 'aries', count: 3 });
    expect(result.recommended).toHaveLength(3);
  });

  it('clamps count to minimum 1', () => {
    const result = recommendPhilosophers({ sign: 'aries', count: 0 });
    expect(result.recommended.length).toBeGreaterThanOrEqual(1);
  });

  it('clamps count to maximum 20', () => {
    const result = recommendPhilosophers({ sign: 'aries', count: 100 });
    expect(result.recommended.length).toBeLessThanOrEqual(20);
  });

  // ─── No duplicates ────────────────────────────────────────────────

  it('never recommends the same philosopher twice', () => {
    const result = recommendPhilosophers({ sign: 'aries', count: 20 });
    const names = result.recommended.map((r) => r.name);
    expect(new Set(names).size).toBe(names.length);
  });

  // ─── All 12 signs work ───────────────────────────────────────────

  it('works for all 12 signs', () => {
    const signs = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
      'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'];
    for (const sign of signs) {
      const result = recommendPhilosophers({ sign });
      expect(result.recommended.length).toBeGreaterThan(0);
    }
  });

  // ─── Validation ───────────────────────────────────────────────────

  it('throws on invalid sign', () => {
    expect(() => recommendPhilosophers({ sign: 'unicorn' })).toThrow('Invalid sign');
  });

  it('accepts case-insensitive signs', () => {
    const result = recommendPhilosophers({ sign: 'ARIES' });
    expect(result.recommended.length).toBeGreaterThan(0);
  });
});
