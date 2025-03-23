/**
 * Tests for the VideoBanner component with Core Web Vitals optimizations
 */
import { render, screen } from '@testing-library/react';
import { VideoBanner } from './VideoBanner';
import { isFeatureEnabled, FEATURE_FLAGS } from '@/utils/feature-flags';
import { getFixedImageDimensions } from '@/utils/web-vitals';

// Mock dependencies
jest.mock('@/utils/feature-flags', () => ({
  isFeatureEnabled: jest.fn(),
  FEATURE_FLAGS: {
    USE_CORE_WEB_VITALS_OPT: 'USE_CORE_WEB_VITALS_OPT'
  }
}));

jest.mock('@/utils/web-vitals', () => ({
  getFixedImageDimensions: jest.fn().mockReturnValue({ width: 400, height: 225 })
}));

describe('VideoBanner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render video element with correct source', () => {
    // Setup
    (isFeatureEnabled as jest.Mock).mockReturnValue(false);
    const sign = 'aries';

    // Act
    render(<VideoBanner sign={sign} />);
    
    // Assert
    const videoElement = document.querySelector('video');
    expect(videoElement).toBeInTheDocument();
    
    const sourceElement = videoElement?.querySelector('source');
    expect(sourceElement).toBeInTheDocument();
    expect(sourceElement).toHaveAttribute('src', '/videos/zodiac/aries.mp4');
    expect(sourceElement).toHaveAttribute('type', 'video/mp4');
  });

  it('should add Core Web Vitals optimizations when feature flag is enabled', () => {
    // Setup
    (isFeatureEnabled as jest.Mock).mockReturnValue(true);
    const sign = 'aries';
    
    // Act
    render(<VideoBanner sign={sign} />);
    
    // Assert
    const videoElement = document.querySelector('video');
    expect(videoElement).toBeInTheDocument();
    expect(videoElement).toHaveAttribute('poster', '/images/placeholders/aries.jpg');
    expect(videoElement).toHaveAttribute('loading', 'lazy');
    
    // Check container has specified dimensions
    const container = videoElement?.parentElement;
    expect(container).toHaveStyle({
      width: '400px',
      height: '225px',
      maxWidth: '100%'
    });

    // Verify the fixed dimensions function was called
    expect(getFixedImageDimensions).toHaveBeenCalledWith(sign);
  });
  
  it('should show placeholder while video is loading', () => {
    // Setup
    (isFeatureEnabled as jest.Mock).mockReturnValue(true);
    
    // Act
    render(<VideoBanner sign="leo" />);
    
    // Assert
    // Check for placeholder element
    const placeholder = document.querySelector('[aria-hidden="true"]');
    expect(placeholder).toBeInTheDocument();
    expect(placeholder).toHaveStyle({
      backgroundImage: 'url("/images/placeholders/leo.jpg")'
    });
    
    // Video should initially be invisible
    const videoElement = document.querySelector('video');
    expect(videoElement).toHaveClass('opacity-0');
  });
}); 