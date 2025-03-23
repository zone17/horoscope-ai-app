/**
 * Tests for Core Web Vitals initializer component
 */
import { render } from '@testing-library/react';
import { CoreWebVitalsInitializer } from './CoreWebVitalsInitializer';
import { reportWebVitals, addResourceHints } from '@/utils/web-vitals';
import { isFeatureEnabled, FEATURE_FLAGS } from '@/utils/feature-flags';

// Mock dependencies
jest.mock('@/utils/web-vitals', () => ({
  reportWebVitals: jest.fn(),
  addResourceHints: jest.fn()
}));

jest.mock('@/utils/feature-flags', () => ({
  isFeatureEnabled: jest.fn(),
  FEATURE_FLAGS: {
    USE_CORE_WEB_VITALS_OPT: 'USE_CORE_WEB_VITALS_OPT'
  }
}));

// Mock console.log to avoid cluttering test output
const originalConsoleLog = console.log;

describe('CoreWebVitalsInitializer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
  });

  afterEach(() => {
    console.log = originalConsoleLog;
  });

  it('should not initialize core web vitals when feature flag is disabled', () => {
    // Setup
    (isFeatureEnabled as jest.Mock).mockReturnValue(false);
    
    // Act
    render(<CoreWebVitalsInitializer />);
    
    // Assert
    expect(reportWebVitals).not.toHaveBeenCalled();
    expect(addResourceHints).not.toHaveBeenCalled();
  });

  it('should initialize core web vitals when feature flag is enabled', () => {
    // Setup
    (isFeatureEnabled as jest.Mock).mockReturnValue(true);
    
    // Act
    render(<CoreWebVitalsInitializer />);
    
    // Assert
    expect(reportWebVitals).toHaveBeenCalled();
    expect(addResourceHints).toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith('Core Web Vitals reporting initialized');
  });

  it('should not render any visible elements', () => {
    // Act
    const { container } = render(<CoreWebVitalsInitializer />);
    
    // Assert
    expect(container.firstChild).toBeNull();
  });
}); 