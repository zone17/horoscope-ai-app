/**
 * Tests for the public Guidance API logic (Unit 12).
 */

jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: { completions: { create: jest.fn() } },
  }));
});

import { isValidSign } from '@/constants/zodiac';

describe('Guidance API — sign validation via isValidSign', () => {
  it('returns true for all 12 valid signs', () => {
    const signs = [
      'aries', 'taurus', 'gemini', 'cancer',
      'leo', 'virgo', 'libra', 'scorpio',
      'sagittarius', 'capricorn', 'aquarius', 'pisces',
    ];
    for (const s of signs) {
      expect(isValidSign(s)).toBe(true);
    }
  });

  it('returns false for invalid signs', () => {
    expect(isValidSign('unicorn')).toBe(false);
    expect(isValidSign('')).toBe(false);
    expect(isValidSign('ARIES')).toBe(false);
  });
});

describe('Guidance API — philosopher param parsing', () => {
  function parsePhilosophers(param: string | null): string[] | undefined {
    if (!param) return undefined;
    return param.split(',').map(p => p.trim()).filter(Boolean);
  }

  it('returns undefined for null', () => {
    expect(parsePhilosophers(null)).toBeUndefined();
  });

  it('returns undefined for empty string', () => {
    expect(parsePhilosophers('')).toBeUndefined();
  });

  it('splits comma-separated names', () => {
    expect(parsePhilosophers('Seneca,Lao Tzu')).toEqual(['Seneca', 'Lao Tzu']);
  });

  it('trims whitespace around names', () => {
    expect(parsePhilosophers(' Seneca , Lao Tzu ')).toEqual(['Seneca', 'Lao Tzu']);
  });

  it('filters out empty segments', () => {
    expect(parsePhilosophers('Seneca,,Lao Tzu,')).toEqual(['Seneca', 'Lao Tzu']);
  });

  it('handles a single philosopher', () => {
    expect(parsePhilosophers('Marcus Aurelius')).toEqual(['Marcus Aurelius']);
  });
});

describe('Guidance API — short field extraction', () => {
  function extractShort(message: string): string {
    const sentences = message.match(/[^.!?]+[.!?]+/g) || [message];
    return sentences.slice(0, 2).join('').trim();
  }

  it('extracts first 2 sentences', () => {
    const msg = 'The stars align for bold action today. Trust your instincts and move forward. A creative breakthrough awaits.';
    expect(extractShort(msg)).toBe(
      'The stars align for bold action today. Trust your instincts and move forward.'
    );
  });

  it('returns the full message if only 1 sentence', () => {
    expect(extractShort('Be at peace.')).toBe('Be at peace.');
  });

  it('handles exclamation marks', () => {
    expect(extractShort('What a day! The stars are bright. Go forth.')).toBe('What a day! The stars are bright.');
  });

  it('handles question marks', () => {
    expect(extractShort('Can you feel it? The energy is shifting. Up.')).toBe('Can you feel it? The energy is shifting.');
  });

  it('returns raw message if no terminators', () => {
    expect(extractShort('No punctuation here')).toBe('No punctuation here');
  });
});

describe('Guidance API — rate limiter logic', () => {
  const rateLimit = new Map<string, { count: number; resetAt: number }>();
  const WINDOW_MS = 60_000;
  const MAX = 10;

  function isRateLimited(ip: string): boolean {
    const now = Date.now();
    const entry = rateLimit.get(ip);
    if (!entry || now > entry.resetAt) {
      rateLimit.set(ip, { count: 1, resetAt: now + WINDOW_MS });
      return false;
    }
    entry.count += 1;
    return entry.count > MAX;
  }

  beforeEach(() => { rateLimit.clear(); });

  it('allows first 10 requests', () => {
    for (let i = 0; i < 10; i++) expect(isRateLimited('1.2.3.4')).toBe(false);
  });

  it('blocks 11th request', () => {
    for (let i = 0; i < 10; i++) isRateLimited('1.2.3.4');
    expect(isRateLimited('1.2.3.4')).toBe(true);
  });

  it('tracks IPs independently', () => {
    for (let i = 0; i < 10; i++) isRateLimited('1.2.3.4');
    expect(isRateLimited('5.6.7.8')).toBe(false);
  });

  it('resets after window expires', () => {
    rateLimit.set('1.2.3.4', { count: 15, resetAt: Date.now() - 1 });
    expect(isRateLimited('1.2.3.4')).toBe(false);
  });
});
