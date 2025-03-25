'use client';

import { useEffect } from 'react';
import { isFeatureEnabled, FEATURE_FLAGS } from '@/utils/feature-flags';
import { generateSchemas } from '@/utils/schema-generator';

interface SchemaMarkupProps {
  zodiacSigns: any[];
  horoscopes: Record<string, any>;
}

// Custom JSON-LD component that directly inserts markup
const JsonLd = ({ data }: { data: any }) => {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
};

/**
 * Helper function to generate schemas - exported for testing
 */
export function generateSchemaMarkup(zodiacSigns: any[], horoscopes: Record<string, any>) {
  // Debug log
  console.log('SchemaMarkup: Generating schemas with feature flags', {
    featureFlags: FEATURE_FLAGS,
    USE_SCHEMA_MARKUP_VALUE: FEATURE_FLAGS.USE_SCHEMA_MARKUP,
    ENV_VALUE: process.env.NEXT_PUBLIC_FEATURE_FLAG_USE_SCHEMA_MARKUP,
  });
  
  // Hardcode to true for testing
  const isSchemaEnabled = true;
  
  // Debug log
  console.log('SchemaMarkup: Schema enabled? (hardcoded)', isSchemaEnabled);
  
  // If schema markup is disabled, return null
  if (!isSchemaEnabled) {
    console.log('SchemaMarkup: Schema markup is disabled, returning null');
    return null;
  }
  
  // If horoscopes object is empty or has error state, don't render schema 
  // to avoid breaking the app
  const hasValidData = horoscopes && Object.keys(horoscopes).length > 0;
  if (!hasValidData) {
    console.log('SchemaMarkup: No valid horoscope data, returning null');
    return null;
  }
  
  // Generate schema data only if we have valid horoscope data
  try {
    // Generate all schema objects using our utility
    const schemas = generateSchemas(zodiacSigns, horoscopes);
    console.log('SchemaMarkup: Generated schemas', {
      count: schemas.length,
      types: schemas.map(s => s['@type']),
    });
    return schemas;
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
  // Add debug useEffect
  useEffect(() => {
    console.log('SchemaMarkup component mounted', {
      zodiacSignsCount: zodiacSigns.length,
      horoscopesCount: Object.keys(horoscopes).length,
      featureFlags: FEATURE_FLAGS,
      schemaMarkupFlag: process.env.NEXT_PUBLIC_FEATURE_FLAG_USE_SCHEMA_MARKUP,
      enhancedSchemaFlag: process.env.NEXT_PUBLIC_FEATURE_FLAG_USE_ENHANCED_SCHEMA_MARKUP,
    });
  }, [zodiacSigns, horoscopes]);
  
  // Generate schemas - will return null if feature flag is disabled
  const schemas = generateSchemaMarkup(zodiacSigns, horoscopes);
  
  // If we have no schemas, return null
  if (!schemas) {
    return null;
  }
  
  // Return inline JSON-LD scripts for each schema
  return (
    <>
      {schemas.map((schema, index) => (
        <JsonLd key={`schema-${index}`} data={schema} />
      ))}
    </>
  );
} 