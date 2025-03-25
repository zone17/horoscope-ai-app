'use client';

import { useEffect } from 'react';
import Script from 'next/script';
import { isFeatureEnabled, FEATURE_FLAGS } from '@/utils/feature-flags';
import { generateSchemas } from '@/utils/schema-generator';

interface SchemaMarkupProps {
  zodiacSigns: any[];
  horoscopes: Record<string, any>;
}

/**
 * Helper function to generate schemas - exported for testing
 */
export function generateSchemaMarkup(zodiacSigns: any[], horoscopes: Record<string, any>) {
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
    // Generate all schema objects using our utility
    return generateSchemas(zodiacSigns, horoscopes);
  } catch (error) {
    console.error("Error generating schema markup:", error);
    return null;
  }
}

/**
 * SchemaMarkup component for implementing structured data
 * This component renders JSON-LD schema for SEO improvements
 */
export default function SchemaMarkup({ zodiacSigns, horoscopes }: SchemaMarkupProps) {
  // Generate schemas - will return null if feature flag is disabled
  const schemas = generateSchemaMarkup(zodiacSigns, horoscopes);
  
  // If we have no schemas, return null
  if (!schemas) {
    return null;
  }
  
  // Return a Script component for each schema
  return (
    <>
      {schemas.map((schema, index) => (
        <Script 
          key={`schema-${index}`}
          id={`schema-markup-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ 
            __html: JSON.stringify(schema) 
          }}
        />
      ))}
    </>
  );
} 