import { NextRequest, NextResponse } from 'next/server';
import { isAllowedOrigin } from './src/utils/cors-service';

/**
 * Middleware to handle API requests and CORS
 */
export async function middleware(request: NextRequest) {
  // Full request URL for debugging
  const url = request.url || '';
  console.log(`Middleware processing request: ${request.method} ${url}`);
  
  // Get origin with proper handling for variations
  const origin = request.headers.get('origin') || '';
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
  
  // Only apply CORS handling to API routes
  if (url.includes('/api/')) {
    console.log('Middleware: Applying CORS headers to API route');
    
    // Handle preflight OPTIONS requests
    if (request.method === 'OPTIONS') {
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
    
    // Handle regular API requests
    console.log('Middleware: Applying CORS headers to regular request');
    const response = NextResponse.next();
    
    // Add CORS headers to all API responses - using specific origin for credentials support
    const responseOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
    response.headers.set('Access-Control-Allow-Origin', responseOrigin);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cache-Control');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    
    return response;
  }
  
  // For non-API routes, just continue the request
  return NextResponse.next();
}

// Configure middleware to run on all routes
export const config = {
  matcher: '/(.*)',
}; 