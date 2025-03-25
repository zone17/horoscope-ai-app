import { ZODIAC_SIGNS } from '@/constants/index';
import { generateSchemas } from '@/utils/schema-generator';

/**
 * Server-side schema markup component that generates static schemas
 * This component is meant to be imported in layout.tsx to provide base schemas
 */
export default function SchemaMarkupServer() {
  // Check environment variables directly
  const schemaMarkupEnabled = process.env.NEXT_PUBLIC_FEATURE_FLAG_USE_SCHEMA_MARKUP === 'true';
  const enhancedSchemaEnabled = process.env.NEXT_PUBLIC_FEATURE_FLAG_USE_ENHANCED_SCHEMA_MARKUP === 'true';
  
  // If schema markup is disabled, return null
  if (!schemaMarkupEnabled) {
    return null;
  }
  
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
  
  // Service schema
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Daily Horoscope Guidance",
    "description": "Daily astrological insights to help with mindfulness and self-reflection",
    "provider": {
      "@type": "Organization",
      "name": "Today's Horoscope"
    }
  };
  
  // Create a generic FAQPage schema
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How are the daily horoscopes generated?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Our daily horoscopes are created using a combination of astrological principles and advanced AI to provide insightful guidance focused on mindfulness and self-reflection."
        }
      },
      {
        "@type": "Question",
        "name": "What zodiac signs are covered?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "We cover all twelve traditional zodiac signs: Aries, Taurus, Gemini, Cancer, Leo, Virgo, Libra, Scorpio, Sagittarius, Capricorn, Aquarius, and Pisces."
        }
      },
      {
        "@type": "Question",
        "name": "Are the horoscopes predictive?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Rather than making specific predictions, our horoscopes are designed to offer guidance for personal reflection and mindfulness."
        }
      }
    ]
  };
  
  // Create a basic ItemList schema for zodiac signs
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Zodiac Signs",
    "description": "Complete list of zodiac signs covered in our daily horoscopes",
    "itemListElement": ZODIAC_SIGNS.map((sign, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": sign,
      "url": `https://www.gettodayshoroscope.com/#${sign.toLowerCase()}`
    }))
  };
  
  // Article/CreativeWork schema for the main content
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "Today's Horoscope - Daily Guidance for All Zodiac Signs",
    "description": "Get daily horoscope guidance for mindful, spiritual reflection and self-awareness rather than predictions.",
    "author": {
      "@type": "Organization",
      "name": "Today's Horoscope"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Today's Horoscope",
      "logo": {
        "@type": "ImageObject",
        "url": "https://www.gettodayshoroscope.com/favicon.svg"
      }
    },
    "datePublished": new Date().toISOString().split('T')[0],
    "dateModified": new Date().toISOString().split('T')[0]
  };
  
  // Use type assertion for schemas to avoid TypeScript errors with different schema types
  const schemas: Record<string, any>[] = [
    websiteSchema,
    organizationSchema,
    serviceSchema,
    faqSchema,
    itemListSchema,
    articleSchema
  ];
  
  // Add enhanced schemas if enabled
  if (enhancedSchemaEnabled) {
    // HowTo schema (enhanced)
    const howToSchema = {
      "@context": "https://schema.org",
      "@type": "HowTo",
      "name": "How to Interpret Your Daily Horoscope",
      "description": "A guide to getting the most from your daily horoscope reading",
      "step": [
        {
          "@type": "HowToStep",
          "name": "Read with an open mind",
          "text": "Approach your horoscope with curiosity rather than skepticism or blind belief."
        },
        {
          "@type": "HowToStep",
          "name": "Reflect on the guidance",
          "text": "Consider how the insights might apply to your current situation."
        },
        {
          "@type": "HowToStep",
          "name": "Use it for mindfulness",
          "text": "Let your horoscope be a prompt for self-reflection and awareness."
        }
      ]
    };
    
    // Event schema (enhanced)
    const eventSchema = {
      "@context": "https://schema.org",
      "@type": "Event",
      "name": "Daily Horoscope Update",
      "description": "New horoscopes are published daily",
      "startDate": new Date().toISOString().split('T')[0],
      "endDate": new Date().toISOString().split('T')[0],
      "location": {
        "@type": "VirtualLocation",
        "url": "https://www.gettodayshoroscope.com"
      },
      "organizer": {
        "@type": "Organization",
        "name": "Today's Horoscope",
        "url": "https://www.gettodayshoroscope.com"
      }
    };
    
    // Add enhanced schemas to the array
    schemas.push(howToSchema, eventSchema);
  }
  
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