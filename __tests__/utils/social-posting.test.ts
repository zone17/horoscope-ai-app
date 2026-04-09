import {
  buildCaption,
  getHashtags,
  postVideoToSocial,
} from '@/utils/social-posting';

describe('buildCaption', () => {
  it('includes sign emoji, name, date, hook, hashtags, and site link', () => {
    const caption = buildCaption(
      'scorpio',
      'April 8, 2026',
      'Your transformation begins now.',
      ['#astrology', '#horoscope', '#scorpio']
    );

    expect(caption).toContain('♏ Scorpio — April 8, 2026');
    expect(caption).toContain('Your transformation begins now.');
    expect(caption).toContain('#astrology #horoscope #scorpio');
    expect(caption).toContain('www.gettodayshoroscope.com/horoscope/scorpio');
  });

  it('uses fallback emoji for unknown sign', () => {
    const caption = buildCaption('centaur', 'Jan 1', 'Hello', ['#test']);
    expect(caption).toContain('✦ Centaur');
  });
});

describe('getHashtags', () => {
  it('returns base + sign-specific hashtags', () => {
    const tags = getHashtags('leo');
    expect(tags).toContain('#astrology');
    expect(tags).toContain('#horoscope');
    expect(tags).toContain('#dailyphilosophy');
    expect(tags).toContain('#zodiac');
    expect(tags).toContain('#leo');
    expect(tags).toContain('#leoseason');
  });
});

describe('postVideoToSocial', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    jest.restoreAllMocks();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('returns error when AYRSHARE_API_KEY is missing', async () => {
    delete process.env.AYRSHARE_API_KEY;
    const result = await postVideoToSocial({
      videoUrl: 'https://example.com/video.mp4',
      caption: 'Test',
      hashtags: [],
      platforms: ['instagram'],
    });
    expect(result.success).toBe(false);
    expect(result.errors).toContain('AYRSHARE_API_KEY not configured');
  });

  it('posts to Ayrshare API on success', async () => {
    process.env.AYRSHARE_API_KEY = 'test-key';

    const mockResponse = { id: '123', status: 'success' };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    }) as jest.Mock;

    const result = await postVideoToSocial({
      videoUrl: 'https://blob.example.com/scorpio.mp4',
      caption: 'Scorpio daily',
      hashtags: ['#astrology'],
      platforms: ['instagram', 'tiktok'],
      scheduleDate: '2026-04-08T11:00:00Z',
    });

    expect(result.success).toBe(true);
    expect(result.platformResults).toEqual(mockResponse);

    const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
    expect(fetchCall[0]).toBe('https://app.ayrshare.com/api/post');
    const body = JSON.parse(fetchCall[1].body);
    expect(body.platforms).toEqual(['instagram', 'tiktok']);
    expect(body.mediaUrls).toEqual(['https://blob.example.com/scorpio.mp4']);
    expect(body.scheduleDate).toBe('2026-04-08T11:00:00Z');
  });

  it('returns error on API failure without throwing', async () => {
    process.env.AYRSHARE_API_KEY = 'test-key';

    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ message: 'Bad request' }),
    }) as jest.Mock;

    const result = await postVideoToSocial({
      videoUrl: 'https://example.com/video.mp4',
      caption: 'Test',
      hashtags: [],
      platforms: ['instagram'],
    });

    expect(result.success).toBe(false);
    expect(result.errors).toContain('Bad request');
  });

  it('handles network error without throwing', async () => {
    process.env.AYRSHARE_API_KEY = 'test-key';
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error')) as jest.Mock;

    const result = await postVideoToSocial({
      videoUrl: 'https://example.com/video.mp4',
      caption: 'Test',
      hashtags: [],
      platforms: ['instagram'],
    });

    expect(result.success).toBe(false);
    expect(result.errors).toContain('Network error');
  });
});
