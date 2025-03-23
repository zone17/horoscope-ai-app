/**
 * Regression tests for schema generator utility
 * 
 * These tests verify that our schema generator produces valid JSON-LD 
 * structured data for SEO purposes.
 */
import { generateSchemas } from './schema-generator';
import { mockZodiacSigns, mockHoroscopes } from '@/mocks/data';

describe('Schema Generator regression tests', () => {
  it('@regression should generate website schema with correct structure', () => {
    const schemas = generateSchemas(mockZodiacSigns, mockHoroscopes);
    
    const websiteSchema = schemas.find(schema => schema['@type'] === 'WebSite');
    expect(websiteSchema).toBeDefined();
    expect(websiteSchema?.name).toBe("Today's Horoscope");
    expect(websiteSchema?.url).toBe("https://www.gettodayshoroscope.com");
    expect(websiteSchema?.potentialAction?.['@type']).toBe('SearchAction');
  });
  
  it('@regression should generate breadcrumb schema with correct structure', () => {
    const schemas = generateSchemas(mockZodiacSigns, mockHoroscopes);
    
    const breadcrumbSchema = schemas.find(schema => schema['@type'] === 'BreadcrumbList');
    expect(breadcrumbSchema).toBeDefined();
    expect(breadcrumbSchema?.itemListElement).toBeInstanceOf(Array);
    expect(breadcrumbSchema?.itemListElement.length).toBeGreaterThan(0);
    
    // Check first breadcrumb item
    const firstItem = breadcrumbSchema?.itemListElement[0];
    expect(firstItem?.['@type']).toBe('ListItem');
    expect(firstItem?.position).toBe(1);
    expect(firstItem?.name).toBe('Home');
  });
  
  it('@regression should generate article schema for each horoscope', () => {
    const schemas = generateSchemas(mockZodiacSigns, mockHoroscopes);
    
    // Find all article schemas
    const articleSchemas = schemas.filter(schema => schema['@type'] === 'Article');
    
    // Should have one article per horoscope
    expect(articleSchemas.length).toEqual(mockHoroscopes.length);
    
    // Check first article schema
    const firstArticle = articleSchemas[0];
    expect(firstArticle.headline).toContain(mockHoroscopes[0].sign);
    expect(firstArticle.description).toContain(mockHoroscopes[0].content.substring(0, 10));
    expect(firstArticle.datePublished).toBeDefined();
    
    // Check publisher info is consistent across all articles
    const publisherNames = articleSchemas.map(schema => schema.publisher.name);
    expect(new Set(publisherNames).size).toBe(1); // All publisher names should be the same
  });
  
  it('@regression should handle empty data gracefully', () => {
    const schemas = generateSchemas([], []);
    
    // Should still generate website and breadcrumb schemas
    expect(schemas.length).toBeGreaterThanOrEqual(2);
    expect(schemas.some(schema => schema['@type'] === 'WebSite')).toBe(true);
    expect(schemas.some(schema => schema['@type'] === 'BreadcrumbList')).toBe(true);
    
    // But no article schemas
    expect(schemas.some(schema => schema['@type'] === 'Article')).toBe(false);
  });
}); 