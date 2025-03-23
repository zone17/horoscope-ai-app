/**
 * HoroscopeDisplay Integration Test
 * 
 * This test validates the integration of the SchemaMarkup component within HoroscopeDisplay
 * under realistic production-like conditions.
 */
import { render, screen, waitFor } from '@testing-library/react';
import HoroscopeDisplay from './HoroscopeDisplay';
import { isFeatureEnabled, FEATURE_FLAGS } from '@/utils/feature-flags';
import * as horoscopeService from '@/utils/horoscope-service';

// Mock the horoscope service
jest.mock('@/utils/horoscope-service', () => ({
  getHoroscopesForAllSigns: jest.fn()
}));

// Mock the feature flags
jest.mock('@/utils/feature-flags', () => ({
  isFeatureEnabled: jest.fn(),
  FEATURE_FLAGS: {
    USE_SCHEMA_MARKUP: 'USE_SCHEMA_MARKUP',
    USE_CORE_WEB_VITALS_OPTIMIZATIONS: 'USE_CORE_WEB_VITALS_OPTIMIZATIONS',
    USE_LUNAR_ZODIAC_ORDER: 'USE_LUNAR_ZODIAC_ORDER'
  },
}));

// Mock next/dynamic to use the actual SchemaMarkup component
jest.mock('next/dynamic', () => (dynamicImport: any) => {
  // Directly require the SchemaMarkup component
  const SchemaMarkup = require('@/components/seo/SchemaMarkup').default;
  return SchemaMarkup;
});

// Mock next/script to capture script tags
jest.mock('next/script', () => {
  return function MockScript(props: any) {
    // Render a div that will hold our schema data for testing
    return (
      <div 
        data-testid="schema-script"
        data-schema-type="application/ld+json"
        dangerouslySetInnerHTML={props.dangerouslySetInnerHTML}
      />
    );
  };
});

// Sample horoscope data
const mockHoroscopes = {
  horoscopes: {
    aries: {
      sign: 'aries',
      message: 'Today is a great day for new beginnings and taking initiative. Trust your instincts.',
      date: '2024-03-23'
    },
    taurus: {
      sign: 'taurus',
      message: 'Focus on stability and building solid foundations. Your persistence will pay off.',
      date: '2024-03-23'
    }
  }
};

// Mock React.useEffect to run immediately in tests
jest.mock('react', () => {
  const originalReact = jest.requireActual('react');
  return {
    ...originalReact,
    useEffect: (callback) => callback(),
  };
});

describe('HoroscopeDisplay with SchemaMarkup Integration', () => {
  // Setup before each test
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    (horoscopeService.getHoroscopesForAllSigns as jest.Mock).mockResolvedValue(mockHoroscopes);
    
    // Default: schema markup is disabled
    (isFeatureEnabled as jest.Mock).mockImplementation((flag) => {
      if (flag === FEATURE_FLAGS.USE_SCHEMA_MARKUP) return false;
      return true;
    });
  });
  
  it('should not render schema markup when feature flag is disabled', async () => {
    // Arrange - schema markup disabled (default)
    
    // Act
    render(<HoroscopeDisplay />);
    
    // Assert - wait for component to fully render
    await waitFor(() => {
      // Should not find any schema scripts
      expect(screen.queryAllByTestId('schema-script').length).toBe(0);
    });
  });
  
  it('should render schema markup when feature flag is enabled', async () => {
    // Arrange - enable schema markup
    (isFeatureEnabled as jest.Mock).mockImplementation((flag) => {
      if (flag === FEATURE_FLAGS.USE_SCHEMA_MARKUP) return true;
      return true;
    });
    
    // Act
    render(<HoroscopeDisplay />);
    
    // Assert - wait for component to fully render
    await waitFor(() => {
      // Should find schema scripts
      const schemaScripts = screen.queryAllByTestId('schema-script');
      expect(schemaScripts.length).toBeGreaterThan(0);
      
      // Check for expected schema types
      const scriptTexts = schemaScripts.map(script => script.innerHTML || '');
      const combinedText = scriptTexts.join('');
      
      // Verify key schema types are included
      expect(combinedText).toContain('"@type":"WebSite"');
      expect(combinedText).toContain('"@type":"Organization"');
      expect(combinedText).toContain('"@type":"ItemList"');
      expect(combinedText).toContain('"@type":"FAQPage"');
    });
  });
});

describe('Schema Markup Integration', () => {
  // Simplified test for schema generation based on feature flag
  beforeEach(() => {
    jest.clearAllMocks();
    (horoscopeService.getHoroscopesForAllSigns as jest.Mock).mockResolvedValue(mockHoroscopes);
  });
  
  it('should correctly generate schemas based on real horoscope data', async () => {
    // Import actual modules avoiding JSX parsing issues
    const { generateSchemas } = require('@/utils/schema-generator');
    
    // Mock that the feature flag is enabled
    (isFeatureEnabled as jest.Mock).mockReturnValue(true);
    
    // Test with the actual zodiac signs from the app
    const LUNAR_ZODIAC_SIGNS = [
      { sign: 'aquarius', symbol: '♒', dateRange: 'Jan 20 - Feb 18', element: 'Air' },
      { sign: 'pisces', symbol: '♓', dateRange: 'Feb 19 - Mar 20', element: 'Water' },
    ];
    
    // Generate schemas using the utility with real data
    const schemas = generateSchemas(LUNAR_ZODIAC_SIGNS, mockHoroscopes.horoscopes);
    
    // Verify schemas are generated with correct data
    expect(schemas.length).toBeGreaterThan(5); // Base schemas + horoscopes
    
    // Verify Website schema
    const websiteSchema = schemas.find(schema => schema['@type'] === 'WebSite');
    expect(websiteSchema).toBeDefined();
    expect(websiteSchema?.name).toBe("Today's Horoscope");
    
    // Verify schema for horoscope data
    const ariesHoroscope = schemas.find(schema => 
      schema['@type'] === 'CreativeWork' && 
      schema.about?.name === 'Aries'
    );
    
    expect(ariesHoroscope).toBeDefined();
    expect(ariesHoroscope?.abstract).toContain('Today is a great day');
  });
  
  it('should respect the feature flag setting', () => {
    // Test with flag disabled
    (isFeatureEnabled as jest.Mock).mockReturnValue(false);
    const { SchemaMarkup } = jest.requireActual('@/components/seo/SchemaMarkup');
    
    // With real data but flag disabled, no schemas should be rendered
    expect(SchemaMarkup && SchemaMarkup({
      zodiacSigns: [],
      horoscopes: {}
    })).toBeNull();
  });
}); 