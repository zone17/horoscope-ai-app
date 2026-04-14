import { buildCacheKey } from '@/tools/cache/keys';

describe('cache:keys — buildCacheKey', () => {
  // ─── Daily key format (no council) ─────────────────────────────────

  it('returns daily key format when no council provided', () => {
    const key = buildCacheKey({
      sign: 'aries',
      philosopher: 'Seneca',
      date: '2026-04-14',
    });
    expect(key).toBe('horoscope:daily:aries:2026-04-14:seneca');
  });

  it('normalizes sign and philosopher to lowercase', () => {
    const key = buildCacheKey({
      sign: 'ARIES',
      philosopher: 'Marcus Aurelius',
      date: '2026-04-14',
    });
    expect(key).toBe('horoscope:daily:aries:2026-04-14:marcus aurelius');
  });

  it('trims whitespace from all inputs', () => {
    const key = buildCacheKey({
      sign: '  aries  ',
      philosopher: '  Seneca  ',
      date: ' 2026-04-14 ',
    });
    expect(key).toBe('horoscope:daily:aries:2026-04-14:seneca');
  });

  // ─── Personalized key format (with council) ───────────────────────

  it('returns personalized key format when council provided', () => {
    const key = buildCacheKey({
      sign: 'aries',
      philosopher: 'Seneca',
      date: '2026-04-14',
      council: ['Seneca', 'Alan Watts', 'Rumi'],
    });
    expect(key).toMatch(/^horoscope:personalized:aries:2026-04-14:[a-f0-9]{12}$/);
  });

  it('produces deterministic hash for same council', () => {
    const params = {
      sign: 'aries',
      philosopher: 'Seneca',
      date: '2026-04-14',
      council: ['Seneca', 'Alan Watts', 'Rumi'],
    };
    const key1 = buildCacheKey(params);
    const key2 = buildCacheKey(params);
    expect(key1).toBe(key2);
  });

  it('produces same hash regardless of council order', () => {
    const base = { sign: 'aries', philosopher: 'Seneca', date: '2026-04-14' };
    const key1 = buildCacheKey({ ...base, council: ['Seneca', 'Alan Watts', 'Rumi'] });
    const key2 = buildCacheKey({ ...base, council: ['Rumi', 'Seneca', 'Alan Watts'] });
    expect(key1).toBe(key2);
  });

  it('produces same hash regardless of council casing', () => {
    const base = { sign: 'aries', philosopher: 'Seneca', date: '2026-04-14' };
    const key1 = buildCacheKey({ ...base, council: ['Seneca', 'Alan Watts'] });
    const key2 = buildCacheKey({ ...base, council: ['seneca', 'alan watts'] });
    expect(key1).toBe(key2);
  });

  it('produces different hash for different councils', () => {
    const base = { sign: 'aries', philosopher: 'Seneca', date: '2026-04-14' };
    const key1 = buildCacheKey({ ...base, council: ['Seneca', 'Alan Watts'] });
    const key2 = buildCacheKey({ ...base, council: ['Seneca', 'Plato'] });
    expect(key1).not.toBe(key2);
  });

  // ─── Empty council falls back to daily format ─────────────────────

  it('falls back to daily format when council is empty array', () => {
    const key = buildCacheKey({
      sign: 'aries',
      philosopher: 'Seneca',
      date: '2026-04-14',
      council: [],
    });
    expect(key).toBe('horoscope:daily:aries:2026-04-14:seneca');
  });

  // ─── Key symmetry: same inputs always produce same key ────────────

  it('guarantees key symmetry across multiple calls', () => {
    const params = {
      sign: 'pisces',
      philosopher: 'Lao Tzu',
      date: '2026-01-01',
      council: ['Lao Tzu', 'Rumi', 'Thich Nhat Hanh'],
    };
    const keys = Array.from({ length: 10 }, () => buildCacheKey(params));
    expect(new Set(keys).size).toBe(1);
  });

  // ─── Different signs produce different keys ───────────────────────

  it('different signs produce different daily keys', () => {
    const base = { philosopher: 'Seneca', date: '2026-04-14' };
    const ariesKey = buildCacheKey({ ...base, sign: 'aries' });
    const leoKey = buildCacheKey({ ...base, sign: 'leo' });
    expect(ariesKey).not.toBe(leoKey);
  });

  it('different dates produce different keys', () => {
    const base = { sign: 'aries', philosopher: 'Seneca' };
    const day1 = buildCacheKey({ ...base, date: '2026-04-14' });
    const day2 = buildCacheKey({ ...base, date: '2026-04-15' });
    expect(day1).not.toBe(day2);
  });
});
