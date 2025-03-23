/**
 * Web Vitals Utilities Tests
 */

// Mock the web-vitals library
jest.mock('web-vitals', () => ({
  onCLS: jest.fn(),
  onFID: jest.fn(),
  onLCP: jest.fn(),
  onTTFB: jest.fn(),
}));

// Mock the feature flags utility
jest.mock('../feature-flags', () => ({
  isFeatureEnabled: jest.fn(),
  FEATURE_FLAGS: {
    USE_CORE_WEB_VITALS_OPTIMIZATIONS: 'USE_CORE_WEB_VITALS_OPTIMIZATIONS',
  },
}));

import { reportWebVitals } from '../web-vitals';
import { onCLS, onFID, onLCP, onTTFB } from 'web-vitals';
import { isFeatureEnabled, FEATURE_FLAGS } from '../feature-flags';

describe('Web Vitals Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('reportWebVitals', () => {
    it('should not report metrics when feature flag is disabled', () => {
      // Setup
      (isFeatureEnabled as jest.Mock).mockReturnValue(false);
      
      // Execute
      reportWebVitals();
      
      // Verify
      expect(onCLS).not.toHaveBeenCalled();
      expect(onFID).not.toHaveBeenCalled();
      expect(onLCP).not.toHaveBeenCalled();
      expect(onTTFB).not.toHaveBeenCalled();
      expect(isFeatureEnabled).toHaveBeenCalledWith(
        FEATURE_FLAGS.USE_CORE_WEB_VITALS_OPTIMIZATIONS,
        false
      );
    });

    it('should report metrics when feature flag is enabled', () => {
      // Setup
      (isFeatureEnabled as jest.Mock).mockReturnValue(true);
      const mockReportHandler = jest.fn();
      
      // Execute
      reportWebVitals(mockReportHandler);
      
      // Verify
      expect(onCLS).toHaveBeenCalledWith(mockReportHandler);
      expect(onFID).toHaveBeenCalledWith(mockReportHandler);
      expect(onLCP).toHaveBeenCalledWith(mockReportHandler);
      expect(onTTFB).toHaveBeenCalledWith(mockReportHandler);
      expect(isFeatureEnabled).toHaveBeenCalledWith(
        FEATURE_FLAGS.USE_CORE_WEB_VITALS_OPTIMIZATIONS,
        false
      );
    });

    it('should use default report handler when none provided', () => {
      // Setup
      (isFeatureEnabled as jest.Mock).mockReturnValue(true);
      
      // Execute
      reportWebVitals();
      
      // Verify
      expect(onCLS).toHaveBeenCalled();
      expect(onFID).toHaveBeenCalled();
      expect(onLCP).toHaveBeenCalled();
      expect(onTTFB).toHaveBeenCalled();
    });
  });
}); 