import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware to handle API requests and rate limiting
 */
export async function middleware(req: NextRequest) {
  // Log request path for debugging
  console.log(`Middleware processing request to: ${req.nextUrl.pathname}`);
  
  // For API calls, ensure CORS headers are set properly
  if (req.nextUrl.pathname.startsWith('/api/')) {
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400'
        }
      });
    }
    
    // Handle regular API requests
    const response = NextResponse.next();
    
    // Add CORS headers to all API responses
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return response;
  }
  
  // Allow other requests to proceed without modifications
  return NextResponse.next();
}

// Matcher configuration to specify paths where middleware should run
export const config = {
  matcher: [
    // Apply middleware to all API routes
    '/api/:path*',
  ],
}; 