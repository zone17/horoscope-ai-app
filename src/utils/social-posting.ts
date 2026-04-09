/**
 * Ayrshare social media posting integration.
 * Posts videos to TikTok, Instagram Reels, Facebook Reels, and X
 * via a single Ayrshare API call.
 *
 * Never throws. Returns { success, errors } result object.
 */

export interface PostOptions {
  videoUrl: string;
  caption: string;
  hashtags: string[];
  platforms: string[];
  scheduleDate?: string; // ISO 8601
}

export interface PostResult {
  success: boolean;
  platformResults?: Record<string, unknown>;
  errors?: string[];
}

/** Sign emoji lookup for captions */
const SIGN_EMOJIS: Record<string, string> = {
  aries: '♈',
  taurus: '♉',
  gemini: '♊',
  cancer: '♋',
  leo: '♌',
  virgo: '♍',
  libra: '♎',
  scorpio: '♏',
  sagittarius: '♐',
  capricorn: '♑',
  aquarius: '♒',
  pisces: '♓',
};

/**
 * Build a caption for a sign's daily video post.
 */
export function buildCaption(
  sign: string,
  date: string,
  hookLine: string,
  hashtags: string[]
): string {
  const emoji = SIGN_EMOJIS[sign.toLowerCase()] ?? '✦';
  const signName = sign.charAt(0).toUpperCase() + sign.slice(1);
  const hashtagStr = hashtags.map((h) => (h.startsWith('#') ? h : `#${h}`)).join(' ');

  return [
    `${emoji} ${signName} — ${date}`,
    '',
    hookLine,
    '',
    hashtagStr,
    '',
    `Full reading: www.gettodayshoroscope.com/horoscope/${sign.toLowerCase()}`,
  ].join('\n');
}

/**
 * Get base hashtags + sign-specific ones for a post.
 */
export function getHashtags(sign: string): string[] {
  const base = ['#astrology', '#horoscope', '#dailyphilosophy', '#zodiac'];
  const signTag = `#${sign.toLowerCase()}`;
  const seasonTag = `#${sign.toLowerCase()}season`;
  return [...base, signTag, seasonTag];
}

/**
 * Post a video to social platforms via Ayrshare API.
 */
export async function postVideoToSocial(options: PostOptions): Promise<PostResult> {
  const apiKey = process.env.AYRSHARE_API_KEY;
  if (!apiKey) {
    console.warn('[social-posting] AYRSHARE_API_KEY not set — skipping post');
    return { success: false, errors: ['AYRSHARE_API_KEY not configured'] };
  }

  try {
    const body: Record<string, unknown> = {
      post: options.caption,
      platforms: options.platforms,
      mediaUrls: [options.videoUrl],
      isVideo: true,
    };

    if (options.scheduleDate) {
      body.scheduleDate = options.scheduleDate;
    }

    const response = await fetch('https://app.ayrshare.com/api/post', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data?.message || data?.error || `HTTP ${response.status}`;
      console.error('[social-posting] Ayrshare API error:', errorMsg);
      return { success: false, errors: [errorMsg] };
    }

    console.log('[social-posting] Posted successfully:', JSON.stringify(data).substring(0, 200));
    return { success: true, platformResults: data };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[social-posting] Post failed:', msg);
    return { success: false, errors: [msg] };
  }
}
