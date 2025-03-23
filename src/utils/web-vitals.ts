/**
 * Core Web Vitals utilities
 * 
 * This module provides utilities for tracking and reporting Core Web Vitals metrics
 * - LCP (Largest Contentful Paint)
 * - FID (First Input Delay)
 * - CLS (Cumulative Layout Shift)
 * - TTFB (Time To First Byte)
 */

import { onCLS, onFID, onLCP, onTTFB, Metric } from 'web-vitals';
import { isFeatureEnabled, FEATURE_FLAGS } from './feature-flags';

// Define the type for reporting function
type ReportHandler = (metric: Metric) => void;

// Create a default reporting handler
const defaultReportHandler: ReportHandler = (metric) => {
  // In production, you could send this to your analytics system
  if (process.env.NODE_ENV === 'development') {
    console.log('Web Vitals:', metric);
  }
};

/**
 * Report all the Core Web Vitals metrics
 * 
 * @param onReport - Optional custom report handler
 * @returns void
 */
export function reportWebVitals(onReport: ReportHandler = defaultReportHandler): void {
  // Check if the Core Web Vitals optimizations are enabled
  if (!isFeatureEnabled(FEATURE_FLAGS.USE_CORE_WEB_VITALS_OPTIMIZATIONS, false)) {
    return;
  }

  // Monitor and report metrics when they become available
  onCLS(onReport);
  onFID(onReport);
  onLCP(onReport);
  onTTFB(onReport);
} 