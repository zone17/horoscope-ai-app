'use client';

import { useEffect } from 'react';
import { reportWebVitals } from '@/utils/web-vitals';
import { isFeatureEnabled, FEATURE_FLAGS } from '@/utils/feature-flags';

/**
 * WebVitalsMonitor Component
 * 
 * This component initializes Core Web Vitals tracking when mounted.
 * It doesn't render anything visible - it's a utility component.
 */
export default function WebVitalsMonitor() {
  useEffect(() => {
    // Only initialize if the feature is enabled
    if (isFeatureEnabled(FEATURE_FLAGS.USE_CORE_WEB_VITALS_OPTIMIZATIONS, false)) {
      reportWebVitals();
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Web Vitals monitoring initialized');
      }
    }
  }, []);

  // Component doesn't render anything visible
  return null;
} 