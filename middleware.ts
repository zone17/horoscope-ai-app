import { NextRequest, NextResponse } from 'next/server';

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
  
  // Define allowed origins with broader matching
  const allowedOriginsPatterns = [
    'gettodayshoroscope.com',  // Matches both www and api subdomains
    'vercel.app',              // Matches preview deployments
    'localhost'                // Matches local development
  ];
  
  // Check if the origin matches any of our allowed patterns
  const isAllowedOrigin = origin && allowedOriginsPatterns.some(pattern => 
    origin.includes(pattern)
  );
  
  // Only apply CORS handling to API routes
  if (url.includes('/api/')) {
    console.log('Middleware: Applying CORS headers to API route');
    
    // Handle preflight OPTIONS requests
    if (request.method === 'OPTIONS') {
      console.log(`Middleware: Handling OPTIONS preflight request from ${origin}`);
      
      // For preflight, always return the actual origin if it's allowed
      return new NextResponse(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': isAllowedOrigin ? origin : '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cache-Control, Accept, X-Requested-With',
          'Access-Control-Max-Age': '86400',
          'Access-Control-Allow-Credentials': isAllowedOrigin ? 'true' : 'false'
        }
      });
    }
    
    // Handle regular API requests
    console.log(`Middleware: Applying CORS headers to regular request from ${origin}`);
    const response = NextResponse.next();
    
    // Add CORS headers to all API responses
    // Always return the actual origin if it's allowed
    response.headers.set('Access-Control-Allow-Origin', isAllowedOrigin ? origin : '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cache-Control');
    
    // Only set Allow-Credentials: true for allowed origins
    if (isAllowedOrigin) {
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    }
    
    return response;
  }
  
  // For non-API routes, just continue the request
  return NextResponse.next();
}

// Configure middleware to run on all routes
export const config = {
  matcher: '/(.*)',
}; 