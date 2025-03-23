import { isFeatureEnabled, FEATURE_FLAGS } from '@/utils/feature-flags';

// Mock next/script and React imports
jest.mock('next/script', () => 'script');
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useEffect: jest.fn(cb => cb())
}));

// Mock the feature flag utility
jest.mock('@/utils/feature-flags', () => ({
  isFeatureEnabled: jest.fn(),
  FEATURE_FLAGS: {
    USE_SCHEMA_MARKUP: 'USE_SCHEMA_MARKUP',
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
  });

  it('should not generate schemas when feature flag is disabled', () => {
    // Arrange
    jest.isolateModules(() => {
      // Mock feature flag as disabled
      (isFeatureEnabled as jest.Mock).mockReturnValue(false);
      
      // Act
      const SchemaMarkup = require('./SchemaMarkup').default;
      const result = SchemaMarkup({ zodiacSigns, horoscopes });
      
      // Assert
      expect(result).toBeNull();
    });
  });

  it('should generate all required schema types when feature flag is enabled', () => {
    // Arrange
    jest.isolateModules(() => {
      // Mock feature flag as enabled
      (isFeatureEnabled as jest.Mock).mockReturnValue(true);
      
      // Mock Script component to capture schema data
      let capturedSchemas: any[] = [];
      jest.doMock('next/script', () => {
        return function MockScript(props: any) {
          if (props.type === 'application/ld+json' && props.dangerouslySetInnerHTML) {
            try {
              const schema = JSON.parse(props.dangerouslySetInnerHTML.__html);
              capturedSchemas.push(schema);
            } catch (e) {
              // Ignore parsing errors
            }
          }
          return null;
        };
      });
      
      // Act
      const SchemaMarkup = require('./SchemaMarkup').default;
      SchemaMarkup({ zodiacSigns, horoscopes });
      
      // Assert
      expect(capturedSchemas.length).toBeGreaterThan(0);
      
      // Check for WebSite schema
      const websiteSchema = capturedSchemas.find(schema => 
        schema['@type'] === 'WebSite'
      );
      expect(websiteSchema).toBeDefined();
      
      // Check for Organization schema
      const organizationSchema = capturedSchemas.find(schema => 
        schema['@type'] === 'Organization'
      );
      expect(organizationSchema).toBeDefined();
      
      // Check for ItemList schema
      const itemListSchema = capturedSchemas.find(schema => 
        schema['@type'] === 'ItemList'
      );
      expect(itemListSchema).toBeDefined();
      
      // Check for FAQPage schema
      const faqSchema = capturedSchemas.find(schema => 
        schema['@type'] === 'FAQPage'
      );
      expect(faqSchema).toBeDefined();
    });
  });
}); 