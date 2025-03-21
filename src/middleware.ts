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
    // Get origin with proper handling for variations
    const origin = req.headers.get('origin') || '';
    console.log(`Request origin: ${origin}`);
    
    // Define allowed origins
    const allowedOrigins = [
      'https://www.gettodayshoroscope.com',
      'https://gettodayshoroscope.com',
    ];
    
    // Add localhost for development
    if (process.env.NODE_ENV === 'development') {
      allowedOrigins.push('http://localhost:3000');
    }
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      console.log('Middleware: Handling OPTIONS preflight request');
      
      // Use the specific origin instead of wildcard for credentials support
      const responseOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
      
      return new NextResponse(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': responseOrigin,
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cache-Control',
          'Access-Control-Max-Age': '86400',
          'Access-Control-Allow-Credentials': 'true'
        }
      });
    }
    
    // For regular API requests, apply CORS headers to the response
    const response = NextResponse.next();
    
    if (origin && allowedOrigins.includes(origin)) {
      // Apply specific origin for credentials support
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cache-Control');
      response.headers.set('Access-Control-Allow-Credentials', 'true');
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