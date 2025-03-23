import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import HoroscopeDisplay from './HoroscopeDisplay';
import * as FeatureFlags from '@/utils/feature-flags';

// Mock the feature flags module
jest.mock('@/utils/feature-flags', () => ({
  isFeatureEnabled: jest.fn(),
  FEATURE_FLAGS: {
    USE_LUNAR_ZODIAC_ORDER: 'USE_LUNAR_ZODIAC_ORDER',
  },
}));

// Mock the horoscope service
jest.mock('@/utils/horoscope-service', () => ({
  getHoroscopesForAllSigns: jest.fn().mockResolvedValue({
    aries: { 
      sign: 'aries', 
      message: 'test message',
      best_match: 'leo, sagittarius',
      inspirational_quote: 'test quote',
      quote_author: 'test author'
    },
    // Add mock data for other signs as needed
  }),
}));

// Mock the videoBanner component used in ZodiacCard
jest.mock('./VideoBanner', () => ({
  __esModule: true,
  default: () => <div data-testid="mock-video-banner" />,
}));

// Mock the useMode hook
jest.mock('@/hooks/useMode', () => ({
  useMode: jest.fn().mockReturnValue({ mode: 'dark' }),
}));

describe('HoroscopeDisplay Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders with traditional zodiac order when feature flag is off', async () => {
    // Set the feature flag to false
    jest.spyOn(FeatureFlags, 'isFeatureEnabled').mockReturnValue(false);
    
    render(<HoroscopeDisplay />);
    
    // In traditional order, Capricorn should be first
    const capricornElement = await screen.findByText('Capricorn', { exact: false });
    const aquariusElement = await screen.findByText('Aquarius', { exact: false });
    
    // Check the DOM order (Capricorn should appear before Aquarius)
    expect(capricornElement.compareDocumentPosition(aquariusElement))
      .toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  test('renders with lunar zodiac order when feature flag is on', async () => {
    // Set the feature flag to true
    jest.spyOn(FeatureFlags, 'isFeatureEnabled').mockReturnValue(true);
    
    render(<HoroscopeDisplay />);
    
    // In lunar order, Aquarius should be first
    const aquariusElement = await screen.findByText('Aquarius', { exact: false });
    const capricornElement = await screen.findByText('Capricorn', { exact: false });
    
    // Check the DOM order (Aquarius should appear before Capricorn)
    expect(aquariusElement.compareDocumentPosition(capricornElement))
      .toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });
}); 