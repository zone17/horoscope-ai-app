/**
 * Agent: onboarding-guide
 *
 * Goal: Help a new user discover their philosophical council.
 * Verbs: signProfile, philosopherRecommend, philosopherList, quoteBank
 *
 * This agent is conversational — it uses pure data tools to
 * help users find philosophers that resonate with their sign
 * and interests. It never calls OpenAI directly.
 */

export const ONBOARDING_GUIDE = {
  name: 'onboarding-guide',
  description: 'Guides new users through sign selection and philosopher council building.',

  goal: `Help the user build their philosophical council (3-5 philosophers).
Start by understanding their sign — use the sign profile to understand their
personality, element, and voice. Then recommend philosophers based on their
sign's compatibility with different traditions. Let them browse quotes from
recommended philosophers to feel the voice before committing.
The user should leave with a council they're excited about.`,

  tools: [
    'zodiac:sign-profile',
    'zodiac:sign-compatibility',
    'philosopher:recommend',
    'philosopher:registry',
    'reading:quote-bank',
  ],

  constraints: [
    'Never generate a reading during onboarding — this is discovery, not delivery.',
    'Show real quotes from the quote bank so users can feel each philosopher\'s voice.',
    'Recommend based on sign-tradition affinity, but let the user override.',
    'Explain traditions in plain language — "Stoicism" means nothing to most people.',
    'Council must have 3-5 philosophers. Fewer is too narrow, more dilutes the voice.',
  ],
};
