/**
 * Tests for Core Web Vitals utilities
 */
import { isFeatureEnabled, FEATURE_FLAGS } from './feature-flags';
import { reportWebVitals, addResourceHints, getFixedImageDimensions } from './web-vitals';
import * as webVitals from 'web-vitals';

// Mock dependencies
jest.mock('./feature-flags', () => ({
  isFeatureEnabled: jest.fn(),
  FEATURE_FLAGS: {
    USE_CORE_WEB_VITALS_OPT: 'USE_CORE_WEB_VITALS_OPT'
  }
}));

jest.mock('web-vitals', () => ({
  getCLS: jest.fn(),
  getFID: jest.fn(),
  getLCP: jest.fn(),
  getFCP: jest.fn(),
  getTTFB: jest.fn()
}));

// Mock global objects that may not exist in test environment
global.fetch = jest.fn();

// Fix mocking of navigator.sendBeacon
Object.defineProperty(global.navigator, 'sendBeacon', {
  value: jest.fn().mockReturnValue(true),
  configurable: true,
  writable: true
});

describe('Core Web Vitals utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Create a mock DOM for testing
    document.head.innerHTML = '';
  });

  describe('reportWebVitals', () => {
    it('should not report metrics when feature flag is disabled', () => {
      // Setup
      (isFeatureEnabled as jest.Mock).mockReturnValue(false);
      
      // Act
      reportWebVitals();
      
      // Assert
      expect(webVitals.getCLS).not.toHaveBeenCalled();
      expect(webVitals.getFID).not.toHaveBeenCalled();
      expect(webVitals.getLCP).not.toHaveBeenCalled();
      expect(webVitals.getFCP).not.toHaveBeenCalled();
      expect(webVitals.getTTFB).not.toHaveBeenCalled();
    });

    it('should report metrics when feature flag is enabled', () => {
      // Setup
      (isFeatureEnabled as jest.Mock).mockReturnValue(true);
      
      // Act
      reportWebVitals();
      
      // Assert
      expect(webVitals.getCLS).toHaveBeenCalled();
      expect(webVitals.getFID).toHaveBeenCalled();
      expect(webVitals.getLCP).toHaveBeenCalled();
      expect(webVitals.getFCP).toHaveBeenCalled();
      expect(webVitals.getTTFB).toHaveBeenCalled();
    });

    it('should use custom endpoint when provided', () => {
      // Setup
      (isFeatureEnabled as jest.Mock).mockReturnValue(true);
      const customEndpoint = '/custom/endpoint';
      
      // Mock the web-vitals functions to call their callback
      (webVitals.getCLS as jest.Mock).mockImplementation(callback => {
        callback({ name: 'CLS', value: 0.1, id: 'test-cls', delta: 0.05 });
      });
      
      // Clear previous calls
      (navigator.sendBeacon as jest.Mock).mockClear();
      
      // Act
      reportWebVitals(customEndpoint);
      
      // Assert
      expect(navigator.sendBeacon as jest.Mock).toHaveBeenCalledWith(
        customEndpoint,
        expect.any(String)
      );
    });
  });

  describe('addResourceHints', () => {
    it('should not add resource hints when feature flag is disabled', () => {
      // Setup
      (isFeatureEnabled as jest.Mock).mockReturnValue(false);
      
      // Act
      addResourceHints();
      
      // Assert
      expect(document.head.querySelectorAll('link').length).toBe(0);
    });

    it('should add resource hints when feature flag is enabled', () => {
      // Setup
      (isFeatureEnabled as jest.Mock).mockReturnValue(true);
      
      // Act
      addResourceHints();
      
      // Assert
      const links = document.head.querySelectorAll('link');
      expect(links.length).toBeGreaterThan(0);
      
      // Check if preload for font is added
      const preloadFont = Array.from(links).find(
        link => link.getAttribute('rel') === 'preload' && link.getAttribute('as') === 'font'
      );
      expect(preloadFont).toBeTruthy();
      
      // Check if preconnect is added
      const preconnect = Array.from(links).find(
        link => link.getAttribute('rel') === 'preconnect'
      );
      expect(preconnect).toBeTruthy();
    });
  });

  describe('getFixedImageDimensions', () => {
    it('should return fixed dimensions for any zodiac sign', () => {
      // Act
      const dimensions = getFixedImageDimensions('aries');
      
      // Assert
      expect(dimensions).toEqual({
        width: 400,
        height: 225
      });
    });
  });
}); 