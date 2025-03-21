/**
 * CORS Service Utility
 * Provides centralized management of CORS headers for consistent cross-origin behavior
 */

import { NextResponse, NextRequest } from 'next/server';

/**
 * Origin validation - allows for multiple origins in different environments
 */
export function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  
  const allowedOrigins = [
    'https://www.gettodayshoroscope.com',
    'https://gettodayshoroscope.com',
    // Add localhost for development if needed
    ...(process.env.NODE_ENV === 'development' 
      ? ['http://localhost:3000'] 
      : [])
  ];
  
  return allowedOrigins.includes(origin);
}

/**
 * Apply CORS headers to a NextResponse
 * @param response The response to modify
 * @param origin The requesting origin, if known
 * @returns The response with CORS headers applied
 */
export function applyCorsHeaders(
  response: NextResponse, 
  origin: string = 'https://www.gettodayshoroscope.com'
): NextResponse {
  // Set CORS headers
  response.headers.set('Access-Control-Allow-Origin', origin);
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cache-Control');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Max-Age', '86400'); // 24 hours
  
  return response;
}

/**
 * Handle OPTIONS preflight requests
 * @param req The incoming request
 * @returns A properly formatted preflight response
 */
export function handlePreflight(req: NextRequest): NextResponse {
  // Get the requesting origin
  const origin = req.headers.get('origin');
  const requestedMethod = req.headers.get('access-control-request-method');
  const requestedHeaders = req.headers.get('access-control-request-headers');
  
  // Create a basic response
  const response = new NextResponse(null, { status: 204 }); // No content
  
  // Apply the CORS headers
  if (origin && isAllowedOrigin(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    
    // Echo requested method and headers if present
    if (requestedMethod) {
      response.headers.set('Access-Control-Allow-Methods', requestedMethod);
    } else {
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    }
    
    if (requestedHeaders) {
      response.headers.set('Access-Control-Allow-Headers', requestedHeaders);
    } else {
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cache-Control');
    }
    
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Max-Age', '86400'); // 24 hours
  }
  
  return response;
}

/**
 * Comprehensive CORS handler that can be used in middleware or directly in API routes
 * @param req The incoming request
 * @param responsePromise A promise that resolves to the next response (from route handler or next middleware)
 * @returns The final response with CORS headers applied
 */
export async function corsHandler(
  req: NextRequest,
  responsePromise: Promise<NextResponse> | (() => Promise<NextResponse>)
): Promise<NextResponse> {
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return handlePreflight(req);
  }
  
  // Get the requesting origin
  const origin = req.headers.get('origin');
  
  // Process the actual request
  try {
    // Resolve the response
    const response = typeof responsePromise === 'function'
      ? await responsePromise()
      : await responsePromise;
    
    // Apply CORS headers for allowed origins
    if (origin && isAllowedOrigin(origin)) {
      return applyCorsHeaders(response, origin);
    }
    
    return response;
  } catch (error) {
    console.error('Error in CORS handler:', error);
    
    // Create an error response
    const errorResponse = NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
    
    // Apply CORS headers even to error responses
    if (origin && isAllowedOrigin(origin)) {
      return applyCorsHeaders(errorResponse, origin);
    }
    
    return errorResponse;
  }
} 