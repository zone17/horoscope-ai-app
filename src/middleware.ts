import { NextRequest, NextResponse } from 'next/server';

/**
 * Simple placeholder middleware
 * Rate limiting is disabled for initial deployment
 */
export async function middleware(req: NextRequest) {
  // Log request path for debugging
  console.log(`Middleware processing request to: ${req.nextUrl.pathname}`);
  
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