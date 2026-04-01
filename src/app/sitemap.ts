import { MetadataRoute } from 'next';
import { getValidMonthSlugs } from '@/utils/monthly-content';
import { VALID_SIGNS } from '@/constants/zodiac';

/**
 * Generate the sitemap according to Next.js App Router conventions.
 * Accessible at /sitemap.xml
 *
 * URL counts:
 *  1  home
 * 12  sign pages
 * 24  monthly pages (12 signs × 2 months)
 *  1  about/author
 * ──
 * 38  total
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const today = new Date();
  const baseUrl = 'https://www.gettodayshoroscope.com';
  const monthSlugs = getValidMonthSlugs();

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

  const monthlyPages: MetadataRoute.Sitemap = VALID_SIGNS.flatMap((sign) =>
    monthSlugs.map((monthSlug) => ({
      url: `${baseUrl}/horoscope/${sign}/monthly/${monthSlug}`,
      lastModified: today,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }))
  );

  const aboutPage: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/about/author`,
      lastModified: today,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];

  return [...home, ...signPages, ...monthlyPages, ...aboutPage];
}
