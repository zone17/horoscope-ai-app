'use client';

import { useEffect } from 'react';
import { isFeatureEnabled, FEATURE_FLAGS } from '@/utils/feature-flags';
import Script from 'next/script';
import Head from 'next/head';

/**
 * Resources that should be preloaded for better performance
 */
const CRITICAL_RESOURCES = [
  // Preconnect to API
  { type: 'preconnect', href: process.env.NEXT_PUBLIC_API_URL || 'https://api.gettodayshoroscope.com' },
  // Preload critical CSS
  { type: 'preload', href: '/globals.css', as: 'style' },
  // Preload hero image/video
  { type: 'preload', href: '/videos/zodiac/aries.mp4', as: 'video' }
];

interface CoreWebVitalsOptimizerProps {
  children?: React.ReactNode;
}

/**
 * CoreWebVitalsOptimizer Component
 * 
 * Implements optimizations for Core Web Vitals metrics:
 * - Adds resource hints (preload, preconnect)
 * - Adds script optimizations (defer, async)
 * - Implements other performance best practices
 */
export default function CoreWebVitalsOptimizer({ children }: CoreWebVitalsOptimizerProps) {
  const isEnabled = isFeatureEnabled(FEATURE_FLAGS.USE_CORE_WEB_VITALS_OPTIMIZATIONS, false);

  // Add additional optimizations if enabled
  useEffect(() => {
    if (!isEnabled) return;

    // Add event listeners for better FID
    const onImagesLoaded = () => {
      // Run any intensive tasks after images are loaded
      setTimeout(() => {
        // Set priority for LCP elements
        const lcpElements = document.querySelectorAll('.lcp-target');
        lcpElements.forEach(element => {
          if (element instanceof HTMLElement) {
            element.style.contentVisibility = 'auto';
          }
        });
      }, 0);
    };

    window.addEventListener('load', onImagesLoaded);
    return () => window.removeEventListener('load', onImagesLoaded);
  }, [isEnabled]);

  // Don't add any optimizations if not enabled
  if (!isEnabled) {
    return <>{children}</>;
  }

  return (
    <>
      {/* Resource hints for better performance */}
      <Head>
        {CRITICAL_RESOURCES.map((resource, index) => {
          if (resource.type === 'preconnect') {
            return <link key={index} rel="preconnect" href={resource.href} crossOrigin="anonymous" />;
          } else if (resource.type === 'preload') {
            return <link key={index} rel="preload" href={resource.href} as={resource.as} />;
          }
          return null;
        })}
      </Head>

      {/* Optimized script loading */}
      <Script 
        id="web-vitals-optimization"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            // Add layout stability measures
            document.documentElement.style.scrollBehavior = 'smooth';
            
            // Helper to optimize LCP
            const markLCP = () => {
              const lcpElements = document.querySelectorAll('.lcp-target');
              if (lcpElements.length > 0) {
                lcpElements.forEach(el => {
                  if (el instanceof HTMLElement) {
                    el.style.contentVisibility = 'auto';
                  }
                });
              }
            };
            
            // Apply optimizations
            document.addEventListener('DOMContentLoaded', markLCP);
          `
        }}
      />
      
      {children}
    </>
  );
} 