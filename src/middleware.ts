import { NextRequest, NextResponse } from 'next/server';
import { corsHandler, handlePreflight, isAllowedOrigin, applyCorsHeaders } from '@/utils/cors-service';

/**
 * Middleware to handle API requests and CORS
 */
export async function middleware(req: NextRequest) {
  // Log request path for debugging
  console.log(`Middleware processing request to: ${req.nextUrl.pathname}`);
  
  // Only apply CORS handling to API routes
  if (req.nextUrl.pathname.startsWith('/api/')) {
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return handlePreflight(req);
    }
    
    // For regular API requests, apply CORS headers to the response
    const response = NextResponse.next();
    const origin = req.headers.get('origin');
    
    if (origin && isAllowedOrigin(origin)) {
      return applyCorsHeaders(response, origin);
    }
    
    return response;
  }
  
  // For non-API routes, just continue the request
  return NextResponse.next();
}

// Configure middleware to only run on API routes
export const config = {
  matcher: '/api/:path*',
}; 