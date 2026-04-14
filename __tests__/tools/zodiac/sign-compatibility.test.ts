import { getSignCompatibility, getElementGroup } from '@/tools/zodiac/sign-compatibility';
import { VALID_SIGNS } from '@/tools/zodiac/sign-profile';

describe('zodiac:sign-compatibility', () => {
  // ─── Basic output shape ───────────────────────────────────────────

  it('returns correct shape for valid sign', () => {
    const result = getSignCompatibility('aries');
    expect(result.sign).toBe('aries');
    expect(result.compatibleSigns).toBeInstanceOf(Array);
    expect(result.compatibleSigns.length).toBeGreaterThan(0);
    expect(['Fire', 'Earth', 'Air', 'Water']).toContain(result.element);
    expect(result.compatibleElements).toBeInstanceOf(Array);
  });

  // ─── Element compatibility rules ──────────────────────────────────

  it('Fire signs get Fire + Air compatible elements', () => {
    const result = getSignCompatibility('aries');
    expect(result.element).toBe('Fire');
    expect(result.compatibleElements).toEqual(expect.arrayContaining(['Fire', 'Air']));
  });

  it('Earth signs get Earth + Water compatible elements', () => {
    const result = getSignCompatibility('taurus');
    expect(result.element).toBe('Earth');
    expect(result.compatibleElements).toEqual(expect.arrayContaining(['Earth', 'Water']));
  });

  it('Air signs get Air + Fire compatible elements', () => {
    const result = getSignCompatibility('gemini');
    expect(result.element).toBe('Air');
    expect(result.compatibleElements).toEqual(expect.arrayContaining(['Air', 'Fire']));
  });

  it('Water signs get Water + Earth compatible elements', () => {
    const result = getSignCompatibility('cancer');
    expect(result.element).toBe('Water');
    expect(result.compatibleElements).toEqual(expect.arrayContaining(['Water', 'Earth']));
  });

  // ─── Self-exclusion ───────────────────────────────────────────────

  it('never includes the input sign in results', () => {
    for (const sign of VALID_SIGNS) {
      const result = getSignCompatibility(sign, 11);
      expect(result.compatibleSigns).not.toContain(sign);
    }
  });

  // ─── Forced pairings ──────────────────────────────────────────────

  it('Libra always includes Aquarius', () => {
    const result = getSignCompatibility('libra', 3);
    expect(result.compatibleSigns).toContain('aquarius');
  });

  it('Aquarius always includes Libra', () => {
    const result = getSignCompatibility('aquarius', 3);
    expect(result.compatibleSigns).toContain('libra');
  });

  it('forced pairing appears first in list', () => {
    const result = getSignCompatibility('libra', 5);
    expect(result.compatibleSigns[0]).toBe('aquarius');
  });

  // ─── Count clamping ───────────────────────────────────────────────

  it('defaults to 3 compatible signs', () => {
    const result = getSignCompatibility('aries');
    expect(result.compatibleSigns).toHaveLength(3);
  });

  it('respects custom count', () => {
    const result = getSignCompatibility('aries', 5);
    expect(result.compatibleSigns).toHaveLength(5);
  });

  it('clamps count to maximum 11', () => {
    const result = getSignCompatibility('aries', 100);
    expect(result.compatibleSigns.length).toBeLessThanOrEqual(11);
  });

  it('clamps count to minimum 1', () => {
    const result = getSignCompatibility('aries', 0);
    expect(result.compatibleSigns.length).toBeGreaterThanOrEqual(1);
  });

  // ─── Validation ───────────────────────────────────────────────────

  it('throws on invalid sign', () => {
    expect(() => getSignCompatibility('unicorn')).toThrow('Unknown sign');
  });

  it('accepts case-insensitive signs', () => {
    const result = getSignCompatibility('ARIES');
    expect(result.sign).toBe('aries');
  });
});

describe('zodiac:element-group', () => {
  it('returns 3 signs for each element', () => {
    for (const element of ['Fire', 'Earth', 'Air', 'Water']) {
      const signs = getElementGroup(element);
      expect(signs).toHaveLength(3);
    }
  });

  it('Fire group contains aries, leo, sagittarius', () => {
    const signs = getElementGroup('Fire');
    expect(signs).toEqual(expect.arrayContaining(['aries', 'leo', 'sagittarius']));
  });

  it('is case-insensitive', () => {
    const signs = getElementGroup('fire');
    expect(signs).toHaveLength(3);
  });

  it('throws on invalid element', () => {
    expect(() => getElementGroup('Void')).toThrow('Unknown element');
  });
});
