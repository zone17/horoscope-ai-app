# OpenAI API Integration: Best Practices Reference Guide

This document outlines the recommended approaches for integrating with the OpenAI API in this project, following industry best practices for performance, cost optimization, and reliability.

## Table of Contents

- [API Key Management](#api-key-management)
- [Client Initialization](#client-initialization)
- [Request Batching](#request-batching)
- [Response Caching](#response-caching)
- [Rate Limiting and Backoff Strategy](#rate-limiting-and-backoff-strategy)
- [Request Optimization and Token Management](#request-optimization-and-token-management)
- [Error Handling](#error-handling)
- [Cost Monitoring and Optimization](#cost-monitoring-and-optimization)
- [Request Context Management](#request-context-management)
- [Security Recommendations](#security-recommendations)
- [Production Deployment Checklist](#production-deployment-checklist)

## API Key Management

```typescript
// CORRECT: Store API keys in environment variables
// .env.local
OPENAI_API_KEY=your_api_key

// Access via environment variables
const apiKey = process.env.OPENAI_API_KEY;

// AVOID: Hardcoding API keys in your code
// ❌ const apiKey = "sk-..."; 

// CORRECT: Validate API key existence
if (!process.env.OPENAI_API_KEY) {
  throw new Error("Missing OpenAI API key");
}
```

## Client Initialization

```typescript
import OpenAI from 'openai';

// CORRECT: Singleton pattern for client initialization
class OpenAIService {
  private static instance: OpenAIService;
  private client: OpenAI;
  
  private constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      // Optional: Set organization if using multiple orgs
      // organization: process.env.OPENAI_ORG_ID,
      
      // Optional: Configure with defaults
      defaultQuery: {
        max_tokens: 500,
      },
      defaultHeaders: {
        "x-app-id": "my-app-id",
      }
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

// Export a function to get the client
export function getOpenAIClient(): OpenAI {
  return OpenAIService.getInstance().getClient();
}
```

## Request Batching

```typescript
// CORRECT: Batch multiple similar requests together
async function batchCompletions(prompts: string[]): Promise<string[]> {
  // Use Promise.all for parallel processing when appropriate
  const openai = getOpenAIClient();
  
  // Group similar requests with the same parameters
  const batchedPrompts = [];
  const batchSize = 20; // Adjust based on token limits
  
  for (let i = 0; i < prompts.length; i += batchSize) {
    batchedPrompts.push(prompts.slice(i, i + batchSize));
  }
  
  const allResults = [];
  
  for (const batch of batchedPrompts) {
    // Process each batch
    const batchResults = await Promise.all(
      batch.map(prompt => 
        openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: prompt }],
        })
      )
    );
    
    allResults.push(...batchResults.map(result => result.choices[0].message.content));
  }
  
  return allResults;
}
```

## Response Caching

```typescript
import { createClient } from 'redis';

// CORRECT: Implement a caching layer using Redis or similar
class OpenAICacheService {
  private redis;
  private TTL = 3600; // Cache TTL in seconds
  
  constructor() {
    this.redis = createClient({
      url: process.env.REDIS_URL
    });
    this.redis.connect();
  }
  
  async getCachedResponse(key: string): Promise<string | null> {
    return await this.redis.get(key);
  }
  
  async setCachedResponse(key: string, value: string): Promise<void> {
    await this.redis.set(key, value, { EX: this.TTL });
  }
  
  // Create a deterministic cache key from request parameters
  createCacheKey(model: string, messages: any[], options?: any): string {
    const params = JSON.stringify({
      model,
      messages,
      // Include only parameters that affect the output
      temperature: options?.temperature,
      top_p: options?.top_p,
      max_tokens: options?.max_tokens,
    });
    
    // Create a hash of the parameters for a shorter key
    return `openai:${Buffer.from(params).toString('base64')}`;
  }
}

// Usage example
async function getChatCompletionWithCache(prompt: string): Promise<string> {
  const cacheService = new OpenAICacheService();
  const openai = getOpenAIClient();
  
  const messages = [{ role: "user", content: prompt }];
  const cacheKey = cacheService.createCacheKey("gpt-3.5-turbo", messages);
  
  // Try to get from cache first
  const cachedResponse = await cacheService.getCachedResponse(cacheKey);
  if (cachedResponse) {
    return JSON.parse(cachedResponse);
  }
  
  // Make API call if not in cache
  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages,
  });
  
  const result = response.choices[0].message.content;
  
  // Cache the response
  await cacheService.setCachedResponse(cacheKey, JSON.stringify(result));
  
  return result;
}
```

## Rate Limiting and Backoff Strategy

```typescript
// CORRECT: Implement rate limiting and exponential backoff
async function makeAPIRequestWithBackoff<T>(
  apiCall: () => Promise<T>,
  maxRetries = 5
): Promise<T> {
  let retries = 0;
  
  while (true) {
    try {
      return await apiCall();
    } catch (error) {
      // Handle rate limits (429) and server errors (5xx)
      if (
        error.status === 429 || 
        (error.status >= 500 && error.status < 600)
      ) {
        if (retries >= maxRetries) {
          throw new Error(`Max retries exceeded: ${error.message}`);
        }
        
        // Calculate exponential backoff with jitter
        const delay = Math.min(
          100 * Math.pow(2, retries) + Math.random() * 100,
          10000
        );
        
        console.warn(`Rate limited. Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        retries++;
      } else {
        // For other errors, throw immediately
        throw error;
      }
    }
  }
}

// Usage example
async function generateWithBackoff(prompt: string): Promise<string> {
  const openai = getOpenAIClient();
  
  const response = await makeAPIRequestWithBackoff(() => 
    openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
    })
  );
  
  return response.choices[0].message.content;
}
```

## Request Optimization and Token Management

```typescript
// CORRECT: Optimize requests to reduce token usage
async function optimizePromptForTokens(prompt: string, maxContextTokens = 3000): Promise<string> {
  const encoding = await import('tiktoken');
  const enc = encoding.get_encoding("cl100k_base");
  
  // Count tokens
  const tokens = enc.encode(prompt);
  
  if (tokens.length <= maxContextTokens) {
    return prompt;
  }
  
  // If too many tokens, truncate or compress
  const truncatedTokens = tokens.slice(0, maxContextTokens);
  return new TextDecoder().decode(
    new Uint8Array(truncatedTokens.map(token => enc.decode([token])[0]))
  );
}

// CORRECT: Process streaming responses efficiently
async function handleStreamingResponse(prompt: string): Promise<string> {
  const openai = getOpenAIClient();
  
  const stream = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
    stream: true,
  });
  
  let fullResponse = "";
  
  for await (const chunk of stream) {
    // Process each chunk as it arrives
    const content = chunk.choices[0]?.delta?.content || "";
    fullResponse += content;
    
    // Can process each chunk in real-time here
    // For example, send to client via Server-Sent Events
  }
  
  return fullResponse;
}
```

## Error Handling

```typescript
// CORRECT: Comprehensive error handling
async function safeOpenAICall<T>(apiCall: () => Promise<T>): Promise<[T | null, Error | null]> {
  try {
    const result = await apiCall();
    return [result, null];
  } catch (error) {
    // Handle different error types
    if (error.status === 400) {
      console.error("Bad request:", error.message);
      // Handle validation errors
    } else if (error.status === 401) {
      console.error("Authentication error. Check your API key.");
      // Handle auth errors
    } else if (error.status === 403) {
      console.error("Permission denied:", error.message);
      // Handle permission issues
    } else if (error.status === 429) {
      console.error("Rate limit exceeded:", error.message);
      // Handle rate limits
    } else if (error.status >= 500) {
      console.error("OpenAI server error:", error.message);
      // Handle server errors
    } else {
      console.error("Unexpected error:", error);
      // Handle other errors
    }
    
    return [null, error];
  }
}

// Usage
async function generateSafely(prompt: string): Promise<string> {
  const openai = getOpenAIClient();
  
  const [response, error] = await safeOpenAICall(() => 
    openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
    })
  );
  
  if (error) {
    // Handle error appropriately
    return "Sorry, I couldn't generate a response at this time.";
  }
  
  return response.choices[0].message.content;
}
```

## Cost Monitoring and Optimization

```typescript
// CORRECT: Track token usage for cost monitoring
class OpenAIUsageTracker {
  private async logUsage(
    model: string, 
    promptTokens: number, 
    completionTokens: number, 
    userId?: string
  ): Promise<void> {
    // Store in database or analytics service
    await db.usageStats.create({
      data: {
        timestamp: new Date(),
        model,
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
        estimatedCost: this.calculateCost(model, promptTokens, completionTokens),
        userId,
      }
    });
  }
  
  private calculateCost(model: string, promptTokens: number, completionTokens: number): number {
    // Cost per 1000 tokens (simplified)
    const costs = {
      'gpt-4': { prompt: 0.03, completion: 0.06 },
      'gpt-3.5-turbo': { prompt: 0.0015, completion: 0.002 },
      // Add other models as needed
    };
    
    const modelCosts = costs[model] || costs['gpt-3.5-turbo'];
    
    return (
      (promptTokens / 1000) * modelCosts.prompt + 
      (completionTokens / 1000) * modelCosts.completion
    );
  }
  
  async trackCompletion(response: any, userId?: string): Promise<void> {
    if (response?.usage) {
      await this.logUsage(
        response.model,
        response.usage.prompt_tokens,
        response.usage.completion_tokens,
        userId
      );
    }
  }
}

// Usage example
async function trackedCompletion(prompt: string, userId?: string): Promise<string> {
  const openai = getOpenAIClient();
  const tracker = new OpenAIUsageTracker();
  
  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: prompt }],
  });
  
  // Track usage for monitoring and billing
  await tracker.trackCompletion(response, userId);
  
  return response.choices[0].message.content;
}
```

## Request Context Management

```typescript
// CORRECT: Manage conversation context efficiently
class ConversationManager {
  // Maximum number of messages to keep in context
  private maxMessages = 10;
  
  // Maximum tokens to use for context
  private maxContextTokens = 6000;
  
  // Keep most relevant context within token limits
  pruneConversation(messages: any[]): any[] {
    if (messages.length <= this.maxMessages) {
      return messages;
    }
    
    // Always keep the system message if present
    const systemMessages = messages.filter(m => m.role === 'system');
    
    // Keep the most recent messages within our limit
    const recentMessages = messages
      .filter(m => m.role !== 'system')
      .slice(-this.maxMessages + systemMessages.length);
    
    return [...systemMessages, ...recentMessages];
  }
}
```

## Security Recommendations

```typescript
// CORRECT: Implement input sanitization
function sanitizeUserInput(input: string): string {
  // Remove potentially malicious patterns
  return input
    .replace(/\/\/.*$/gm, '') // Remove comments
    .replace(/[\x00-\x1F\x7F-\x9F]/g, ''); // Remove control chars
}

// CORRECT: Set explicit model and parameter boundaries
function setSecureDefaults(options: any): any {
  return {
    // Default to a specific model
    model: options.model || 'gpt-3.5-turbo',
    
    // Set safe defaults
    temperature: Math.min(Math.max(options.temperature || 0.7, 0), 1),
    max_tokens: Math.min(options.max_tokens || 500, 2000),
    
    // Prevent prompt injections
    messages: options.messages.map(m => ({
      role: m.role,
      content: sanitizeUserInput(m.content),
    })),
  };
}
```

## Production Deployment Checklist

1. ✅ Use environment variables for API keys
2. ✅ Implement caching to reduce redundant calls
3. ✅ Set up proper error handling with retries
4. ✅ Add monitoring for token usage and costs
5. ✅ Implement rate limiting to prevent quota overruns
6. ✅ Use streaming responses for better UX where appropriate
7. ✅ Configure timeouts to prevent long-running requests
8. ✅ Add logging for debugging and monitoring
9. ✅ Sanitize and validate all inputs
10. ✅ Deploy API handling on the server-side only
11. ✅ Set up alerts for unusual API usage patterns
12. ✅ Use feature flags to control access to new models
13. ✅ Implement user-based quotas if serving multiple users

## Project Specific Implementation

In this project, we follow these best practices with our OpenAI integration in the following ways:

1. API key is stored in Vercel environment variables
2. Server-side implementation in `/src/app/api/horoscope/route.ts` and `/src/app/api/openai-test/route.ts`
3. Client singleton implemented in `/src/lib/openai.ts`
4. Error handling patterns used consistently throughout API routes
5. Authentication protection for API routes via Vercel deployment protection 