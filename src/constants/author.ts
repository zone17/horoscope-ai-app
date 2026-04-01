export const AUTHOR = {
  name: 'Elena Vasquez',
  title: 'Philosophical Astrologer & Daily Guide',
  bio: [
    'Elena Vasquez has spent fifteen years exploring the intersection of ancient wisdom traditions and modern life. Trained in classical philosophy at the University of Barcelona and later immersed in Stoic and Buddhist scholarship, she came to astrology not as a believer in cosmic fate, but as someone fascinated by the frameworks humans use to make sense of themselves. For Elena, the zodiac is a language — a remarkably durable one for describing temperament, tendency, and the recurring challenges that define a human life.',
    'Her approach draws equally from Seneca and Epictetus, from the Bhagavad Gita and Feynman\'s sense of wonder. She is skeptical of prediction and deeply interested in guidance. The question she returns to with each sign\'s daily reading is not "what will happen?" but "what attitude serves you best today?" That shift — from fortune-telling to philosophy — is the animating idea behind this site.',
    'Elena believes that a good horoscope should function like a good philosophical text: it should make you think, not reassure you. It should ask something of you. Each reading is crafted to be honest, specific to the sign\'s genuine character, and grounded in ideas that have survived centuries of scrutiny. If it helps you meet the day with a little more clarity, it has done its job.',
  ],
  image: '/images/author-placeholder.svg',
  url: 'https://www.gettodayshoroscope.com/about/author',
} as const;

export type Author = typeof AUTHOR;
