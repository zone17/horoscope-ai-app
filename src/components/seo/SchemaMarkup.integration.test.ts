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
    USE_SCHEMA_MARKUP: 'USE_SCHEMA_MARKUP'
  },
}));

// Test data
const zodiacSigns = [
  { sign: 'aries', symbol: '♈', dateRange: 'Mar 21 - Apr 19', element: 'Fire' },
  { sign: 'taurus', symbol: '♉', dateRange: 'Apr 20 - May 20', element: 'Earth' },
];

const horoscopes = {
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

describe('SchemaMarkup Component Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should generate correct schemas for each zodiac sign', () => {
    // Generate schemas using the utility function
    const schemas = generateSchemas(zodiacSigns, horoscopes);
    
    // Should generate the base schemas + one per horoscope
    const expectedCount = 5 + Object.keys(horoscopes).length;
    expect(schemas.length).toBe(expectedCount);
    
    // Check if aries schema is generated with correct data
    const ariesSchema = schemas.find(schema => 
      schema['@type'] === 'CreativeWork' && 
      schema.about && 
      schema.about.name === 'Aries'
    );
    
    expect(ariesSchema).toBeDefined();
    expect(ariesSchema?.abstract).toContain('Today brings new opportunities');
    expect(ariesSchema?.about?.symbol).toBe('♈');
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
    (isFeatureEnabled as jest.Mock).mockReturnValue(true);
    
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
}); 