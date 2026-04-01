'use client';

import { useState } from 'react';

interface FAQ {
  question: string;
  answer: string;
}

const FAQS: FAQ[] = [
  {
    question: 'What makes this horoscope different from other daily horoscopes?',
    answer:
      'Rather than predicting events, each reading draws on philosophical traditions — Stoicism, Epicureanism, and scientific thinking — to offer genuine guidance for how to approach your day with intention and clarity.',
  },
  {
    question: 'How is today\u2019s horoscope personalized to my zodiac sign?',
    answer:
      "Each sign\u2019s reading reflects the distinct temperament, strengths, and challenges associated with that sign, filtered through a philosophical lens that speaks to the real questions you face each morning.",
  },
  {
    question: 'Is this a philosophical horoscope or a traditional astrology reading?',
    answer:
      "It\u2019s both \u2014 we use your zodiac sign as a framework for personalization, but the guidance itself is rooted in philosophy, not fortune-telling. Think of it as a philosopher in your corner, every morning.",
  },
  {
    question: 'How often is the horoscope content updated?',
    answer:
      "Every day. Today\u2019s horoscope is generated fresh each morning so the guidance stays relevant to the current moment, not recycled from last week or last year.",
  },
];

const faqPageSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQS.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer,
    },
  })),
};

function FAQItem({ faq, index }: { faq: FAQ; index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-white/10 last:border-0">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={`faq-answer-${index}`}
        id={`faq-question-${index}`}
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between gap-4 py-4 text-left text-white/90 font-light text-sm sm:text-base hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 rounded"
      >
        <span>{faq.question}</span>
        <span
          aria-hidden="true"
          className={`shrink-0 text-indigo-300/70 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        >
          &#8964;
        </span>
      </button>
      <div
        id={`faq-answer-${index}`}
        role="region"
        aria-labelledby={`faq-question-${index}`}
        hidden={!open}
        className="pb-4 text-indigo-100/70 font-light text-sm leading-relaxed"
      >
        {faq.answer}
      </div>
    </div>
  );
}

/**
 * FAQ accordion section with inline FAQPage JSON-LD schema.
 * Uses 'use client' only for the accordion toggle — content is hydrated on first paint.
 */
export default function FAQSection() {
  return (
    <section
      className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-10"
      aria-label="Frequently asked questions"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPageSchema) }}
      />
      <h2 className="text-xl sm:text-2xl font-normal text-white tracking-tight mb-6 text-center">
        Frequently Asked Questions
      </h2>
      <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md px-5 divide-y-0">
        {FAQS.map((faq, i) => (
          <FAQItem key={i} faq={faq} index={i} />
        ))}
      </div>
    </section>
  );
}
