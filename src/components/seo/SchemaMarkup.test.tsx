import { isFeatureEnabled, FEATURE_FLAGS } from '@/utils/feature-flags';

// Mock the feature flag utility
jest.mock('@/utils/feature-flags', () => ({
  isFeatureEnabled: jest.fn(),
  FEATURE_FLAGS: {
    USE_SCHEMA_MARKUP: 'USE_SCHEMA_MARKUP',
    USE_ENHANCED_SCHEMA_MARKUP: 'USE_ENHANCED_SCHEMA_MARKUP'
  },
}));

describe('SchemaMarkup', () => {
  // Sample test data
  const zodiacSigns = [
    { sign: 'aquarius', symbol: '♒', dateRange: 'Jan 20 - Feb 18', element: 'Air' },
    { sign: 'pisces', symbol: '♓', dateRange: 'Feb 19 - Mar 20', element: 'Water' },
  ];
  
  const horoscopes = {
    aquarius: {
      sign: 'aquarius',
      message: 'A test horoscope message for Aquarius',
      date: '2024-03-23',
    },
    pisces: {
      sign: 'pisces',
      message: 'A test horoscope message for Pisces',
      date: '2024-03-23',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('should not generate schemas when feature flag is disabled', () => {
    // Mock feature flag as disabled
    const { isFeatureEnabled } = require('@/utils/feature-flags');
    (isFeatureEnabled as jest.Mock).mockReturnValue(false);
    
    // Import the component after mocking
    const { generateSchemaMarkup } = require('./SchemaMarkup');
    const result = generateSchemaMarkup(zodiacSigns, horoscopes);
    
    // Assert
    expect(result).toBeNull();
  });

  it('should generate all required schema types when feature flag is enabled', () => {
    // Mock feature flags
    const { isFeatureEnabled } = require('@/utils/feature-flags');
    (isFeatureEnabled as jest.Mock).mockImplementation((flag) => {
      // Enable schema markup but not enhanced schema
      return flag === 'USE_SCHEMA_MARKUP';
    });
    
    // Import the component after mocking
    const { generateSchemaMarkup } = require('./SchemaMarkup');
    const schemas = generateSchemaMarkup(zodiacSigns, horoscopes);
    
    // Assert
    expect(schemas).toBeTruthy();
    expect(Array.isArray(schemas)).toBe(true);
    expect(schemas!.length).toBeGreaterThan(0);
    
    // Check for WebSite schema
    const websiteSchema = schemas!.find(schema => 
      schema['@type'] === 'WebSite'
    );
    expect(websiteSchema).toBeDefined();
    
    // Check for Organization schema
    const organizationSchema = schemas!.find(schema => 
      schema['@type'] === 'Organization'
    );
    expect(organizationSchema).toBeDefined();
    
    // Check for ItemList schema
    const itemListSchema = schemas!.find(schema => 
      schema['@type'] === 'ItemList'
    );
    expect(itemListSchema).toBeDefined();
    
    // Check for FAQPage schema
    const faqSchema = schemas!.find(schema => 
      schema['@type'] === 'FAQPage'
    );
    expect(faqSchema).toBeDefined();
    
    // Check for CreativeWork schema (horoscope content)
    const creativeWorkSchema = schemas!.find(schema => 
      schema['@type'] === 'CreativeWork'
    );
    expect(creativeWorkSchema).toBeDefined();
    
    // Verify enhanced schemas are NOT included
    const howToSchema = schemas!.find(schema => 
      schema['@type'] === 'HowTo'
    );
    expect(howToSchema).toBeUndefined();
    
    const eventSchema = schemas!.find(schema => 
      schema['@type'] === 'Event'
    );
    expect(eventSchema).toBeUndefined();
  });
  
  it('should include enhanced schemas when both feature flags are enabled', () => {
    // Mock both feature flags as enabled
    const { isFeatureEnabled } = require('@/utils/feature-flags');
    (isFeatureEnabled as jest.Mock).mockReturnValue(true);
    
    // Import the component after mocking
    const { generateSchemaMarkup } = require('./SchemaMarkup');
    const schemas = generateSchemaMarkup(zodiacSigns, horoscopes);
    
    // Assert
    expect(schemas).toBeTruthy();
    expect(Array.isArray(schemas)).toBe(true);
    expect(schemas!.length).toBeGreaterThan(0);
    
    // Check for base schemas
    expect(schemas!.find(schema => schema['@type'] === 'WebSite')).toBeDefined();
    expect(schemas!.find(schema => schema['@type'] === 'Organization')).toBeDefined();
    
    // Check for enhanced schemas
    const howToSchema = schemas!.find(schema => 
      schema['@type'] === 'HowTo'
    );
    expect(howToSchema).toBeDefined();
    
    const eventSchema = schemas!.find(schema => 
      schema['@type'] === 'Event'
    );
    expect(eventSchema).toBeDefined();
  });
}); 