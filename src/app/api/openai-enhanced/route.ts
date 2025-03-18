import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { withCache } from '@/utils/cache';
import { isFeatureEnabled, FEATURE_FLAGS } from '@/utils/feature-flags';
import { CACHE_DURATIONS } from '@/utils/redis';
import { CACHE_KEY_PREFIXES, generateCacheKey } from '@/utils/cache-keys';

// Set route to be publicly accessible but dynamic to avoid edge caching
export const dynamic = 'force-dynamic';
export const runtime = 'edge';

// Singleton pattern for OpenAI client as per best practices
class OpenAIService {
  private static instance: OpenAIService;
  private client: OpenAI;
  
  private constructor() {
    // Validate API key existence
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }
    
    // Initialize client with configurations
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      defaultQuery: {
        max_tokens: 500,
      },
    });
  }
  
  public static getInstance(): OpenAIService {
    if (!OpenAIService.instance) {
      OpenAIService.instance = new OpenAIService();
    }
    return OpenAIService.instance;
  }
  
  public getClient(): OpenAI {
    return this.client;
  }
}

// Get OpenAI client using singleton pattern
function getOpenAIClient(): OpenAI {
  return OpenAIService.getInstance().getClient();
}

// Implementation of exponential backoff for rate limiting
async function makeAPIRequestWithBackoff<T>(
  apiCall: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  let retries = 0;
  
  while (true) {
    try {
      return await apiCall();
    } catch (error: any) {
      // Check if this is a rate limit error (429)
      const isRateLimitError = error?.status === 429;
      
      // Check if we've hit max retries
      if (retries >= maxRetries || !isRateLimitError) {
        throw error;
      }
      
      // Exponential backoff with jitter
      const delay = Math.ceil(Math.random() * 1000 * Math.pow(2, retries));
      console.log(`Rate limited. Retrying in ${delay}ms...`);
      
      // Wait for backoff period
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Increment retry counter
      retries++;
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get query parameter for the prompt (with fallback)
    const { searchParams } = new URL(request.url);
    const prompt = searchParams.get('prompt') || 'Tell me something interesting about the universe.';
    
    // Generate a deterministic cache key based on prompt
    const cacheKey = generateCacheKey(CACHE_KEY_PREFIXES.OPENAI_TEST, { 
      prompt,
      // Include parameters that affect the output
      model: 'gpt-3.5-turbo',
      max_tokens: 500,
    });
    
    // Function to fetch from OpenAI with exponential backoff
    const fetchFromOpenAI = async () => {
      return await makeAPIRequestWithBackoff(async () => {
        const openai = getOpenAIClient();
        
        // Make the API request using the client
        const response = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 500,
          temperature: 0.7,
        });
        
        // Extract and return the result
        return {
          success: true,
          text: response.choices[0].message.content,
          model: response.model,
          created: response.created,
          usage: response.usage,
          cached: false,
          prompt,
        };
      });
    };

    // Use Redis caching if enabled
    const isCachingEnabled = isFeatureEnabled(FEATURE_FLAGS.USE_REDIS_CACHE, true);
    
    if (isCachingEnabled) {
      console.log('Using Redis cache for OpenAI response');
      
      // Fetch with caching, using appropriate TTL
      const result = await withCache(
        cacheKey,
        fetchFromOpenAI,
        { ttl: CACHE_DURATIONS.ONE_DAY }
      );
      
      // Add cache info to the response
      return NextResponse.json({ 
        ...result, 
        cached: true,
        cache_key: cacheKey,
      });
    } else {
      console.log('Bypassing cache for OpenAI response');
      
      // Fetch without caching
      const result = await fetchFromOpenAI();
      return NextResponse.json(result);
    }
  } catch (error) {
    console.error('OpenAI API error:', error);
    
    // Return appropriate error response with proper type checking
    const errorMessage = error instanceof Error ? error.message : 'An error occurred with the OpenAI API';
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage
      },
      { status: 500 }
    );
  }
} 