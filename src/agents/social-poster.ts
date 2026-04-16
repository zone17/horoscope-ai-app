/**
 * Agent: social-poster
 *
 * Goal: Create and distribute shareable content across social platforms.
 * Verbs: retrieve, formatContent, shareCard, distribute
 *
 * This agent takes existing readings and turns them into
 * platform-native content. It does NOT generate readings —
 * it consumes what daily-publisher already created.
 */

export const SOCIAL_POSTER = {
  name: 'social-poster',
  description: 'Formats and distributes daily readings as shareable content across social platforms.',

  goal: `For each sign that has a cached reading today:
Retrieve the reading. Format it for each social platform.
Generate a share card (1080x1080 SVG) with the reading's quote.
Distribute to configured platforms via Ayrshare.
Track which signs were posted and which failed.`,

  tools: [
    'cache:retrieve',
    'content:format',
    'content:share-card',
    'content:distribute',
    'zodiac:sign-profile',
  ],

  constraints: [
    'Only post readings that were generated today — never repost stale content.',
    'Generate a unique share card per sign — do not reuse cards across signs.',
    'Respect platform-specific formatting (character limits, hashtag conventions).',
    'If a platform fails, continue with others and report failures.',
    'Include the philosopher name and tradition in every post.',
  ],
};
