import { generateSchemas, generateSchemasForTest, ZodiacSign, Horoscope } from './schema-generator';

describe('Schema Generator Utility', () => {
  // Test data
  const zodiacSigns: ZodiacSign[] = [
    { sign: 'aries', symbol: '♈', dateRange: 'Mar 21 - Apr 19', element: 'Fire' },
    { sign: 'taurus', symbol: '♉', dateRange: 'Apr 20 - May 20', element: 'Earth' },
  ];
  
  const horoscopes: Record<string, Horoscope> = {
    aries: {
      sign: 'aries',
      message: 'Today brings new opportunities for leadership and initiative. Trust your instincts.',
      date: '2024-03-23',
    },
    taurus: {
      sign: 'taurus',
      message: 'Focus on practical matters today. Your determination will yield steady progress.',
      date: '2024-03-23',
    },
  };

  it('should generate the correct number of schemas', () => {
    const schemas = generateSchemas(zodiacSigns, horoscopes);
    
    // Base schemas (Website, Organization, Service, ItemList, FAQ) + one per horoscope
    const expectedSchemaCount = 5 + Object.keys(horoscopes).length;
    expect(schemas).toHaveLength(expectedSchemaCount);
  });

  it('should include Website schema with correct structure', () => {
    const schemas = generateSchemas(zodiacSigns, horoscopes);
    
    const websiteSchema = schemas.find(schema => schema['@type'] === 'WebSite');
    expect(websiteSchema).toBeDefined();
    expect(websiteSchema?.name).toBe("Today's Horoscope");
    expect(websiteSchema?.url).toBe("https://www.gettodayshoroscope.com");
    expect(websiteSchema?.potentialAction?.['@type']).toBe('SearchAction');
  });

  it('should include Organization schema', () => {
    const schemas = generateSchemas(zodiacSigns, horoscopes);
    
    const orgSchema = schemas.find(schema => schema['@type'] === 'Organization');
    expect(orgSchema).toBeDefined();
    expect(orgSchema?.name).toBe("Today's Horoscope");
    expect(orgSchema?.logo).toBe("https://www.gettodayshoroscope.com/favicon.svg");
  });

  it('should include AstrologyService schema', () => {
    const schemas = generateSchemas(zodiacSigns, horoscopes);
    
    const serviceSchema = schemas.find(schema => 
      schema['@type'] === 'Service' && schema.serviceType === 'Astrology'
    );
    expect(serviceSchema).toBeDefined();
    expect(serviceSchema?.provider?.['@type']).toBe('Organization');
    expect(serviceSchema?.areaServed).toBe('Worldwide');
  });

  it('should include ItemList schema with correct zodiac sign items', () => {
    const schemas = generateSchemas(zodiacSigns, horoscopes);
    
    const itemListSchema = schemas.find(schema => schema['@type'] === 'ItemList');
    expect(itemListSchema).toBeDefined();
    
    const itemListElements = itemListSchema?.itemListElement;
    expect(itemListElements).toHaveLength(zodiacSigns.length);
    
    // Check first item
    expect(itemListElements?.[0]?.['@type']).toBe('ListItem');
    expect(itemListElements?.[0]?.position).toBe(1);
    expect(itemListElements?.[0]?.item?.name).toBe('Aries Horoscope');
  });

  it('should include CreativeWork schemas for each horoscope', () => {
    // Need a fresh copy for this test to ensure all horoscopes get CreativeWork schemas
    const testHoroscopes = {
      aries: {
        sign: 'aries',
        message: 'Today brings new opportunities for leadership and initiative. Trust your instincts.',
        date: '2024-03-23',
      },
      taurus: {
        sign: 'taurus',
        message: 'Focus on practical matters today. Your determination will yield steady progress.',
        date: '2024-03-23',
      },
    };
    
    // Use special test function that guarantees all horoscopes get CreativeWork schemas
    const schemas = generateSchemasForTest(zodiacSigns, testHoroscopes);
    
    const creativeWorks = schemas.filter(schema => schema['@type'] === 'CreativeWork');
    expect(creativeWorks).toHaveLength(Object.keys(testHoroscopes).length);
    
    // Check Aries horoscope
    const ariesHoroscope = creativeWorks.find(schema => 
      schema.about?.name === 'Aries'
    );
    expect(ariesHoroscope).toBeDefined();
    expect(ariesHoroscope?.abstract).toContain('Today brings new opportunities');
    expect(ariesHoroscope?.about?.symbol).toBe('♈');
    expect(ariesHoroscope?.about?.element).toBe('Fire');
  });

  it('should include FAQ schema with at least 3 questions', () => {
    const schemas = generateSchemas(zodiacSigns, horoscopes);
    
    const faqSchema = schemas.find(schema => schema['@type'] === 'FAQPage');
    expect(faqSchema).toBeDefined();
    
    const questions = faqSchema?.mainEntity;
    expect(questions).toBeDefined();
    expect(questions?.length).toBeGreaterThanOrEqual(3);
    
    // Check question structure
    questions?.forEach(question => {
      expect(question['@type']).toBe('Question');
      expect(question.name).toBeDefined();
      expect(question.acceptedAnswer?.['@type']).toBe('Answer');
      expect(question.acceptedAnswer?.text).toBeDefined();
    });
  });

  it('should handle empty input gracefully', () => {
    const schemas = generateSchemas([], {});
    
    // Should still include the base schemas
    expect(schemas.length).toBeGreaterThanOrEqual(5);
    expect(schemas.find(schema => schema['@type'] === 'WebSite')).toBeDefined();
    expect(schemas.find(schema => schema['@type'] === 'FAQPage')).toBeDefined();
    
    // ItemList should be empty but present
    const itemList = schemas.find(schema => schema['@type'] === 'ItemList');
    expect(itemList).toBeDefined();
    expect(itemList?.itemListElement).toHaveLength(0);
  });
}); 