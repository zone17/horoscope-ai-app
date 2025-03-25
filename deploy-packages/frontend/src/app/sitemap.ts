import { isFeatureEnabled, FEATURE_FLAGS } from '@/utils/feature-flags';
import { ZODIAC_SIGNS } from '@/constants';
import { MetadataRoute } from 'next';

/**
 * Generate the sitemap according to Next.js App Router conventions
 * This will be accessible at /sitemap.xml
 */
export default function sitemap(): MetadataRoute.Sitemap {
  // Check if sitemap feature is enabled
  const isSitemapEnabled = isFeatureEnabled(FEATURE_FLAGS.USE_XML_SITEMAP, false);
  
  // Return empty sitemap if feature is disabled
  if (!isSitemapEnabled) {
    return [];
  }
  
  const today = new Date();
  const baseUrl = 'https://www.gettodayshoroscope.com';
  
  // Base URLs (static pages)
  const baseUrls: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: today,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/horoscopes`,
      lastModified: today,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: today,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: today,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ];
  
  // Generate URLs for each zodiac sign
  const zodiacUrls: MetadataRoute.Sitemap = ZODIAC_SIGNS.map(sign => ({
    url: `${baseUrl}/horoscope/${sign.toLowerCase()}`,
    lastModified: today,
    changeFrequency: 'daily',
    priority: 0.8,
  }));
  
  // Combine all URLs
  return [...baseUrls, ...zodiacUrls];
} 