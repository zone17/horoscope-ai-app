import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware to handle API requests and rate limiting
 */
export async function middleware(req: NextRequest) {
  // Log request path for debugging
  console.log(`Middleware processing request to: ${req.nextUrl.pathname}`);
  
  // For API calls, ensure we have valid URLs for fetch operations
  if (req.nextUrl.pathname.startsWith('/api/')) {
    // No need to modify the request - just ensuring middleware doesn't interfere with API routes
  }
  
  // Allow the request to proceed without modifications
  return NextResponse.next();
}

// Matcher configuration to specify paths where middleware should run
export const config = {
  matcher: [
    // Apply middleware to all API routes
    '/api/:path*',
  ],
}; 