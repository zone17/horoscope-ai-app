import { VERIFIED_QUOTES, getQuotesForPrompt, getAvailablePhilosophers } from '@/utils/verified-quotes';
import { PHILOSOPHERS } from '@/constants/philosophers';
import { VALID_AUTHORS } from '@/utils/horoscope-prompts';

describe('VERIFIED_QUOTES bank', () => {
  const philosopherNames = PHILOSOPHERS.map((p) => p.name);
  const quoteAuthors = Object.keys(VERIFIED_QUOTES);

  it('has a matching entry for every philosopher in the roster', () => {
    for (const name of philosopherNames) {
      expect(quoteAuthors).toContain(name);
    }
  });

  it('every philosopher has at least 10 verified quotes', () => {
    for (const name of philosopherNames) {
      const quotes = VERIFIED_QUOTES[name];
      expect(quotes).toBeDefined();
      expect(quotes.length).toBeGreaterThanOrEqual(10);
    }
  });

  it('every quote has text and source fields populated', () => {
    for (const [author, quotes] of Object.entries(VERIFIED_QUOTES)) {
      for (const quote of quotes) {
        expect(quote.text).toBeTruthy();
        expect(quote.source).toBeTruthy();
        expect(typeof quote.text).toBe('string');
        expect(typeof quote.source).toBe('string');
      }
    }
  });

  it('no quote exceeds 300 characters', () => {
    for (const [author, quotes] of Object.entries(VERIFIED_QUOTES)) {
      for (const quote of quotes) {
        if (quote.text.length > 300) {
          fail(`Quote by ${author} exceeds 300 chars (${quote.text.length}): "${quote.text.substring(0, 50)}..."`);
        }
      }
    }
  });

  it('has 500+ total quotes across all philosophers', () => {
    const totalQuotes = Object.values(VERIFIED_QUOTES).reduce(
      (sum, quotes) => sum + quotes.length,
      0
    );
    expect(totalQuotes).toBeGreaterThanOrEqual(500);
  });
});

describe('VALID_AUTHORS in horoscope-prompts', () => {
  it('includes every philosopher from the roster', () => {
    const philosopherNames = PHILOSOPHERS.map((p) => p.name);
    for (const name of philosopherNames) {
      expect(VALID_AUTHORS).toContain(name);
    }
  });

  it('still includes backward-compatible alternate spellings', () => {
    expect(VALID_AUTHORS).toContain('Allan Watts');
    expect(VALID_AUTHORS).toContain('Joe Dispenza');
  });
});

describe('getQuotesForPrompt', () => {
  it('returns quotes for a known philosopher', () => {
    const quotes = getQuotesForPrompt('Marcus Aurelius');
    expect(quotes.length).toBeGreaterThan(0);
    expect(quotes.length).toBeLessThanOrEqual(4);
  });

  it('returns empty array for unknown philosopher', () => {
    const quotes = getQuotesForPrompt('Unknown Person');
    expect(quotes).toEqual([]);
  });
});

describe('getAvailablePhilosophers', () => {
  it('returns all philosopher names from the quote bank', () => {
    const available = getAvailablePhilosophers();
    expect(available.length).toBeGreaterThanOrEqual(50);
  });
});
