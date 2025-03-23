/**
 * Tests for Core Web Vitals analytics API endpoint
 */
import { NextRequest } from 'next/server';
import { POST } from './route';
import { isFeatureEnabled, FEATURE_FLAGS } from '@/utils/feature-flags';

// Mock dependencies
jest.mock('@/utils/feature-flags', () => ({
  isFeatureEnabled: jest.fn(),
  FEATURE_FLAGS: {
    USE_CORE_WEB_VITALS_OPT: 'USE_CORE_WEB_VITALS_OPT'
  }
}));

// Mock console.log to avoid cluttering test output
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

describe('Core Web Vitals API endpoint', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
    console.error = jest.fn();
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  it('should return 200 with feature disabled message when feature flag is off', async () => {
    // Setup
    (isFeatureEnabled as jest.Mock).mockReturnValue(false);
    
    // Create a mock request
    const request = new NextRequest('https://example.com/api/analytics/vitals', {
      method: 'POST',
      body: JSON.stringify({ name: 'LCP', value: 2.5 })
    });
    
    // Act
    const response = await POST(request);
    const data = await response.json();
    
    // Assert
    expect(response.status).toBe(200);
    expect(data).toEqual({ success: false, message: 'Feature disabled' });
  });

  it('should process web vitals data when feature flag is on', async () => {
    // Setup
    (isFeatureEnabled as jest.Mock).mockReturnValue(true);
    
    // Create a mock request with sample web vitals data
    const webVitalsData = {
      name: 'LCP',
      value: 2.5,
      id: 'test-lcp',
      delta: 0
    };
    
    const request = new NextRequest('https://example.com/api/analytics/vitals', {
      method: 'POST',
      body: JSON.stringify(webVitalsData)
    });
    
    // Act
    const response = await POST(request);
    const data = await response.json();
    
    // Assert
    expect(response.status).toBe(200);
    expect(data).toEqual({ success: true });
    expect(console.log).toHaveBeenCalledWith('Web Vitals:', webVitalsData);
  });

  it('should handle errors properly', async () => {
    // Setup
    (isFeatureEnabled as jest.Mock).mockReturnValue(true);
    
    // Create a malformed request to trigger an error
    const request = new NextRequest('https://example.com/api/analytics/vitals', {
      method: 'POST',
      body: 'not-json' // This will cause JSON parsing to fail
    });
    
    // Act
    const response = await POST(request);
    const data = await response.json();
    
    // Assert
    expect(response.status).toBe(500);
    expect(data).toEqual({ success: false, message: 'Error processing data' });
    expect(console.error).toHaveBeenCalled();
  });
}); 