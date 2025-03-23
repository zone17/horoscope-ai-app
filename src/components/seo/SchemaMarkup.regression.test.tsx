import { render } from '@testing-library/react';
import SchemaMarkup from './SchemaMarkup';
import { isFeatureEnabled } from '@/utils/feature-flags';
import { FEATURE_FLAGS } from '@/constants';
import { mockHoroscopes, mockZodiacSigns } from '@/mocks/data';

jest.mock('@/utils/feature-flags');

// Mock the mocks in case they don't exist yet
jest.mock('@/mocks/data', () => ({
  mockZodiacSigns: [
    { name: 'Aries', date: 'Mar 21 - Apr 19' },
    { name: 'Taurus', date: 'Apr 20 - May 20' },
    { name: 'Gemini', date: 'May 21 - Jun 20' }
  ],
  mockHoroscopes: [
    { sign: 'Aries', content: 'Test horoscope for Aries', date: '2023-06-15' },
    { sign: 'Taurus', content: 'Test horoscope for Taurus', date: '2023-06-15' },
    { sign: 'Gemini', content: 'Test horoscope for Gemini', date: '2023-06-15' }
  ]
}));

describe('SchemaMarkup regression tests', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  it('@regression should render all critical schema types when enabled', () => {
    (isFeatureEnabled as jest.Mock).mockReturnValue(true);
    
    const { container } = render(
      <SchemaMarkup 
        zodiacSigns={mockZodiacSigns} 
        horoscopes={mockHoroscopes} 
      />
    );
    
    const scripts = container.querySelectorAll('script[type="application/ld+json"]');
    
    // Verify scripts are rendered
    expect(scripts.length).toBeGreaterThan(0);
    
    // Verify all expected schema types are present
    const schemas = Array.from(scripts).map(script => 
      JSON.parse(script.innerHTML)
    );
    
    const schemaTypes = schemas.map(schema => schema['@type']);
    
    // Critical schema types that must be present
    expect(schemaTypes).toContain('WebSite');
    expect(schemaTypes).toContain('BreadcrumbList');
    
    // For WebSite schema, verify critical fields
    const websiteSchema = schemas.find(schema => schema['@type'] === 'WebSite');
    expect(websiteSchema).toBeDefined();
    expect(websiteSchema?.name).toBeTruthy();
    expect(websiteSchema?.url).toBeTruthy();
  });

  it('@regression should not render any schema when feature is disabled', () => {
    (isFeatureEnabled as jest.Mock).mockReturnValue(false);
    
    const { container } = render(
      <SchemaMarkup 
        zodiacSigns={mockZodiacSigns} 
        horoscopes={mockHoroscopes} 
      />
    );
    
    const scripts = container.querySelectorAll('script[type="application/ld+json"]');
    
    // Verify no scripts are rendered when feature is disabled
    expect(scripts.length).toBe(0);
  });
}); 