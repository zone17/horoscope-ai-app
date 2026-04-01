/**
 * Shared FAQ content — single source of truth.
 * Used by FAQSection (visible accordion) and SchemaMarkupServer (JSON-LD schema).
 */

export interface FAQ {
  question: string;
  answer: string;
}

export const FAQS: FAQ[] = [
  {
    question: 'What makes this horoscope different from other daily horoscopes?',
    answer:
      'Rather than predicting events, each reading draws on philosophical traditions \u2014 Stoicism, Epicureanism, and scientific thinking \u2014 to offer genuine guidance for how to approach your day with intention and clarity.',
  },
  {
    question: 'How is today\u2019s horoscope personalized to my zodiac sign?',
    answer:
      'Each sign\u2019s reading reflects the distinct temperament, strengths, and challenges associated with that sign, filtered through a philosophical lens that speaks to the real questions you face each morning.',
  },
  {
    question: 'Is this a philosophical horoscope or a traditional astrology reading?',
    answer:
      'It\u2019s both \u2014 we use your zodiac sign as a framework for personalization, but the guidance itself is rooted in philosophy, not fortune-telling. Think of it as a philosopher in your corner, every morning.',
  },
  {
    question: 'How often is the horoscope content updated?',
    answer:
      'Every day. Today\u2019s horoscope is generated fresh each morning so the guidance stays relevant to the current moment, not recycled from last week or last year.',
  },
];
