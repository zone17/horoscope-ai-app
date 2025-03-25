import { isFeatureEnabled, FEATURE_FLAGS } from '@/utils/feature-flags';
import { MetadataRoute } from 'next';

/**
 * Generates robots.txt content with optional sitemap reference
 * Uses the feature flag to conditionally include the sitemap
 */
export default function robots(): MetadataRoute.Robots {
  // Base configuration
  const robotsConfig: MetadataRoute.Robots = {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/*', '/debug/*'],
    }
  };
  
  // Check if sitemap is enabled
  const isSitemapEnabled = isFeatureEnabled(FEATURE_FLAGS.USE_XML_SITEMAP, true);
  
  // Add sitemap URL if enabled
  if (isSitemapEnabled) {
    robotsConfig.sitemap = 'https://www.gettodayshoroscope.com/sitemap.xml';
  }
  
  return robotsConfig;
} 