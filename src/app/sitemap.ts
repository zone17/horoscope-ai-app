import { MetadataRoute } from 'next';

const ZODIAC_SIGNS = [
  'aries', 'taurus', 'gemini', 'cancer',
  'leo', 'virgo', 'libra', 'scorpio',
  'sagittarius', 'capricorn', 'aquarius', 'pisces',
] as const;

/**
 * Generate the sitemap according to Next.js App Router conventions.
 * Accessible at /sitemap.xml
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

  const signPages: MetadataRoute.Sitemap = ZODIAC_SIGNS.map((sign) => ({
    url: `${baseUrl}/horoscope/${sign}`,
    lastModified: today,
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  return [...home, ...signPages];
}
