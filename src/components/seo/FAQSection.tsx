import { FAQS } from '@/constants/faqs';
import FAQAccordion from './FAQAccordion';

/**
 * Server component: renders FAQPage JSON-LD schema (crawlable at initial HTML parse)
 * and delegates interactive accordion to a client component.
 */
export default function FAQSection() {
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
      <FAQAccordion faqs={FAQS} />
    </section>
  );
}
