import {
  ELEMENT_COLORS,
  getSignElementColor,
  getSignVideoProps,
} from '@/utils/video-helpers';
import { VALID_SIGNS, SIGN_META } from '@/constants/zodiac';
import type { HoroscopeData } from '@/utils/horoscope-generator';

const SAMPLE_DATA: HoroscopeData = {
  sign: 'scorpio',
  type: 'daily',
  date: '2026-04-08',
  message: 'You already know what you are avoiding.',
  best_match: 'cancer, pisces',
  inspirational_quote: 'Knowing others is intelligence; knowing yourself is true wisdom.',
  quote_author: 'Lao Tzu',
  peaceful_thought: 'As you close your eyes tonight, consider the darkness as fertile ground.',
};

describe('ELEMENT_COLORS', () => {
  it('has all four elements', () => {
    expect(ELEMENT_COLORS).toHaveProperty('Fire', '#F97316');
    expect(ELEMENT_COLORS).toHaveProperty('Earth', '#84CC16');
    expect(ELEMENT_COLORS).toHaveProperty('Air', '#38BDF8');
    expect(ELEMENT_COLORS).toHaveProperty('Water', '#A78BFA');
  });
});

describe('getSignElementColor', () => {
  it.each([
    ['aries', '#F97316'],
    ['taurus', '#84CC16'],
    ['gemini', '#38BDF8'],
    ['cancer', '#A78BFA'],
    ['leo', '#F97316'],
    ['virgo', '#84CC16'],
    ['libra', '#38BDF8'],
    ['scorpio', '#A78BFA'],
    ['sagittarius', '#F97316'],
    ['capricorn', '#84CC16'],
    ['aquarius', '#38BDF8'],
    ['pisces', '#A78BFA'],
  ])('returns correct color for %s', (sign, expected) => {
    expect(getSignElementColor(sign)).toBe(expected);
  });

  it('returns fallback for unknown sign', () => {
    expect(getSignElementColor('centaur')).toBe('#A78BFA');
  });
});

describe('getSignVideoProps', () => {
  it('maps HoroscopeData fields to video props', () => {
    const props = getSignVideoProps('scorpio', SAMPLE_DATA);

    expect(props.sign).toBe('scorpio');
    expect(props.date).toBe('April 8, 2026');
    expect(props.message).toBe(SAMPLE_DATA.message);
    expect(props.quote).toBe(SAMPLE_DATA.inspirational_quote);
    expect(props.quoteAuthor).toBe(SAMPLE_DATA.quote_author);
    expect(props.peacefulThought).toBe(SAMPLE_DATA.peaceful_thought);
    expect(props.elementColor).toBe('#A78BFA'); // Water
    expect(props.symbol).toBe(SIGN_META.scorpio.symbol);
  });

  it('produces valid props for all 12 signs', () => {
    for (const sign of VALID_SIGNS) {
      const data = { ...SAMPLE_DATA, sign };
      const props = getSignVideoProps(sign, data);

      expect(props.sign).toBe(sign);
      expect(props.elementColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(props.symbol).toBeTruthy();
      expect(props.message).toBeTruthy();
    }
  });

  it('handles unknown sign gracefully', () => {
    const props = getSignVideoProps('centaur', SAMPLE_DATA);
    expect(props.elementColor).toBe('#A78BFA');
    expect(props.symbol).toBe('✦');
  });
});
