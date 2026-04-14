import { formatReading, formatReadingAll, type Platform, type ReadingContent } from '@/tools/content/format';

const SAMPLE_READING: ReadingContent = {
  sign: 'aries',
  message: 'Today invites you to lead with quiet confidence. The strength you seek is already within you, waiting to be channeled into something meaningful.',
  inspirationalQuote: 'We suffer more in imagination than in reality.',
  quoteAuthor: 'Seneca',
  peacefulThought: 'As you rest tonight, release the weight of tomorrow. You have done enough today.',
  philosopher: 'Seneca',
  date: '2026-04-14',
};

describe('content:format — formatReading', () => {
  // ─── All 6 platforms produce valid output ─────────────────────────

  const platforms: Platform[] = ['tiktok', 'instagram', 'x', 'facebook', 'email', 'push'];

  it.each(platforms)('formats for %s without throwing', (platform) => {
    const result = formatReading({ reading: SAMPLE_READING, platform });
    expect(result.text).toBeTruthy();
    expect(result.metadata.platform).toBe(platform);
    expect(result.metadata.sign).toBe('aries');
    expect(result.metadata.signEmoji).toBe('\u2648');
    expect(result.metadata.characterCount).toBe(result.text.length);
  });

  // ─── Platform-specific character limits ───────────────────────────

  it('TikTok text stays under 300 characters', () => {
    const result = formatReading({ reading: SAMPLE_READING, platform: 'tiktok' });
    expect(result.text.length).toBeLessThanOrEqual(300);
  });

  it('X text stays under 280 characters', () => {
    const result = formatReading({ reading: SAMPLE_READING, platform: 'x' });
    expect(result.text.length).toBeLessThanOrEqual(280);
  });

  it('push text stays under 100 characters', () => {
    const result = formatReading({ reading: SAMPLE_READING, platform: 'push' });
    expect(result.text.length).toBeLessThanOrEqual(100);
  });

  // ─── Platform-specific hashtag strategy ───────────────────────────

  it('TikTok includes platform-specific hashtags', () => {
    const result = formatReading({ reading: SAMPLE_READING, platform: 'tiktok' });
    expect(result.hashtags.length).toBeGreaterThan(0);
    expect(result.hashtags).toContain('astrologytok');
  });

  it('Instagram includes generous hashtags', () => {
    const result = formatReading({ reading: SAMPLE_READING, platform: 'instagram' });
    expect(result.hashtags.length).toBeGreaterThanOrEqual(7);
  });

  it('X has at most 2 hashtags', () => {
    const result = formatReading({ reading: SAMPLE_READING, platform: 'x' });
    expect(result.hashtags.length).toBeLessThanOrEqual(2);
  });

  it('email has zero hashtags', () => {
    const result = formatReading({ reading: SAMPLE_READING, platform: 'email' });
    expect(result.hashtags).toEqual([]);
  });

  it('push has zero hashtags', () => {
    const result = formatReading({ reading: SAMPLE_READING, platform: 'push' });
    expect(result.hashtags).toEqual([]);
  });

  // ─── Content inclusion ────────────────────────────────────────────

  it('email includes quote, author, and philosopher attribution', () => {
    const result = formatReading({ reading: SAMPLE_READING, platform: 'email' });
    expect(result.text).toContain('Seneca');
    expect(result.text).toContain('We suffer more in imagination than in reality');
    expect(result.text).toContain('Guided by the philosophy of');
  });

  it('email includes peaceful thought when present', () => {
    const result = formatReading({ reading: SAMPLE_READING, platform: 'email' });
    expect(result.text).toContain('Peaceful Thought');
    expect(result.text).toContain('release the weight of tomorrow');
  });

  it('email omits peaceful thought section when absent', () => {
    const readingWithout = { ...SAMPLE_READING, peacefulThought: undefined };
    const result = formatReading({ reading: readingWithout, platform: 'email' });
    expect(result.text).not.toContain('Peaceful Thought');
  });

  it('facebook includes community CTA', () => {
    const result = formatReading({ reading: SAMPLE_READING, platform: 'facebook' });
    expect(result.text).toContain('resonates');
  });

  it('instagram includes save CTA', () => {
    const result = formatReading({ reading: SAMPLE_READING, platform: 'instagram' });
    expect(result.text).toContain('Save this');
  });

  // ─── Sign emoji mapping ───────────────────────────────────────────

  it('maps all 12 signs to correct emoji', () => {
    const expectedEmojis: Record<string, string> = {
      aries: '\u2648', taurus: '\u2649', gemini: '\u264A', cancer: '\u264B',
      leo: '\u264C', virgo: '\u264D', libra: '\u264E', scorpio: '\u264F',
      sagittarius: '\u2650', capricorn: '\u2651', aquarius: '\u2652', pisces: '\u2653',
    };
    for (const [sign, emoji] of Object.entries(expectedEmojis)) {
      const result = formatReading({
        reading: { ...SAMPLE_READING, sign },
        platform: 'push',
      });
      expect(result.metadata.signEmoji).toBe(emoji);
    }
  });

  // ─── Validation ───────────────────────────────────────────────────

  it('throws on invalid platform', () => {
    expect(() =>
      formatReading({ reading: SAMPLE_READING, platform: 'snapchat' as Platform })
    ).toThrow('Unknown platform');
  });

  it('throws on invalid sign', () => {
    expect(() =>
      formatReading({
        reading: { ...SAMPLE_READING, sign: 'unicorn' },
        platform: 'push',
      })
    ).toThrow('Unknown sign');
  });

  it('accepts case-insensitive signs', () => {
    const result = formatReading({
      reading: { ...SAMPLE_READING, sign: 'ARIES' },
      platform: 'push',
    });
    expect(result.metadata.sign).toBe('aries');
  });

  // ─── Long content handling ────────────────────────────────────────

  it('truncates long messages gracefully for push', () => {
    const longReading = {
      ...SAMPLE_READING,
      message: 'This is an extremely long message that goes on and on and on about the nature of existence and the cosmos and the meaning of life and everything in between and more words to exceed the character limit for push notifications.',
    };
    const result = formatReading({ reading: longReading, platform: 'push' });
    expect(result.text.length).toBeLessThanOrEqual(100);
  });
});

describe('content:format — formatReadingAll', () => {
  it('returns output for all 6 platforms', () => {
    const results = formatReadingAll(SAMPLE_READING);
    const platforms: Platform[] = ['tiktok', 'instagram', 'x', 'facebook', 'email', 'push'];
    for (const platform of platforms) {
      expect(results[platform]).toBeDefined();
      expect(results[platform].text).toBeTruthy();
      expect(results[platform].metadata.platform).toBe(platform);
    }
  });

  it('each platform produces different output', () => {
    const results = formatReadingAll(SAMPLE_READING);
    const texts = Object.values(results).map((r) => r.text);
    // All 6 should be unique
    expect(new Set(texts).size).toBe(6);
  });
});
