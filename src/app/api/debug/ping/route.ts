import { NextRequest, NextResponse } from 'next/server';
import { applyCorsHeaders } from '@/utils/cors-service';

// Set route to be dynamic to prevent caching at edge level
export const dynamic = 'force-dynamic';

/**
 * Simple ping endpoint for debugging CORS and API availability
 */
export async function GET(request: NextRequest) {
  console.log('DEBUG: Ping endpoint called');
  
  // Get the origin for CORS
  const origin = request.headers.get('origin');
  console.log(`DEBUG: Request origin: ${origin}`);
  
  // Create a basic response with debugging info
  const response = NextResponse.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
    debug: {
      middleware: 'This response should have CORS headers applied by middleware',
      origin: origin,
      headers: Object.fromEntries(request.headers.entries())
    }
  });
  
  // Apply CORS headers directly in the endpoint as fallback
  console.log('DEBUG: Applying CORS headers directly in endpoint');
  const corsResponse = origin ? applyCorsHeaders(response, origin) : response;
  
  // Log the response headers for debugging
  console.log('DEBUG: Response headers:', Object.fromEntries(corsResponse.headers.entries()));
  
  return corsResponse;
} 