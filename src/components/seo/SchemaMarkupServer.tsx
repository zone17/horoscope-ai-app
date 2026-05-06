import { FAQS } from '@/constants/faqs';

/**
 * Server-side schema markup for the site root.
 *
 * Layout-level schemas only: WebSite, Organization, FAQPage. Per-page
 * schemas (Article, BreadcrumbList) live in the relevant page components
 * so dates and breadcrumb context match the page they describe — Wave 1B
 * QA findings 2.10 (over-stuffed schema, dubious Event block) and 2.11
 * (date drift between API response and Article schema) caught the
 * layout-level Article + BreadcrumbList drifting from page reality.
 *
 * Removed from layout-level on 2026-05-05:
 *   - Service (generic, low signal)
 *   - BreadcrumbList (per-page now)
 *   - ItemList of zodiac signs (rarely surfaced by Google)
 *   - Article (per-page now, with correct datePublished)
 *   - HowTo + Event (low signal; Event in particular was misleading)
 */
export default function SchemaMarkupServer() {
  const schemaMarkupEnabled = process.env.NEXT_PUBLIC_FEATURE_FLAG_USE_SCHEMA_MARKUP === 'true';
  if (!schemaMarkupEnabled) return null;
  
  // Basic schema for the website
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Today's Horoscope",
    "url": "https://www.gettodayshoroscope.com",
    "description": "Get daily horoscope guidance for mindful, spiritual reflection and self-awareness rather than predictions.",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://www.gettodayshoroscope.com?search={search_term}",
      "query-input": "required name=search_term"
    }
  };

  // Organization schema
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Today's Horoscope",
    "url": "https://www.gettodayshoroscope.com",
    "logo": "https://www.gettodayshoroscope.com/favicon.svg"
  };
  
  // FAQPage schema with shared FAQ content from constants/faqs.ts
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": FAQS.map((faq) => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  const schemas: Record<string, unknown>[] = [
    websiteSchema,
    organizationSchema,
    faqSchema,
  ];

  // Return the scripts to be inserted in the head
  return (
    <>
      {schemas.map((schema, index) => (
        <script 
          key={`schema-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schema)
          }}
        />
      ))}
    </>
  );
} 