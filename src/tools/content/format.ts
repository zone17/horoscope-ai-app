/**
 * content:format — Atomic tool
 *
 * Formats a reading for a specific distribution platform.
 * Takes reading output + platform target, returns optimized text,
 * hashtags, and metadata.
 *
 * Independently callable: works from CLI, API route, agent, or any consumer.
 *
 * Input:  FormatInput
 * Output: FormatOutput
 */

import { getSignProfile, type ValidSign, isValidSign } from '@/tools/zodiac/sign-profile';

// ─── Types ──────────────────────────────────────────────────────────────

export type Platform = 'tiktok' | 'instagram' | 'x' | 'facebook' | 'email' | 'push';

export interface ReadingContent {
  sign: string;
  message: string;
  inspirationalQuote: string;
  quoteAuthor: string;
  peacefulThought?: string;
  philosopher: string;
  date: string;
}

export interface FormatInput {
  reading: ReadingContent;
  platform: Platform;
}

export interface FormatOutput {
  text: string;
  hashtags: string[];
  metadata: {
    platform: string;
    characterCount: number;
    sign: string;
    signEmoji: string;
  };
}

// ─── Constants ──────────────────────────────────────────────────────────

const VALID_PLATFORMS: Platform[] = ['tiktok', 'instagram', 'x', 'facebook', 'email', 'push'];

/** Sign emoji lookup — matches social-posting.ts for consistency */
const SIGN_EMOJIS: Record<string, string> = {
  aries: '\u2648',
  taurus: '\u2649',
  gemini: '\u264A',
  cancer: '\u264B',
  leo: '\u264C',
  virgo: '\u264D',
  libra: '\u264E',
  scorpio: '\u264F',
  sagittarius: '\u2650',
  capricorn: '\u2651',
  aquarius: '\u2652',
  pisces: '\u2653',
};

// ─── Hashtag Strategy ───────────────────────────────────────────────────

function getBaseHashtags(sign: string): string[] {
  return ['astrology', 'horoscope', 'dailyphilosophy', 'zodiac'];
}

function getSignHashtags(sign: string): string[] {
  const key = sign.toLowerCase();
  return [key, `${key}season`, `${key}horoscope`];
}

function getPlatformHashtags(platform: Platform): string[] {
  switch (platform) {
    case 'tiktok':
      return ['astrologytok', 'spiritualtok', 'dailyhoroscope'];
    case 'instagram':
      return ['horoscopeoftheday', 'zodiacsigns', 'dailyastrology'];
    case 'facebook':
      return ['zodiaclife', 'horoscopetoday'];
    case 'x':
      // X performs better with fewer hashtags
      return [];
    case 'email':
    case 'push':
      return [];
  }
}

function buildHashtags(sign: string, platform: Platform): string[] {
  const base = getBaseHashtags(sign);
  const signTags = getSignHashtags(sign);
  const platformTags = getPlatformHashtags(platform);

  switch (platform) {
    case 'tiktok':
      // TikTok: sign-first, then platform-specific, then base. Max ~8.
      return [...signTags.slice(0, 2), ...platformTags, ...base.slice(0, 3)];
    case 'instagram':
      // Instagram: generous hashtags help discovery.
      return [...signTags, ...base, ...platformTags];
    case 'x':
      // X: 1-2 max, never a wall.
      return [signTags[0], base[0]];
    case 'facebook':
      return [...signTags.slice(0, 2), ...base.slice(0, 2), ...platformTags];
    case 'email':
    case 'push':
      return [];
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function getSignEmoji(sign: string): string {
  return SIGN_EMOJIS[sign.toLowerCase()] ?? '\u2726';
}

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  const truncated = text.substring(0, maxLen - 1).trimEnd();
  // Cut at last sentence boundary if possible
  const lastPeriod = truncated.lastIndexOf('.');
  if (lastPeriod > maxLen * 0.5) {
    return truncated.substring(0, lastPeriod + 1);
  }
  return truncated + '\u2026';
}

/** Extract the first sentence from a message */
function firstSentence(text: string): string {
  const match = text.match(/^[^.!?]+[.!?]/);
  return match ? match[0].trim() : text.split('\n')[0].trim();
}

/** Format a date string as human-readable */
function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

// ─── Platform Formatters ────────────────────────────────────────────────

function formatTikTok(reading: ReadingContent): string {
  const emoji = getSignEmoji(reading.sign);
  const signName = capitalize(reading.sign);
  const hook = firstSentence(reading.message);

  // TikTok: curiosity-driven hook, short excerpt, under 300 chars
  const parts = [
    `${emoji} ${signName} \u2014 you need to hear this`,
    '',
    hook,
    '',
    `\u201C${truncate(reading.inspirationalQuote, 80)}\u201D`,
    `\u2014 ${reading.quoteAuthor}`,
  ];

  return truncate(parts.join('\n'), 300);
}

function formatInstagram(reading: ReadingContent): string {
  const emoji = getSignEmoji(reading.sign);
  const signName = capitalize(reading.sign);

  // Instagram: quote-forward, line breaks, sign emoji, soft CTA
  const parts = [
    `${emoji} ${signName}`,
    '',
    `\u201C${reading.inspirationalQuote}\u201D`,
    `\u2014 ${reading.quoteAuthor}`,
    '',
    reading.message,
    '',
    `Save this for later \u2728`,
  ];

  return parts.join('\n');
}

function formatX(reading: ReadingContent): string {
  const emoji = getSignEmoji(reading.sign);
  const signName = capitalize(reading.sign);

  // X: concise wisdom, sign name, no hashtag wall, under 280 chars
  const core = `${emoji} ${signName}: ${firstSentence(reading.message)}`;

  if (core.length <= 260) {
    // Room for the quote attribution
    const withQuote = `${core}\n\n\u201C${truncate(reading.inspirationalQuote, 100)}\u201D \u2014 ${reading.quoteAuthor}`;
    if (withQuote.length <= 280) return withQuote;
  }

  return truncate(core, 280);
}

function formatFacebook(reading: ReadingContent): string {
  const emoji = getSignEmoji(reading.sign);
  const signName = capitalize(reading.sign);

  // Facebook: slightly longer, community tone, question at end
  const parts = [
    `${emoji} ${signName} \u2014 ${formatDate(reading.date)}`,
    '',
    reading.message,
    '',
    `\u201C${reading.inspirationalQuote}\u201D`,
    `\u2014 ${reading.quoteAuthor}`,
    '',
    `How does this land for you today? Drop a ${emoji} if it resonates.`,
  ];

  return parts.join('\n');
}

function formatEmail(reading: ReadingContent): string {
  const emoji = getSignEmoji(reading.sign);
  const signName = capitalize(reading.sign);
  const formattedDate = formatDate(reading.date);

  // Email: full reading + quote + peaceful thought. HTML-friendly sections.
  const sections: string[] = [
    `<h2>${emoji} ${signName} &mdash; ${formattedDate}</h2>`,
    '',
    `<p>${reading.message}</p>`,
    '',
    '<hr />',
    '',
    '<blockquote>',
    `<p>&ldquo;${reading.inspirationalQuote}&rdquo;</p>`,
    `<footer>&mdash; ${reading.quoteAuthor}</footer>`,
    '</blockquote>',
  ];

  if (reading.peacefulThought) {
    sections.push(
      '',
      '<hr />',
      '',
      '<h3>Tonight\'s Peaceful Thought</h3>',
      `<p>${reading.peacefulThought}</p>`,
    );
  }

  sections.push(
    '',
    '<p style="font-size: 0.9em; color: #888;">',
    `Guided by the philosophy of ${reading.philosopher}`,
    '</p>',
  );

  return sections.join('\n');
}

function formatPush(reading: ReadingContent): string {
  const emoji = getSignEmoji(reading.sign);
  const signName = capitalize(reading.sign);

  // Push: one punchy sentence, under 100 chars
  const sentence = firstSentence(reading.message);
  const push = `${emoji} ${signName}: ${sentence}`;
  return truncate(push, 100);
}

// ─── Platform Router ────────────────────────────────────────────────────

const FORMATTERS: Record<Platform, (reading: ReadingContent) => string> = {
  tiktok: formatTikTok,
  instagram: formatInstagram,
  x: formatX,
  facebook: formatFacebook,
  email: formatEmail,
  push: formatPush,
};

// ─── Main Tool ──────────────────────────────────────────────────────────

/**
 * content:format
 *
 * Format a reading for a specific distribution platform.
 */
export function formatReading(input: FormatInput): FormatOutput {
  const { reading, platform } = input;

  // Validate platform
  if (!VALID_PLATFORMS.includes(platform)) {
    throw new Error(
      `Unknown platform: ${platform}. Valid platforms: ${VALID_PLATFORMS.join(', ')}`
    );
  }

  // Validate sign
  const signKey = reading.sign.toLowerCase();
  if (!isValidSign(signKey)) {
    throw new Error(`Unknown sign: ${reading.sign}`);
  }

  const formatter = FORMATTERS[platform];
  const text = formatter(reading);
  const hashtags = buildHashtags(signKey, platform);
  const signEmoji = getSignEmoji(signKey);

  return {
    text,
    hashtags,
    metadata: {
      platform,
      characterCount: text.length,
      sign: signKey,
      signEmoji,
    },
  };
}

/**
 * content:format-all
 *
 * Convenience: format a reading for all platforms at once.
 */
export function formatReadingAll(reading: ReadingContent): Record<Platform, FormatOutput> {
  return Object.fromEntries(
    VALID_PLATFORMS.map((platform) => [
      platform,
      formatReading({ reading, platform }),
    ])
  ) as Record<Platform, FormatOutput>;
}
