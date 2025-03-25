# XML Sitemap Implementation

This document describes the XML sitemap implementation for the Horoscope AI application.

## Overview

The XML sitemap provides search engines with metadata about the site structure, helping them to more intelligently crawl the site and improve SEO. The implementation generates a sitemap dynamically based on the site's content.

## Feature Flag

The XML sitemap implementation is controlled by a feature flag for easy enabling/disabling:

- **Flag Name**: `USE_XML_SITEMAP`
- **Environment Variable**: `FEATURE_FLAG_USE_XML_SITEMAP` (server-side)
- **Default Value**: `false` (disabled)

## Implementation Details

### 1. Next.js App Router Convention

The implementation follows the Next.js App Router convention for sitemap generation:

- **File Location**: `src/app/sitemap.ts`
- **Format**: TypeScript file exporting a default function that returns a `MetadataRoute.Sitemap` array
- **Access URL**: `/sitemap.xml` (automatically handled by Next.js)

```typescript
// src/app/sitemap.ts
import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://www.gettodayshoroscope.com',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    // More URLs...
  ];
}
```

### 2. Sitemap Content

The sitemap dynamically includes:

- **Base URLs**: Includes homepage, horoscopes main page, about, and contact pages
- **Dynamic URLs**: Automatically generates URLs for each zodiac sign
- **Metadata**: Includes lastmod (today's date), changefreq, and priority tags for each URL

### 3. Robots.txt Integration

The `robots.txt` file is also generated using Next.js App Router conventions:

- **File Location**: `src/app/robots.ts`
- **Access URL**: `/robots.txt` (automatically handled by Next.js)
- **Feature Flag Integration**: Includes the sitemap URL only when the feature flag is enabled

```typescript
// src/app/robots.ts
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/*', '/debug/*'],
    },
    sitemap: 'https://www.gettodayshoroscope.com/sitemap.xml',
  };
}
```

## URL Structure

The sitemap includes:

1. **Static URLs**:
   - Homepage: `https://www.gettodayshoroscope.com`
   - Horoscopes page: `https://www.gettodayshoroscope.com/horoscopes`
   - About page: `https://www.gettodayshoroscope.com/about`
   - Contact page: `https://www.gettodayshoroscope.com/contact`

2. **Dynamic URLs**:
   - Individual zodiac pages: `https://www.gettodayshoroscope.com/horoscope/[sign]`
     - Examples: `.../horoscope/aries`, `.../horoscope/taurus`, etc.

## Testing

The implementation includes:

1. **Manual Testing**:
   1. Enable the feature flag: `FEATURE_FLAG_USE_XML_SITEMAP=true`
   2. Visit `/sitemap.xml` to verify proper XML generation
   3. Validate the XML using Google Search Console's sitemap testing tool

## Deployment

To enable the XML sitemap in production:

1. Add the feature flag to the environment:
   ```
   FEATURE_FLAG_USE_XML_SITEMAP=true
   ```

2. Deploy the changes using the existing deployment scripts
3. Verify the sitemap is accessible at `https://www.gettodayshoroscope.com/sitemap.xml`
4. Submit the sitemap to search engines via their webmaster tools

## Monitoring and Maintenance

- The sitemap automatically updates with today's date each time it's generated
- No scheduled maintenance is required
- Changes to the site structure should be reflected in the sitemap code

## Future Enhancements

Potential improvements for the sitemap implementation:

1. **Multiple sitemaps**: Split into separate sitemaps for different content types
2. **Sitemap index**: Create an index of multiple sitemaps for better organization
3. **Image/video sitemaps**: Add specialized sitemaps for rich media content
4. **Content-driven generation**: Derive URLs from content database rather than static lists 