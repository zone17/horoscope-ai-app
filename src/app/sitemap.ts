import { MetadataRoute } from 'next';
import { VALID_SIGNS } from '@/constants/zodiac';

/**
 * Generate the sitemap according to Next.js App Router conventions.
 * Accessible at /sitemap.xml
 *
 * URL counts:
 *  1  home
 * 12  sign pages
 *  3  legal/about (about, privacy, terms)
 *  1  about/author
 * ──
 * 17  total
 *
 * The previous sitemap included 1080+ daily archive URLs and 24 monthly
 * URLs that pointed at routes which never properly rendered (Wave 1B QA
 * findings 1.5, 1.6). Those routes were removed in PR #92; rebuilding
 * archive surfaces is tracked as a separate feature.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const today = new Date();
  const baseUrl = 'https://www.gettodayshoroscope.com';

  const home: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: today,
      changeFrequency: 'daily',
      priority: 1.0,
    },
  ];

  const signPages: MetadataRoute.Sitemap = VALID_SIGNS.map((sign) => ({
    url: `${baseUrl}/horoscope/${sign}`,
    lastModified: today,
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  const legalPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/about`,
      lastModified: today,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: today,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: today,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];

  const aboutAuthorPage: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/about/author`,
      lastModified: today,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];

  return [...home, ...signPages, ...legalPages, ...aboutAuthorPage];
}
