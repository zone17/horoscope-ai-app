import { generateSitemap, _testExports } from './sitemap-generator';
import { ZODIAC_SIGNS } from '@/constants';

// Destructure test exports
const { generateBaseURLs, generateZodiacURLs, formatUrlEntries } = _testExports;

// Mock the date to have consistent test results
const mockDate = new Date('2024-03-23');
const mockISODate = '2024-03-23';

// Store the original Date 
const originalDate = global.Date;

describe('Sitemap Generator', () => {
  beforeAll(() => {
    // Mock Date to return our fixed date
    global.Date = class extends Date {
      constructor() {
        super();
        return mockDate;
      }
      
      toISOString() {
        return `${mockISODate}T00:00:00.000Z`;
      }
    } as any;
  });
  
  afterAll(() => {
    // Restore original Date
    global.Date = originalDate;
  });
  
  describe('generateBaseURLs', () => {
    it('should generate base URLs with today\'s date', () => {
      const urls = generateBaseURLs();
      
      // Check if we have at least the homepage
      expect(urls.length).toBeGreaterThan(0);
      
      // Check if homepage has expected properties
      const homepage = urls[0];
      expect(homepage.loc).toBe('https://www.gettodayshoroscope.com');
      expect(homepage.lastmod).toBe(mockISODate);
      expect(homepage.changefreq).toBe('daily');
      expect(homepage.priority).toBe(1.0);
    });
  });
  
  describe('generateZodiacURLs', () => {
    it('should generate a URL for each zodiac sign', () => {
      const urls = generateZodiacURLs();
      
      // Check if we have the same number of URLs as zodiac signs
      expect(urls.length).toBe(ZODIAC_SIGNS.length);
      
      // Check if each zodiac sign has a URL
      ZODIAC_SIGNS.forEach(sign => {
        const hasUrl = urls.some(url => 
          url.loc === `https://www.gettodayshoroscope.com/horoscope/${sign.toLowerCase()}`
        );
        expect(hasUrl).toBe(true);
      });
      
      // Check properties of first URL
      const firstUrl = urls[0];
      expect(firstUrl.lastmod).toBe(mockISODate);
      expect(firstUrl.changefreq).toBe('daily');
      expect(firstUrl.priority).toBe(0.8);
    });
  });
  
  describe('formatUrlEntries', () => {
    it('should format URLs as XML entries', () => {
      const urls = [
        {
          loc: 'https://www.gettodayshoroscope.com',
          lastmod: '2024-03-23',
          changefreq: 'daily' as const,
          priority: 1.0
        }
      ];
      
      const xml = formatUrlEntries(urls);
      
      // Check if XML contains expected elements
      expect(xml).toContain('<url>');
      expect(xml).toContain('<loc>https://www.gettodayshoroscope.com</loc>');
      expect(xml).toContain('<lastmod>2024-03-23</lastmod>');
      expect(xml).toContain('<changefreq>daily</changefreq>');
      expect(xml).toContain('<priority>1.0</priority>');
      expect(xml).toContain('</url>');
    });
    
    it('should handle optional fields', () => {
      const urls = [
        { loc: 'https://www.gettodayshoroscope.com' }
      ];
      
      const xml = formatUrlEntries(urls);
      
      // Only loc is required
      expect(xml).toContain('<loc>https://www.gettodayshoroscope.com</loc>');
      expect(xml).not.toContain('<lastmod>');
      expect(xml).not.toContain('<changefreq>');
      expect(xml).not.toContain('<priority>');
    });
  });
  
  describe('generateSitemap', () => {
    it('should generate a complete XML sitemap', () => {
      const sitemap = generateSitemap();
      
      // Check XML declaration and namespace
      expect(sitemap).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(sitemap).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
      
      // Check if it contains homepage
      expect(sitemap).toContain('<loc>https://www.gettodayshoroscope.com</loc>');
      
      // Check if it contains all zodiac signs
      ZODIAC_SIGNS.forEach(sign => {
        expect(sitemap).toContain(
          `<loc>https://www.gettodayshoroscope.com/horoscope/${sign.toLowerCase()}</loc>`
        );
      });
    });
  });
}); 