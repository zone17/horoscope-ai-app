'use client';

import { useState } from 'react';
import type { FAQ } from '@/constants/faqs';

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

export default function FAQAccordion({ faqs }: { faqs: FAQ[] }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md px-5 divide-y-0">
      {faqs.map((faq, i) => (
        <FAQItem key={i} faq={faq} index={i} />
      ))}
    </div>
  );
}
