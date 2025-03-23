'use client';

import { useEffect } from 'react';
import Script from 'next/script';
import { isFeatureEnabled, FEATURE_FLAGS } from '@/utils/feature-flags';

interface SchemaMarkupProps {
  zodiacSigns: any[];
  horoscopes: Record<string, any>;
}

/**
 * SchemaMarkup component for implementing structured data
 * This component renders JSON-LD schema for SEO improvements
 */
export default function SchemaMarkup({ zodiacSigns, horoscopes }: SchemaMarkupProps) {
  // Check if schema markup feature flag is enabled
  const isSchemaEnabled = isFeatureEnabled(FEATURE_FLAGS.USE_SCHEMA_MARKUP, false);
  
  // If schema markup is disabled, return null
  if (!isSchemaEnabled) {
    return null;
  }
  
  // If horoscopes object is empty or has error state, don't render schema 
  // to avoid breaking the app
  const hasValidData = horoscopes && Object.keys(horoscopes).length > 0;
  if (!hasValidData) {
    return null;
  }
  
  // Generate schema data only if we have valid horoscope data
  try {
    // Schema.org markup for horoscope content
    const schemaData = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "Today's Horoscope",
      "url": "https://www.gettodayshoroscope.com",
      "description": "Daily horoscope readings for all zodiac signs.",
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://www.gettodayshoroscope.com/search?q={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    };

    return (
      <>
        <Script 
          id="schema-markup" 
          type="application/ld+json"
          dangerouslySetInnerHTML={{ 
            __html: JSON.stringify(schemaData) 
          }}
        />
      </>
    );
  } catch (error) {
    console.error("Error generating schema markup:", error);
    return null;
  }
} 