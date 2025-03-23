'use client';

import { useEffect } from 'react';
import { reportWebVitals, addResourceHints } from '@/utils/web-vitals';
import { isFeatureEnabled, FEATURE_FLAGS } from '@/utils/feature-flags';

/**
 * Component that initializes Core Web Vitals reporting and performance optimizations
 * 
 * This is a client component that sets up the web-vitals library to report metrics
 * and applies performance optimizations like resource hints if enabled by feature flag.
 */
export function CoreWebVitalsInitializer() {
  useEffect(() => {
    // Check if the feature flag is enabled
    const isEnabled = typeof window !== 'undefined' && 
      isFeatureEnabled(FEATURE_FLAGS.USE_CORE_WEB_VITALS_OPT, false);
    
    if (!isEnabled) return;
    
    // Initialize Core Web Vitals reporting
    reportWebVitals();
    
    // Add dynamic resource hints to improve performance
    addResourceHints();
    
    // Log that CWV is initialized (for debugging, remove in production)
    console.log('Core Web Vitals reporting initialized');
  }, []);
  
  // This component doesn't render anything
  return null;
} 