import { NextRequest, NextResponse } from 'next/server';
import { isFeatureEnabled, FEATURE_FLAGS } from '@/utils/feature-flags';

// Set this endpoint to be dynamic to avoid caching
export const dynamic = 'force-dynamic';

/**
 * API endpoint for collecting Core Web Vitals metrics
 * 
 * This endpoint receives Core Web Vitals measurements from the client
 * and can store them in a database or send them to an analytics platform.
 * 
 * Only processes data if the Core Web Vitals feature flag is enabled.
 */
export async function POST(request: NextRequest) {
  // Check if feature flag is enabled
  if (!isFeatureEnabled(FEATURE_FLAGS.USE_CORE_WEB_VITALS_OPT, false)) {
    return NextResponse.json(
      { success: false, message: 'Feature disabled' },
      { status: 200 } // Return 200 even when disabled to avoid client errors
    );
  }

  try {
    // Parse the web vitals data
    const webVitalsData = await request.json();
    
    // Log to console for debugging (remove in production)
    console.log('Web Vitals:', webVitalsData);
    
    // Here you would typically send the data to your analytics platform
    // Examples: Google Analytics, custom database, etc.
    
    // For demonstration, we'll just log it and return success
    // In a real implementation, you might want to:
    // 1. Store in database
    // 2. Forward to analytics service
    // 3. Aggregate for dashboard display
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing web vitals data:', error);
    
    return NextResponse.json(
      { success: false, message: 'Error processing data' },
      { status: 500 }
    );
  }
} 