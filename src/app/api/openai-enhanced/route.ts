import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { isFeatureEnabled, FEATURE_FLAGS } from '@/utils/feature-flags';
import { CACHE_DURATIONS } from '@/utils/redis';
import { CACHE_KEY_PREFIXES } from '@/utils/cache-keys';
import { safelyStoreInRedis, safelyRetrieveForUI } from '@/utils/redis-helpers';

// Set route to be publicly accessible but dynamic to avoid edge caching
export const dynamic = 'force-dynamic';
export const runtime = 'edge';

// Namespace for Redis keys
const NAMESPACE = 'openai-cache';

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

// Create a simple cache key from the prompt
function createCacheKey(prompt: string): string {
  // Clean up prompt for cache key
  const cleanPrompt = prompt
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .substring(0, 100); // Limit key length
  
  return `${CACHE_KEY_PREFIXES.OPENAI_TEST}_${cleanPrompt}`;
}

export async function GET(request: NextRequest) {
  try {
    // Get query parameter for the prompt (with fallback)
    const { searchParams } = new URL(request.url);
    const prompt = searchParams.get('prompt') || 'Tell me something interesting about the universe.';
    
    // Create a simple cache key
    const cacheKey = createCacheKey(prompt);
    
    console.log(`Cache key: ${cacheKey}`);
    
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
        
        // Extract the result data
        const resultData = {
          success: true,
          text: response.choices[0].message.content,
          model: response.model,
          created: response.created,
          usage: response.usage,
          prompt: prompt,
        };
        
        return resultData;
      });
    };

    // Use Redis caching if enabled
    const isCachingEnabled = isFeatureEnabled(FEATURE_FLAGS.USE_REDIS_CACHE, true);
    
    if (isCachingEnabled) {
      console.log('Using Redis cache for OpenAI response');
      
      // Check if we have cached data
      const cachedResult = await safelyRetrieveForUI(cacheKey, { namespace: NAMESPACE });
      
      if (cachedResult) {
        console.log('Cache hit for OpenAI response');
        
        return NextResponse.json({ 
          ...cachedResult, 
          cached: true,
          cache_key: cacheKey,
        });
      }
      
      // If no cached data, fetch fresh data
      console.log('Cache miss for OpenAI response');
      const freshResult = await fetchFromOpenAI();
      
      // Store the result in cache - explicitly stringify to ensure proper storage
      const success = await safelyStoreInRedis(
        cacheKey,
        freshResult,
        { 
          ttl: CACHE_DURATIONS.ONE_DAY,
          namespace: NAMESPACE
        }
      );
      
      console.log(`Cache storage success: ${success}`);
      
      return NextResponse.json({ 
        ...freshResult, 
        cached: false,
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