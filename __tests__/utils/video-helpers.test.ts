import {
  ELEMENT_COLORS,
  getSignElementColor,
  getSignVideoProps,
} from '@/utils/video-helpers';
import { VALID_SIGNS, SIGN_META } from '@/constants/zodiac';
import type { ReadingV2 } from '@/tools/reading/types';

const SAMPLE_DATA: ReadingV2 = {
  sign: 'scorpio',
  date: '2026-04-08',
  morning_reading: 'You already know what you are avoiding.',
  evening_reading: 'As you close your eyes tonight, consider the darkness as fertile ground.',
  best_match: 'cancer, pisces',
  quote: {
    text: 'Knowing others is intelligence; knowing yourself is true wisdom.',
    quote_philosopher: 'Lao Tzu',
    source: 'Tao Te Ching, Chapter 33',
  },
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
  it('maps ReadingV2 fields to video props', () => {
    const props = getSignVideoProps('scorpio', SAMPLE_DATA);

    expect(props.sign).toBe('scorpio');
    expect(props.date).toBe('April 8, 2026');
    expect(props.message).toBe(SAMPLE_DATA.morning_reading);
    expect(props.quote).toBe(SAMPLE_DATA.quote.text);
    expect(props.quoteAuthor).toBe(SAMPLE_DATA.quote.quote_philosopher);
    expect(props.peacefulThought).toBe(SAMPLE_DATA.evening_reading);
    // elementColor returns getSignAccentColor (per-sign accent), not the
    // element-based color — single-accent-per-video discipline. Scorpio's
    // accent is garnet, not Water purple.
    expect(props.elementColor).toBe('#8B3A4A'); // Scorpio garnet
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
