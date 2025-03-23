# Core Web Vitals Optimization

This document outlines the implementation of Core Web Vitals optimizations in the Horoscope AI application. These optimizations are designed to improve user experience metrics as defined by Google's Core Web Vitals initiative.

## Table of Contents
1. [Introduction](#introduction)
2. [Implementation Status](#implementation-status)
3. [Implementation Details](#implementation-details)
4. [Feature Flag](#feature-flag)
5. [Toggle Script](#toggle-script)
6. [Metrics Collection](#metrics-collection)
7. [Performance Optimizations](#performance-optimizations)
8. [Testing](#testing)
9. [Monitoring](#monitoring)

## Introduction

Core Web Vitals are a set of specific factors that Google considers important in a webpage's overall user experience. The three core metrics are:

1. **Largest Contentful Paint (LCP)**: Measures loading performance. To provide a good user experience, LCP should occur within 2.5 seconds of when the page first starts loading.
2. **Interaction to Next Paint (INP)**: Measures interactivity. To provide a good user experience, pages should have an INP of 200 milliseconds or less. (Note: INP has replaced First Input Delay (FID) as of March 2024)
3. **Cumulative Layout Shift (CLS)**: Measures visual stability. To provide a good user experience, pages should maintain a CLS of 0.1 or less.

Our implementation focuses on optimizing these metrics to improve user experience and SEO performance.

## Implementation Status

As of March 2024, the Core Web Vitals optimization feature has been fully implemented and is **enabled** in both development and production environments. The optimizations have been verified in live testing, with improved scores across all three Core Web Vitals metrics.

## Implementation Details

The Core Web Vitals optimization is implemented across several files:

- `src/utils/web-vitals.ts`: Core utility functions for measuring and reporting metrics
- `src/components/performance/CoreWebVitalsInitializer.tsx`: Client component that initializes reporting
- `src/app/api/analytics/vitals/route.ts`: API endpoint for collecting metrics
- `src/components/VideoBanner.tsx`: Example of an optimized component with CLS prevention

## Feature Flag

All Core Web Vitals optimizations are controlled by a feature flag to allow for safe rollout and easy rollback if needed:

```typescript
// Feature flag definition in src/utils/feature-flags.ts
export const FEATURE_FLAGS = {
  // ... other flags
  USE_CORE_WEB_VITALS_OPT: 'USE_CORE_WEB_VITALS_OPT',
};
```

To enable the optimizations, set the following environment variable:

```
FEATURE_FLAG_USE_CORE_WEB_VITALS_OPT=true
```

All optimizations are wrapped in conditional checks that verify this flag is enabled.

## Toggle Script

A dedicated script has been created to easily toggle the Core Web Vitals feature flag across different environments:

```bash
# Usage
./scripts/toggle-core-web-vitals.sh [on|off]

# Check current status
./scripts/toggle-core-web-vitals.sh

# Enable Core Web Vitals
./scripts/toggle-core-web-vitals.sh on

# Disable Core Web Vitals
./scripts/toggle-core-web-vitals.sh off
```

The script modifies the following files:
- `.env.development` - For local development environment
- `.env.production` - For production builds
- `vercel.frontend.json` - For Vercel deployment configuration

After toggling the feature flag, you'll need to:
1. For development: Restart the development server with `npm run dev`
2. For production: Redeploy the application with `./scripts/deploy-frontend.sh`

## Metrics Collection

Web Vitals metrics are collected using the `web-vitals` library. The implementation:

1. Captures all major Core Web Vitals metrics (LCP, INP, CLS, FCP, TTFB)
2. Sends data to an API endpoint using `navigator.sendBeacon()` when available
3. Only collects metrics when the feature flag is enabled

```typescript
// Example usage to report metrics
import { reportWebVitals } from '@/utils/web-vitals';

// In a client component
useEffect(() => {
  reportWebVitals();
}, []);
```

## Performance Optimizations

Several optimizations have been implemented to improve Core Web Vitals scores:

### 1. Resource Hints

```tsx
// In layout.tsx - Resource hints for critical domains
<>
  <link rel="preconnect" href="https://api.gettodayshoroscope.com" />
  <link rel="dns-prefetch" href="https://api.gettodayshoroscope.com" />
</>
```

### 2. Layout Shift Prevention

- Fixed dimensions for media elements
- Placeholder loading states that match final content size
- Consistent sizing for UI components

Example in `VideoBanner.tsx`:

```tsx
<div 
  className="relative w-full mb-16 px-4 py-20 flex flex-col items-center justify-center overflow-hidden rounded-2xl bg-black/80"
>
  <div className="absolute inset-0 z-0 overflow-hidden rounded-2xl">
    <video 
      className="w-full h-full object-cover opacity-40" 
      autoPlay 
      muted 
      loop 
      playsInline
    >
      <source src="/videos/zodiac/space.mp4" type="video/mp4" />
    </video>
    {/* Overlay elements */}
  </div>
  {/* Content */}
</div>
```

### 3. Image/Video Optimization

- Lazy loading for below-the-fold content
- Video optimization with proper attributes: `autoPlay`, `muted`, `loop`, `playsInline`
- Efficient loading of critical resources

### 4. JavaScript Optimization

- Minimized JavaScript execution time
- Deferred non-critical JavaScript
- Optimized event handlers

## Testing

All Core Web Vitals optimizations are thoroughly tested:

1. **Unit Tests**:
   - Test utility functions for resource hints
   - Test component rendering with and without feature flag enabled
   - Test metrics collection functions

2. **Integration Tests**:
   - Test CoreWebVitalsInitializer component
   - Test API endpoint for metrics collection
   - Test feature flag behavior

3. **Manual Verification**:
   - Run Lighthouse tests in dev tools
   - Verify using PageSpeed Insights
   - Check Google Search Console for field data

Run tests with:

```bash
npm test
```

## Monitoring

To monitor the effectiveness of Core Web Vitals optimizations:

1. **Google Search Console**: Check the Core Web Vitals report in Google Search Console for field data
2. **Analytics Endpoint**: Review data collected by the `/api/analytics/vitals` endpoint
3. **Lighthouse Testing**: Run periodic Lighthouse tests to verify lab performance

When the feature flag is enabled, all optimizations are active, and metrics collection is in place. You can verify the implementation is working by:

1. Checking the HTML source of the page for resource hints
2. Verifying the CoreWebVitalsInitializer component is being loaded
3. Running Lighthouse tests to measure performance metrics
4. Using Chrome DevTools Performance tab to analyze runtime performance

### Troubleshooting

If metrics are not improving:

1. Verify the feature flag is enabled using the toggle script
2. Check for console errors that might indicate issues with the CoreWebVitalsInitializer
3. Run a Lighthouse test and look for specific recommendations
4. Check for layout shifts using the Layout Shift Regions option in Chrome DevTools

---

## Future Improvements

Potential areas for further optimization:

1. Implement server-side rendering for critical content
2. Add route-based code splitting for JavaScript bundles
3. Implement HTTP/2 server push for critical assets
4. Automate performance testing in CI/CD pipeline 