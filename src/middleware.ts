import { NextRequest, NextResponse } from 'next/server';
import { redis } from './utils/redis';
import { isFeatureEnabled, FEATURE_FLAGS } from './utils/feature-flags';

// Define rate limits
const RATE_LIMITS = {
  // 20 requests per minute
  PER_IP: {
    limit: 20,
    window: 60, // seconds
  },
};

// Redis key prefix for rate limiting
const RATE_LIMIT_PREFIX = 'horoscope-prod:ratelimit';

/**
 * Apply rate limiting for API requests
 * @param req - The incoming request
 * @param path - The path being requested
 * @returns Response if rate limited, undefined otherwise
 */
async function applyRateLimit(req: NextRequest, path: string): Promise<NextResponse | undefined> {
  try {
    // Skip rate limiting if not enabled
    if (!isFeatureEnabled(FEATURE_FLAGS.USE_RATE_LIMITING, true)) {
      return undefined;
    }

    // Get client IP
    const ip = req.ip || 'anonymous';
    
    // Create a redis key for the IP and path
    const ipKey = `${RATE_LIMIT_PREFIX}:${ip}:${path}`;
    
    // Get current count for this IP
    const currentCount = await redis.get<number>(ipKey) || 0;
    
    // Check if rate limit is exceeded
    if (currentCount >= RATE_LIMITS.PER_IP.limit) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Rate limit exceeded. Please try again later.' 
        },
        { 
          status: 429,
          headers: {
            'Retry-After': RATE_LIMITS.PER_IP.window.toString(),
            'X-RateLimit-Limit': RATE_LIMITS.PER_IP.limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': (Math.floor(Date.now() / 1000) + RATE_LIMITS.PER_IP.window).toString(),
          },
        }
      );
    }
    
    // Increment the counter
    await redis.incr(ipKey);
    
    // Set expiry if this is the first request
    if (currentCount === 0) {
      await redis.expire(ipKey, RATE_LIMITS.PER_IP.window);
    }
    
    // Get the remaining requests
    const remaining = Math.max(0, RATE_LIMITS.PER_IP.limit - (currentCount + 1));
    
    // Return the modified response with rate limiting headers
    return NextResponse.next({
      headers: {
        'X-RateLimit-Limit': RATE_LIMITS.PER_IP.limit.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': (Math.floor(Date.now() / 1000) + RATE_LIMITS.PER_IP.window).toString(),
      },
    });
  } catch (error) {
    console.error('Rate limiting error:', error);
    
    // If there's an error with rate limiting, allow the request to proceed
    return undefined;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // Only apply rate limiting to API routes
  if (pathname.startsWith('/api/')) {
    try {
      // Apply rate limiting
      const rateLimitResponse = await applyRateLimit(req, pathname);
      
      // Return rate limit response if present
      if (rateLimitResponse) {
        return rateLimitResponse;
      }
    } catch (error) {
      console.error('Middleware error:', error);
    }
  }
  
  // Allow the request to proceed
  return NextResponse.next();
}

// Matcher configuration to specify paths where middleware should run
export const config = {
  matcher: [
    // Apply middleware to all API routes
    '/api/:path*',
  ],
}; 