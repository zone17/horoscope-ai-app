/**
 * Core Web Vitals utilities
 * 
 * This module provides functions for measuring and reporting Core Web Vitals metrics,
 * as well as optimizations to improve them.
 */
import { getCLS, getFID, getLCP, getFCP, getTTFB, Metric } from 'web-vitals';
import { isFeatureEnabled, FEATURE_FLAGS } from './feature-flags';

// Define metric names for type safety
export type WebVitalName = 'CLS' | 'FID' | 'LCP' | 'FCP' | 'TTFB';

/**
 * Reports Core Web Vitals metrics to specified analytics endpoint
 * Only sends data if the feature flag is enabled
 */
export function reportWebVitals(analyticsEndpoint?: string): void {
  if (!isFeatureEnabled(FEATURE_FLAGS.USE_CORE_WEB_VITALS_OPT, false)) {
    return;
  }

  // Default endpoint if none provided
  const endpoint = analyticsEndpoint || '/api/analytics/vitals';

  function sendToAnalytics(metric: Metric) {
    const body = JSON.stringify({
      name: metric.name,
      value: metric.value,
      id: metric.id,
      delta: metric.delta
    });

    // Use `navigator.sendBeacon()` if available, falling back to `fetch()`
    if (navigator.sendBeacon) {
      navigator.sendBeacon(endpoint, body);
    } else {
      fetch(endpoint, {
        body,
        method: 'POST',
        keepalive: true,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
  }

  // Get and report each Core Web Vital metric
  getCLS(sendToAnalytics);
  getFID(sendToAnalytics);
  getLCP(sendToAnalytics);
  getFCP(sendToAnalytics);
  getTTFB(sendToAnalytics);
}

/**
 * Adds resource hints for critical resources to improve LCP
 * Only applies if the feature flag is enabled
 */
export function addResourceHints(): void {
  if (!isFeatureEnabled(FEATURE_FLAGS.USE_CORE_WEB_VITALS_OPT, false) || typeof document === 'undefined') {
    return;
  }

  // Critical resources to preload
  const criticalResources = [
    { rel: 'preload', as: 'font', href: '/fonts/font-file.woff2', crossOrigin: 'anonymous' },
    { rel: 'preconnect', href: 'https://api.gettodayshoroscope.com' },
    // Add more critical resources as needed
  ];

  // Create and add link elements for resource hints
  criticalResources.forEach(resource => {
    const link = document.createElement('link');
    Object.entries(resource).forEach(([attr, value]) => {
      if (value) link.setAttribute(attr, value);
    });
    document.head.appendChild(link);
  });
}

/**
 * Helper function to get fixed size for images to prevent CLS
 * @param sign Zodiac sign name
 * @returns Object with fixed dimensions
 */
export function getFixedImageDimensions(sign: string): { width: number; height: number } {
  // Provide fixed dimensions for each zodiac sign video/image
  // This helps prevent CLS by ensuring space is reserved
  return {
    width: 400,
    height: 225
  };
} 