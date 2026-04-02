/**
 * Tests for email utilities: Resend integration + email template builder.
 */

// Mock resend before imports
const mockSend = jest.fn();
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: mockSend },
  })),
}));

import {
  sendDailyEmail,
  generateUnsubscribeToken,
  buildUnsubscribeUrl,
  buildShareUrl,
  formatEmailDate,
  type Subscriber,
  type ReadingContent,
} from '@/utils/email';

import {
  buildSubjectLine,
  buildPreviewText,
  buildEmailHtml,
} from '@/utils/email-template';

// ----- Email Template Tests -----

describe('buildSubjectLine', () => {
  it('formats sign name and date correctly', () => {
    expect(buildSubjectLine('aries', 'Apr 2, 2026')).toBe(
      'Your Aries reading \u2022 Apr 2, 2026'
    );
  });

  it('capitalizes multi-syllable signs', () => {
    expect(buildSubjectLine('sagittarius', 'Dec 1, 2026')).toBe(
      'Your Sagittarius reading \u2022 Dec 1, 2026'
    );
  });
});

describe('buildPreviewText', () => {
  it('returns fallback when no philosophers', () => {
    expect(buildPreviewText([])).toBe('Your daily philosophical horoscope');
  });

  it('handles single philosopher', () => {
    expect(buildPreviewText(['Marcus Aurelius'])).toBe('Guided by Marcus Aurelius');
  });

  it('handles two philosophers with ampersand', () => {
    expect(buildPreviewText(['Alan Watts', 'Lao Tzu'])).toBe(
      'Guided by Alan Watts & Lao Tzu'
    );
  });

  it('handles three philosophers with comma and ampersand', () => {
    expect(
      buildPreviewText(['Marcus Aurelius', 'Alan Watts', 'Lao Tzu'])
    ).toBe('Guided by Marcus Aurelius, Alan Watts & Lao Tzu');
  });
});

describe('buildEmailHtml', () => {
  const templateData = {
    sign: 'aries' as const,
    philosophers: ['Marcus Aurelius', 'Lao Tzu'],
    readingText: 'Today is a day of bold action.',
    quote: {
      text: 'Waste no more time.',
      source: 'Meditations',
      author: 'Marcus Aurelius',
    },
    date: 'Apr 2, 2026',
    unsubscribeUrl: 'https://gettodayshoroscope.com/api/unsubscribe?email=test@example.com&token=abc',
    shareUrl: 'https://gettodayshoroscope.com/horoscope/aries?utm_source=email',
  };

  it('includes sign symbol in the email', () => {
    const html = buildEmailHtml(templateData);
    // Aries symbol
    expect(html).toContain('\u2648');
  });

  it('includes sign name', () => {
    const html = buildEmailHtml(templateData);
    expect(html).toContain('Aries');
  });

  it('includes philosopher names', () => {
    const html = buildEmailHtml(templateData);
    expect(html).toContain('Marcus Aurelius');
    expect(html).toContain('Lao Tzu');
  });

  it('includes the reading text', () => {
    const html = buildEmailHtml(templateData);
    expect(html).toContain('Today is a day of bold action.');
  });

  it('includes the quote and attribution', () => {
    const html = buildEmailHtml(templateData);
    expect(html).toContain('Waste no more time.');
    expect(html).toContain('Meditations');
    expect(html).toContain('Marcus Aurelius');
  });

  it('includes unsubscribe link', () => {
    const html = buildEmailHtml(templateData);
    expect(html).toContain(templateData.unsubscribeUrl);
    expect(html).toContain('Unsubscribe');
  });

  it('includes share link', () => {
    const html = buildEmailHtml(templateData);
    expect(html).toContain(templateData.shareUrl);
    expect(html).toContain('Share Your Reading');
  });

  it('includes preview text for email clients', () => {
    const html = buildEmailHtml(templateData);
    expect(html).toContain('Guided by Marcus Aurelius & Lao Tzu');
  });

  it('uses fallback when no philosophers selected', () => {
    const data = { ...templateData, philosophers: [] };
    const html = buildEmailHtml(data);
    expect(html).toContain('our rotating philosophers');
  });
});

// ----- Email Utility Tests -----

describe('generateUnsubscribeToken', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('returns empty string when UNSUBSCRIBE_SECRET is not set', () => {
    delete process.env.UNSUBSCRIBE_SECRET;
    expect(generateUnsubscribeToken('test@example.com')).toBe('');
  });

  it('returns a hex HMAC token when secret is set', () => {
    process.env.UNSUBSCRIBE_SECRET = 'test-secret-key';
    const token = generateUnsubscribeToken('test@example.com');
    expect(token).toMatch(/^[0-9a-f]{64}$/);
  });

  it('produces deterministic tokens for the same email', () => {
    process.env.UNSUBSCRIBE_SECRET = 'test-secret-key';
    const token1 = generateUnsubscribeToken('test@example.com');
    const token2 = generateUnsubscribeToken('test@example.com');
    expect(token1).toBe(token2);
  });

  it('produces different tokens for different emails', () => {
    process.env.UNSUBSCRIBE_SECRET = 'test-secret-key';
    const token1 = generateUnsubscribeToken('a@example.com');
    const token2 = generateUnsubscribeToken('b@example.com');
    expect(token1).not.toBe(token2);
  });
});

describe('buildUnsubscribeUrl', () => {
  beforeEach(() => {
    process.env.UNSUBSCRIBE_SECRET = 'test-secret';
  });

  it('includes email and token in URL', () => {
    const url = buildUnsubscribeUrl('user@example.com');
    expect(url).toContain('email=user%40example.com');
    expect(url).toContain('token=');
    expect(url.startsWith('https://gettodayshoroscope.com/api/unsubscribe')).toBe(true);
  });
});

describe('buildShareUrl', () => {
  it('builds a share URL with UTM params', () => {
    const url = buildShareUrl('leo');
    expect(url).toBe(
      'https://gettodayshoroscope.com/horoscope/leo?utm_source=email&utm_medium=share'
    );
  });
});

describe('formatEmailDate', () => {
  it('formats a specific date', () => {
    const date = new Date('2026-04-02T12:00:00Z');
    const result = formatEmailDate(date);
    expect(result).toContain('Apr');
    expect(result).toContain('2026');
  });

  it('returns a string when no date is provided', () => {
    const result = formatEmailDate();
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});

// ----- sendDailyEmail Tests -----

describe('sendDailyEmail', () => {
  const originalEnv = process.env;

  const subscriber: Subscriber = {
    email: 'test@example.com',
    sign: 'aries',
    philosophers: ['Marcus Aurelius', 'Alan Watts', 'Lao Tzu'],
  };

  const reading: ReadingContent = {
    text: 'Today the stars align for bold action.',
    quote: {
      text: 'Waste no more time arguing about what a good man should be. Be one.',
      source: 'Meditations, Book 10',
      author: 'Marcus Aurelius',
    },
  };

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.RESEND_API_KEY = 'test-api-key';
    process.env.UNSUBSCRIBE_SECRET = 'test-secret';
    mockSend.mockReset();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('constructs correct email structure and sends via Resend', async () => {
    mockSend.mockResolvedValue({ data: { id: 'msg_123' }, error: null });

    const result = await sendDailyEmail(subscriber, reading);

    expect(result.success).toBe(true);
    expect(result.messageId).toBe('msg_123');
    expect(result.email).toBe('test@example.com');

    expect(mockSend).toHaveBeenCalledTimes(1);
    const sendArgs = mockSend.mock.calls[0][0];
    expect(sendArgs.from).toBe('readings@gettodayshoroscope.com');
    expect(sendArgs.to).toBe('test@example.com');
    expect(sendArgs.subject).toContain('Aries');
    expect(sendArgs.html).toContain('Marcus Aurelius');
    expect(sendArgs.html).toContain('bold action');
    expect(sendArgs.html).toContain('Unsubscribe');
    expect(sendArgs.tags).toEqual([
      { name: 'type', value: 'daily-horoscope' },
      { name: 'sign', value: 'aries' },
    ]);
  });

  it('includes unsubscribe link with correct token in email', async () => {
    mockSend.mockResolvedValue({ data: { id: 'msg_456' }, error: null });

    await sendDailyEmail(subscriber, reading);

    const sendArgs = mockSend.mock.calls[0][0];
    expect(sendArgs.html).toContain('api/unsubscribe');
    expect(sendArgs.html).toContain('email=test%40example.com');
    expect(sendArgs.html).toContain('token=');
    // List-Unsubscribe header
    expect(sendArgs.headers['List-Unsubscribe']).toContain('api/unsubscribe');
  });

  it('handles subscriber with no philosopher selections', async () => {
    mockSend.mockResolvedValue({ data: { id: 'msg_789' }, error: null });

    const noPhilosophers: Subscriber = {
      email: 'newuser@example.com',
      sign: 'pisces',
    };

    const result = await sendDailyEmail(noPhilosophers, reading);

    expect(result.success).toBe(true);

    const sendArgs = mockSend.mock.calls[0][0];
    expect(sendArgs.html).toContain('our rotating philosophers');
    expect(sendArgs.subject).toContain('Pisces');
  });

  it('catches and returns Resend API error without throwing', async () => {
    mockSend.mockResolvedValue({
      data: null,
      error: { message: 'Rate limit exceeded', name: 'rate_limit' },
    });

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const result = await sendDailyEmail(subscriber, reading);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Rate limit exceeded');
    expect(result.email).toBe('test@example.com');
    consoleSpy.mockRestore();
  });

  it('catches unexpected exceptions without throwing', async () => {
    mockSend.mockRejectedValue(new Error('Network timeout'));

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const result = await sendDailyEmail(subscriber, reading);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Network timeout');
    consoleSpy.mockRestore();
  });

  it('skips send gracefully when RESEND_API_KEY is missing', async () => {
    delete process.env.RESEND_API_KEY;

    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const result = await sendDailyEmail(subscriber, reading);

    expect(result.success).toBe(false);
    expect(result.error).toBe('RESEND_API_KEY not configured');
    expect(mockSend).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('includes plain text fallback in email', async () => {
    mockSend.mockResolvedValue({ data: { id: 'msg_txt' }, error: null });

    await sendDailyEmail(subscriber, reading);

    const sendArgs = mockSend.mock.calls[0][0];
    expect(sendArgs.text).toBeDefined();
    expect(sendArgs.text).toContain('bold action');
    expect(sendArgs.text).toContain('Marcus Aurelius');
    expect(sendArgs.text).toContain('Unsubscribe');
  });
});
