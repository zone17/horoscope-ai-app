import { getSignProfile, isValidSign, listSigns, VALID_SIGNS } from '@/tools/zodiac/sign-profile';

describe('zodiac:sign-profile', () => {
  // ─── isValidSign ──────────────────────────────────────────────────

  it('accepts all 12 lowercase signs', () => {
    for (const sign of VALID_SIGNS) {
      expect(isValidSign(sign)).toBe(true);
    }
  });

  it('rejects invalid signs', () => {
    expect(isValidSign('unicorn')).toBe(false);
    expect(isValidSign('')).toBe(false);
    expect(isValidSign('NOTASIGN')).toBe(false);
  });

  it('is case-insensitive', () => {
    expect(isValidSign('ARIES')).toBe(true);
    expect(isValidSign('Pisces')).toBe(true);
  });

  // ─── getSignProfile ───────────────────────────────────────────────

  it('returns complete profile for each sign', () => {
    for (const sign of VALID_SIGNS) {
      const profile = getSignProfile(sign);
      expect(profile.sign).toBe(sign);
      expect(['Fire', 'Earth', 'Air', 'Water']).toContain(profile.element);
      expect(profile.dateRange).toBeTruthy();
      expect(profile.symbol).toBeTruthy();
      expect(profile.voice).toBeTruthy();
      expect(profile.avoidPatterns).toBeTruthy();
      expect(profile.exampleOpener).toBeTruthy();
    }
  });

  it('throws on invalid sign with descriptive message', () => {
    expect(() => getSignProfile('unicorn')).toThrow('Unknown sign');
  });

  it('maps signs to correct elements', () => {
    const fireExpected = ['aries', 'leo', 'sagittarius'];
    const earthExpected = ['taurus', 'virgo', 'capricorn'];
    const airExpected = ['gemini', 'libra', 'aquarius'];
    const waterExpected = ['cancer', 'scorpio', 'pisces'];

    for (const sign of fireExpected) {
      expect(getSignProfile(sign).element).toBe('Fire');
    }
    for (const sign of earthExpected) {
      expect(getSignProfile(sign).element).toBe('Earth');
    }
    for (const sign of airExpected) {
      expect(getSignProfile(sign).element).toBe('Air');
    }
    for (const sign of waterExpected) {
      expect(getSignProfile(sign).element).toBe('Water');
    }
  });

  it('every sign has a unique symbol', () => {
    const symbols = VALID_SIGNS.map((s) => getSignProfile(s).symbol);
    expect(new Set(symbols).size).toBe(12);
  });

  it('every voice includes writing guidance', () => {
    for (const sign of VALID_SIGNS) {
      const { voice } = getSignProfile(sign);
      // Voice should be substantial guidance, not a stub
      expect(voice.length).toBeGreaterThan(50);
    }
  });

  it('every avoidPatterns forbids "Dear [Sign]"', () => {
    for (const sign of VALID_SIGNS) {
      const { avoidPatterns } = getSignProfile(sign);
      expect(avoidPatterns.toLowerCase()).toContain('dear');
    }
  });

  // ─── listSigns ────────────────────────────────────────────────────

  it('returns all 12 signs when no filter', () => {
    const signs = listSigns();
    expect(signs).toHaveLength(12);
  });

  it('filters by element', () => {
    const fireSigns = listSigns('Fire');
    expect(fireSigns).toHaveLength(3);
    for (const profile of fireSigns) {
      expect(profile.element).toBe('Fire');
    }
  });

  it('element filter is case-insensitive', () => {
    const signs = listSigns('fire');
    expect(signs).toHaveLength(3);
  });

  // ─── VALID_SIGNS constant ─────────────────────────────────────────

  it('has exactly 12 signs', () => {
    expect(VALID_SIGNS).toHaveLength(12);
  });

  it('signs are in traditional zodiac order', () => {
    expect(VALID_SIGNS[0]).toBe('aries');
    expect(VALID_SIGNS[11]).toBe('pisces');
  });
});
