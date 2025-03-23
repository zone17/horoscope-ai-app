# Core Web Vitals Optimization

This document outlines the implementation of Core Web Vitals optimizations in the Horoscope AI application. These optimizations are designed to improve user experience metrics as defined by Google's Core Web Vitals initiative.

## Table of Contents
1. [Introduction](#introduction)
2. [Implementation Details](#implementation-details)
3. [Feature Flag](#feature-flag)
4. [Metrics Collection](#metrics-collection)
5. [Performance Optimizations](#performance-optimizations)
6. [Testing](#testing)
7. [Enabling in Production](#enabling-in-production)

## Introduction

Core Web Vitals are a set of specific factors that Google considers important in a webpage's overall user experience. The three core metrics are:

1. **Largest Contentful Paint (LCP)**: Measures loading performance. To provide a good user experience, LCP should occur within 2.5 seconds of when the page first starts loading.
2. **First Input Delay (FID)**: Measures interactivity. To provide a good user experience, pages should have a FID of 100 milliseconds or less.
3. **Cumulative Layout Shift (CLS)**: Measures visual stability. To provide a good user experience, pages should maintain a CLS of 0.1 or less.

Our implementation focuses on optimizing these metrics to improve user experience and SEO performance.

## Implementation Details

The Core Web Vitals optimization is implemented across several files:

- `src/utils/web-vitals.ts`: Core utility functions for measuring and reporting metrics
- `src/components/performance/CoreWebVitalsInitializer.tsx`: Client component that initializes reporting
- `src/app/api/analytics/vitals/route.ts`: API endpoint for collecting metrics
- `src/components/VideoBanner.tsx`: Example of an optimized component

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

## Metrics Collection

Web Vitals metrics are collected using the `web-vitals` library. The implementation:

1. Captures all major Core Web Vitals metrics (LCP, FID, CLS, FCP, TTFB)
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

```typescript
// Dynamic resource hints for critical resources
function addResourceHints() {
  const criticalResources = [
    { rel: 'preconnect', href: 'https://api.gettodayshoroscope.com' },
    // ... other critical resources
  ];
  
  // ... implementation
}
```

### 2. Layout Shift Prevention

- Fixed dimensions for media elements
- Placeholder loading states that match final content size
- Consistent sizing for UI components

Example in `VideoBanner.tsx`:

```tsx
<div 
  className="..."
  style={{
    width: dimensions.width,
    height: dimensions.height,
    maxWidth: '100%',
    aspectRatio: `${dimensions.width} / ${dimensions.height}`
  }}
>
  {/* Content */}
</div>
```

### 3. Image/Video Optimization

- Lazy loading for below-the-fold content
- Low-quality image placeholders
- Poster images for videos

## Testing

All Core Web Vitals optimizations are thoroughly tested:

1. Unit tests for utility functions
2. Component tests for optimized components
3. API endpoint tests for metrics collection

Run tests with:

```bash
npm test
```

## Enabling in Production

To enable Core Web Vitals optimizations in production:

1. Add the feature flag to your environment variables:
   ```
   FEATURE_FLAG_USE_CORE_WEB_VITALS_OPT=true
   ```

2. Deploy the application with this environment variable set

3. Monitor performance metrics through your analytics platform

4. If issues arise, disable by setting the flag to `false`

---

## Future Improvements

Potential areas for further optimization:

1. Implement server-side rendering for critical content
2. Add route-based code splitting for JavaScript bundles
3. Implement HTTP/2 server push for critical assets
4. Automate performance testing in CI/CD pipeline 