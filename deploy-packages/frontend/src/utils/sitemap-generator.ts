/**
 * XML Sitemap Generator Utility
 * 
 * This utility generates an XML sitemap for the horoscope application.
 * It includes the main pages and zodiac sign-specific pages.
 */

import { ZODIAC_SIGNS } from "@/constants";

// Base URL for the site
const SITE_URL = 'https://www.gettodayshoroscope.com';

/**
 * Interface for a sitemap URL entry
 */
interface SitemapURL {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

/**
 * Get today's date in ISO format for lastmod
 * @returns ISO formatted date string
 */
const getTodayISO = (): string => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Generate the base URLs for the sitemap (static pages)
 * @returns Array of base sitemap URLs
 */
const generateBaseURLs = (): SitemapURL[] => {
  // Today's date for lastmod
  const today = getTodayISO();
  
  return [
    { 
      loc: SITE_URL, 
      lastmod: today, 
      changefreq: 'daily', 
      priority: 1.0 
    },
    { 
      loc: `${SITE_URL}/horoscopes`, 
      lastmod: today, 
      changefreq: 'daily', 
      priority: 0.9 
    },
    { 
      loc: `${SITE_URL}/about`, 
      lastmod: today, 
      changefreq: 'monthly', 
      priority: 0.7 
    },
    { 
      loc: `${SITE_URL}/contact`, 
      lastmod: today, 
      changefreq: 'monthly', 
      priority: 0.6 
    },
  ];
};

/**
 * Generate URLs for each zodiac sign
 * @returns Array of zodiac-specific sitemap URLs
 */
const generateZodiacURLs = (): SitemapURL[] => {
  const today = getTodayISO();
  
  return ZODIAC_SIGNS.map(sign => ({
    loc: `${SITE_URL}/horoscope/${sign.toLowerCase()}`,
    lastmod: today,
    changefreq: 'daily',
    priority: 0.8
  }));
};

/**
 * Format sitemap URL entries into XML
 * @param urls Array of sitemap URL objects
 * @returns XML string for the URL entries
 */
const formatUrlEntries = (urls: SitemapURL[]): string => {
  return urls.map(url => `
    <url>
      <loc>${url.loc}</loc>
      ${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ''}
      ${url.changefreq ? `<changefreq>${url.changefreq}</changefreq>` : ''}
      ${url.priority !== undefined ? `<priority>${url.priority.toFixed(1)}</priority>` : ''}
    </url>
  `).join('');
};

/**
 * Generate the complete XML sitemap
 * @returns Complete XML sitemap as a string
 */
export const generateSitemap = (): string => {
  // Combine base URLs and zodiac sign URLs
  const allUrls = [...generateBaseURLs(), ...generateZodiacURLs()];
  
  // Format as XML
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${formatUrlEntries(allUrls)}
</urlset>`;
};

/**
 * Export functions for testing
 */
export const _testExports = {
  generateBaseURLs,
  generateZodiacURLs,
  formatUrlEntries
}; 