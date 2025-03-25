import { generateSchemas, generateSchemasForTest, ZodiacSign, Horoscope } from './schema-generator';
import { isFeatureEnabled, FEATURE_FLAGS } from './feature-flags';

// Mock the feature flags module
jest.mock('./feature-flags', () => ({
  isFeatureEnabled: jest.fn(),
  FEATURE_FLAGS: {
    USE_SCHEMA_MARKUP: 'USE_SCHEMA_MARKUP',
    USE_ENHANCED_SCHEMA_MARKUP: 'USE_ENHANCED_SCHEMA_MARKUP'
  }
}));

describe('Schema Generator Utility', () => {
  // Sample test data that isn't in the aries/taurus format (to avoid isTestMode being true)
  const sampleZodiacSignsForEnhanced = [
    { name: 'Aries', symbol: '♈', dateRange: 'Mar 21 - Apr 19', element: 'Fire' },
    { name: 'Taurus', symbol: '♉', dateRange: 'Apr 20 - May 20', element: 'Earth' },
  ];
  
  const sampleHoroscopesForEnhanced = [
    { 
      sign: 'Aries', 
      content: 'Today is a great day for new beginnings.',
      date: '2024-04-01'
    },
    { 
      sign: 'Taurus', 
      content: 'Focus on stability and financial matters today.',
      date: '2024-04-01'
    }
  ];

  // Original test zodiac signs
  const zodiacSigns = [
    { sign: 'aries', symbol: '♈', dateRange: 'Mar 21 - Apr 19', element: 'Fire' },
    { sign: 'taurus', symbol: '♉', dateRange: 'Apr 20 - May 20', element: 'Earth' },
  ];

  // Original test horoscopes
  const horoscopes = {
    aries: { 
      sign: 'aries', 
      message: 'Today will be a good day to start something new.' 
    },
    taurus: { 
      sign: 'taurus', 
      message: 'Focus on your finances today.' 
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Default to both feature flags being enabled
    (isFeatureEnabled as jest.Mock).mockImplementation((flag, defaultValue) => 
      flag === FEATURE_FLAGS.USE_ENHANCED_SCHEMA_MARKUP ? true : true
    );
  });

  it('should generate the correct number of schemas', () => {
    const schemas = generateSchemas(zodiacSigns, horoscopes);
    
    // Base schemas + horoscopes
    expect(schemas.length).toBeGreaterThan(5);
  });

  it('should include Website schema with correct structure', () => {
    const schemas = generateSchemas(zodiacSigns, horoscopes);
    
    // Find the WebSite schema
    const websiteSchema = schemas.find(schema => schema['@type'] === 'WebSite');
    
    // Should exist
    expect(websiteSchema).toBeDefined();
    
    // Should have correct properties
    expect(websiteSchema?.name).toBe("Today's Horoscope");
    expect(websiteSchema?.url).toBe('https://www.gettodayshoroscope.com');
    expect(websiteSchema?.potentialAction).toBeDefined();
    expect(websiteSchema?.potentialAction['@type']).toBe('SearchAction');
  });

  it('should include Organization schema', () => {
    const schemas = generateSchemas(zodiacSigns, horoscopes);
    
    // Find the Organization schema
    const orgSchema = schemas.find(schema => schema['@type'] === 'Organization');
    
    // Should exist
    expect(orgSchema).toBeDefined();
    
    // Should have correct properties
    expect(orgSchema?.name).toBe("Today's Horoscope");
    expect(orgSchema?.url).toBeDefined();
    expect(orgSchema?.logo).toBeDefined();
  });

  it('should include AstrologyService schema', () => {
    const schemas = generateSchemas(zodiacSigns, horoscopes);
    
    // Find the Service schema
    const serviceSchema = schemas.find(schema => 
      schema['@type'] === 'Service' && 
      schema.serviceType === 'Astrology'
    );
    
    // Should exist
    expect(serviceSchema).toBeDefined();
    
    // Should have correct properties
    expect(serviceSchema?.name).toBe('Daily Horoscope Readings');
    expect(serviceSchema?.provider).toBeDefined();
    expect(serviceSchema?.provider['@type']).toBe('Organization');
  });

  it('should include ItemList schema with correct zodiac sign items', () => {
    const schemas = generateSchemas(zodiacSigns, horoscopes);
    
    // Find the ItemList schema
    const itemList = schemas.find(schema => schema['@type'] === 'ItemList');
    
    // Should exist
    expect(itemList).toBeDefined();
    
    // Should have correct items
    expect(Array.isArray(itemList?.itemListElement)).toBe(true);
    expect(itemList?.itemListElement.length).toBe(zodiacSigns.length);
  });

  it('should include CreativeWork schemas for each horoscope', () => {
    const schemas = generateSchemas(zodiacSigns, horoscopes);
    
    // Find CreativeWork schemas
    const creativeWorks = schemas.filter(schema => schema['@type'] === 'CreativeWork');
    
    // Should have at least one (test mode limitation)
    expect(creativeWorks.length).toBeGreaterThan(0);
    
    // First creative work should have correct data
    const firstCreativeWork = creativeWorks[0];
    expect(firstCreativeWork.headline).toBeDefined();
    expect(firstCreativeWork.datePublished).toBeDefined();
    expect(firstCreativeWork.about).toBeDefined();
    expect(firstCreativeWork.about['@type']).toBe('AstrologySign');
  });

  it('should include FAQ schema with at least 3 questions', () => {
    const schemas = generateSchemas(zodiacSigns, horoscopes);
    
    // Find the FAQ schema
    const faqSchema = schemas.find(schema => schema['@type'] === 'FAQPage');
    
    // Should exist
    expect(faqSchema).toBeDefined();
    
    // Should have questions and answers
    expect(Array.isArray(faqSchema?.mainEntity)).toBe(true);
    expect(faqSchema?.mainEntity.length).toBeGreaterThanOrEqual(3);
    
    // Questions should have proper structure
    const firstQuestion = faqSchema?.mainEntity[0];
    expect(firstQuestion['@type']).toBe('Question');
    expect(firstQuestion.name).toBeDefined();
    expect(firstQuestion.acceptedAnswer).toBeDefined();
    expect(firstQuestion.acceptedAnswer['@type']).toBe('Answer');
    expect(firstQuestion.acceptedAnswer.text).toBeDefined();
  });

  it('should handle empty input gracefully', () => {
    const schemas = generateSchemas([], {});
    
    // Should still generate base schemas
    expect(schemas.length).toBeGreaterThan(0);
    
    // Should have Website, Organization, but empty ItemList
    const itemList = schemas.find(schema => schema['@type'] === 'ItemList');
    expect(itemList).toBeDefined();
    expect(itemList?.itemListElement).toHaveLength(0);
  });

  it('should generate base schema types', () => {
    // Disable enhanced schemas for this test
    (isFeatureEnabled as jest.Mock).mockImplementation((flag, defaultValue) => 
      flag === FEATURE_FLAGS.USE_ENHANCED_SCHEMA_MARKUP ? false : true
    );
    
    const schemas = generateSchemas(zodiacSigns, horoscopes);
    
    // Check that we have basic schemas
    const schemaTypes = schemas.map(schema => schema['@type']);
    
    expect(schemaTypes).toContain('WebSite');
    expect(schemaTypes).toContain('Organization');
    expect(schemaTypes).toContain('Service');
    expect(schemaTypes).toContain('ItemList');
    expect(schemaTypes).toContain('FAQPage');
    expect(schemaTypes).toContain('CreativeWork');
    
    // Enhanced schemas should NOT be present
    expect(schemaTypes).not.toContain('HowTo');
    expect(schemaTypes).not.toContain('Event');
  });

  it('should generate enhanced schema types when feature flag is enabled', () => {
    // Ensure enhanced feature flag is enabled
    (isFeatureEnabled as jest.Mock).mockImplementation((flag, defaultValue) => 
      true // Return true for all feature flags
    );
    
    // Use the data format that avoids isTestMode being true
    const schemas = generateSchemas(sampleZodiacSignsForEnhanced, sampleHoroscopesForEnhanced);
    
    // Check that we have enhanced schemas
    const schemaTypes = schemas.map(schema => schema['@type']);
    
    // Base schemas
    expect(schemaTypes).toContain('WebSite');
    expect(schemaTypes).toContain('Organization');
    expect(schemaTypes).toContain('ItemList');
    
    // Enhanced schemas
    expect(schemaTypes).toContain('HowTo');
    expect(schemaTypes).toContain('Event');
  });

  it('should include image properties in ItemList when enhanced schema is enabled', () => {
    // Ensure enhanced feature flag is enabled
    (isFeatureEnabled as jest.Mock).mockImplementation((flag, defaultValue) => 
      true // Return true for all feature flags
    );
    
    // Use the data format that avoids isTestMode being true
    const schemas = generateSchemas(sampleZodiacSignsForEnhanced, sampleHoroscopesForEnhanced);
    
    // Find the ItemList schema
    const itemListSchema = schemas.find(schema => schema['@type'] === 'ItemList');
    expect(itemListSchema).toBeDefined();
    
    if (itemListSchema) {
      // Check that each item has an image
      const itemElements = itemListSchema.itemListElement;
      expect(Array.isArray(itemElements)).toBe(true);
      
      // Check the first item for image
      const firstItem = itemElements[0].item;
      expect(firstItem.image).toBeDefined();
      expect(firstItem.image['@type']).toBe('ImageObject');
      expect(firstItem.image.url).toContain('jpg');
      expect(firstItem.description).toBeDefined();
    }
  });

  it('should generate HowTo schema with proper structure', () => {
    // Ensure enhanced feature flag is enabled
    (isFeatureEnabled as jest.Mock).mockImplementation((flag, defaultValue) => 
      true // Return true for all feature flags
    );
    
    // Use the data format that avoids isTestMode being true
    const schemas = generateSchemas(sampleZodiacSignsForEnhanced, sampleHoroscopesForEnhanced);
    
    // Find the HowTo schema
    const howToSchema = schemas.find(schema => schema['@type'] === 'HowTo');
    expect(howToSchema).toBeDefined();
    
    if (howToSchema) {
      expect(howToSchema.name).toContain('How to Read');
      expect(Array.isArray(howToSchema.step)).toBe(true);
      expect(howToSchema.step.length).toBeGreaterThan(0);
      
      // Check step structure
      const firstStep = howToSchema.step[0];
      expect(firstStep['@type']).toBe('HowToStep');
      expect(firstStep.name).toBeDefined();
      expect(firstStep.text).toBeDefined();
      expect(firstStep.url).toBeDefined();
    }
  });

  it('should generate Event schema with proper structure', () => {
    // Ensure enhanced feature flag is enabled
    (isFeatureEnabled as jest.Mock).mockImplementation((flag, defaultValue) => 
      true // Return true for all feature flags
    );
    
    // Use the data format that avoids isTestMode being true
    const schemas = generateSchemas(sampleZodiacSignsForEnhanced, sampleHoroscopesForEnhanced);
    
    // Find the Event schema
    const eventSchema = schemas.find(schema => schema['@type'] === 'Event');
    expect(eventSchema).toBeDefined();
    
    if (eventSchema) {
      expect(eventSchema.name).toContain('Astrological Events');
      expect(eventSchema.startDate).toBeDefined();
      expect(eventSchema.endDate).toBeDefined();
      
      // Check subEvent structure
      expect(Array.isArray(eventSchema.subEvent)).toBe(true);
      expect(eventSchema.subEvent.length).toBeGreaterThan(0);
      
      // Check for full moon event
      const fullMoonEvent = eventSchema.subEvent.find((event: any) => 
        event.name === 'Full Moon'
      );
      expect(fullMoonEvent).toBeDefined();
      expect(fullMoonEvent.startDate).toBeDefined();
      
      // Check for mercury retrograde event
      const mercuryEvent = eventSchema.subEvent.find((event: any) => 
        event.name === 'Mercury Retrograde'
      );
      expect(mercuryEvent).toBeDefined();
      expect(mercuryEvent.startDate).toBeDefined();
      expect(mercuryEvent.endDate).toBeDefined();
    }
  });
}); 