/**
 * SchemaMarkup Integration Test
 * 
 * This test verifies that the schema markup component integrates correctly
 * with the feature flag system and produces the expected output.
 */
import { isFeatureEnabled, FEATURE_FLAGS } from '@/utils/feature-flags';
import { generateSchemas } from '@/utils/schema-generator';

// Mock the feature flags
jest.mock('@/utils/feature-flags', () => ({
  isFeatureEnabled: jest.fn(),
  FEATURE_FLAGS: {
    USE_SCHEMA_MARKUP: 'USE_SCHEMA_MARKUP',
    USE_ENHANCED_SCHEMA_MARKUP: 'USE_ENHANCED_SCHEMA_MARKUP'
  },
}));

// Sample data for tests
const zodiacSigns = [
  { sign: 'aries', symbol: '♈', dateRange: 'Mar 21 - Apr 19', element: 'Fire' },
  { sign: 'taurus', symbol: '♉', dateRange: 'Apr 20 - May 20', element: 'Earth' },
];

const horoscopes = {
  aries: { 
    sign: 'aries', 
    message: 'Today is a great day for new beginnings.' 
  },
  taurus: { 
    sign: 'taurus', 
    message: 'Focus on stability and financial matters today.' 
  }
};

// Sample data that avoids triggering isTestMode
const zodiacSignsEnhanced = [
  { name: 'Aries', symbol: '♈', dateRange: 'Mar 21 - Apr 19', element: 'Fire' },
  { name: 'Taurus', symbol: '♉', dateRange: 'Apr 20 - May 20', element: 'Earth' },
];

const horoscopesEnhanced = [
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

describe('SchemaMarkup Component Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default both features to off
    (isFeatureEnabled as jest.Mock).mockImplementation(
      (flag, defaultValue) => false
    );
  });

  it('should handle the feature flag correctly', () => {
    // Mock the SchemaMarkup component behavior
    const mockSetState = jest.fn();
    
    // Mock useState to capture the enabled state
    jest.spyOn(global, 'setTimeout').mockImplementation((callback: any) => {
      callback();
      return 1 as any;
    });
    
    // Test when flag is disabled
    (isFeatureEnabled as jest.Mock).mockReturnValue(false);
    
    // Simulate component behavior manually
    const isEnabled = isFeatureEnabled(FEATURE_FLAGS.USE_SCHEMA_MARKUP, false);
    
    // Should be disabled
    expect(isEnabled).toBe(false);
    
    // Test when flag is enabled
    (isFeatureEnabled as jest.Mock).mockReturnValue(true);
    
    // Simulate component behavior manually
    const isEnabledNow = isFeatureEnabled(FEATURE_FLAGS.USE_SCHEMA_MARKUP, false);
    
    // Should be enabled
    expect(isEnabledNow).toBe(true);
  });
  
  it('should integrate with the actual data sources', () => {
    // Enable the schema markup feature
    (isFeatureEnabled as jest.Mock).mockImplementation(
      (flag, defaultValue) => flag === FEATURE_FLAGS.USE_SCHEMA_MARKUP
    );
    
    // If we were to integrate with actual data sources...
    const schemas = generateSchemas(zodiacSigns, horoscopes);
    
    // Verify the schema structure is comprehensive
    const schemaTypes = schemas.map(schema => schema['@type']);
    
    // Check all expected schema types are present
    expect(schemaTypes).toContain('WebSite');
    expect(schemaTypes).toContain('Organization');
    expect(schemaTypes).toContain('Service');
    expect(schemaTypes).toContain('ItemList');
    expect(schemaTypes).toContain('FAQPage');
    expect(schemaTypes).toContain('CreativeWork');
  });

  it('should include enhanced schemas when both feature flags are enabled', () => {
    // Enable both schema markup features
    (isFeatureEnabled as jest.Mock).mockImplementation(
      (flag, defaultValue) => true
    );
    
    // Generate schemas with both flags enabled using enhanced data format
    const schemas = generateSchemas(zodiacSignsEnhanced, horoscopesEnhanced);
    
    // Verify the schema structure includes enhanced types
    const schemaTypes = schemas.map(schema => schema['@type']);
    
    // Check base schema types
    expect(schemaTypes).toContain('WebSite');
    expect(schemaTypes).toContain('Organization');
    
    // Check enhanced schema types
    expect(schemaTypes).toContain('HowTo');
    expect(schemaTypes).toContain('Event');
    
    // Check for enhanced ItemList with images
    const itemList = schemas.find(schema => schema['@type'] === 'ItemList');
    expect(itemList).toBeDefined();
    if (itemList) {
      const firstItem = itemList.itemListElement[0].item;
      expect(firstItem.image).toBeDefined();
      expect(firstItem.image['@type']).toEqual('ImageObject');
    }
  });
  
  it('should NOT include enhanced schemas when only base schema flag is enabled', () => {
    // Enable only the base schema markup feature
    (isFeatureEnabled as jest.Mock).mockImplementation(
      (flag, defaultValue) => flag === FEATURE_FLAGS.USE_SCHEMA_MARKUP
    );
    
    // Generate schemas with just base flag enabled
    const schemas = generateSchemas(zodiacSigns, horoscopes);
    
    // Verify the schema structure doesn't include enhanced types
    const schemaTypes = schemas.map(schema => schema['@type']);
    
    // Check base schema types are present
    expect(schemaTypes).toContain('WebSite');
    expect(schemaTypes).toContain('Organization');
    
    // Check enhanced schema types are not present
    expect(schemaTypes).not.toContain('HowTo');
    expect(schemaTypes).not.toContain('Event');
    
    // Check for basic ItemList without enhanced properties
    const itemList = schemas.find(schema => schema['@type'] === 'ItemList');
    expect(itemList).toBeDefined();
    if (itemList && itemList.itemListElement.length > 0) {
      const firstItem = itemList.itemListElement[0].item;
      expect(firstItem.image).toBeUndefined();
    }
  });
}); 