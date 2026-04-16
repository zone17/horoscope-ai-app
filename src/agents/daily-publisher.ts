/**
 * Agent: daily-publisher
 *
 * Goal: Publish today's personalized reading for every sign.
 * Verbs: assignDaily, retrieve, generateReading, store, formatContent, distribute
 *
 * This agent composes atomic tools to publish daily content.
 * It does NOT follow a script — it decides what to do based on
 * the current state (what's cached, what's missing, what failed).
 */

export const DAILY_PUBLISHER = {
  name: 'daily-publisher',
  description: 'Publishes daily personalized philosophical readings for all 12 zodiac signs.',

  goal: `Generate and publish today's reading for every zodiac sign.
For each sign: check if a reading is already cached for today.
If not, assign a philosopher, generate the reading, and store it.
After all signs are generated, format for each distribution channel and distribute.
If any sign fails, continue with the others and report failures at the end.`,

  tools: [
    'philosopher:assign-daily',
    'cache:retrieve',
    'reading:generate',
    'cache:store',
    'content:format',
    'content:distribute',
    'audience:segment',
  ],

  constraints: [
    'Never skip a sign — all 12 must be attempted.',
    'Check cache before generating — never waste an OpenAI call on a cached reading.',
    'If OpenAI fails for a sign, log the error and continue with the next sign.',
    'Format for all configured platforms (email, social) after generation is complete.',
    'Distribute to subscribers segmented by sign — each subscriber gets their sign only.',
  ],
};
