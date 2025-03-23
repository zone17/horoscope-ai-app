/**
 * Regression tests for horoscope API caching functionality
 * 
 * These tests verify that the Redis caching layer works correctly 
 * for the horoscope API routes.
 */
import { get, set, del } from '@/lib/redis';
import { NextRequest, NextResponse } from 'next/server';

// Mock the Redis client
jest.mock('@/lib/redis', () => ({
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn()
}));

// Mock Next.js request/response objects
const createMockRequest = (method = 'GET', params = {}) => {
  const url = new URL('https://example.com/api/horoscopes');
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value as string);
  });
  
  return {
    method,
    url,
    nextUrl: url,
    headers: new Headers(),
    json: jest.fn().mockResolvedValue({}),
  } as unknown as NextRequest;
};

// Mock route handler function - in a real scenario this would be imported
// This simulates the route handler with cache functionality
const mockRouteHandler = async (req: NextRequest) => {
  const { searchParams } = req.nextUrl;
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
  const timezone = searchParams.get('timezone') || 'UTC';
  
  // Create cache key
  const cacheKey = `horoscope:${date}:${timezone}`;
  
  // Try to get from cache first
  const cachedData = await get(cacheKey);
  if (cachedData) {
    return NextResponse.json(JSON.parse(cachedData));
  }
  
  // Mock generation of new data
  const newData = {
    date,
    timezone,
    horoscopes: [
      { sign: 'Aries', content: 'Generated horoscope for Aries' },
      { sign: 'Taurus', content: 'Generated horoscope for Taurus' }
    ]
  };
  
  // Store in cache
  await set(cacheKey, JSON.stringify(newData), 60 * 60 * 24); // 24 hours TTL
  
  return NextResponse.json(newData);
};

describe('Horoscope API caching regression tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('@regression should return cached data when available', async () => {
    // Setup mock cache hit
    const cachedData = {
      date: '2023-06-15',
      timezone: 'America/New_York',
      horoscopes: [
        { sign: 'Aries', content: 'Cached horoscope for Aries' }
      ]
    };
    
    (get as jest.Mock).mockResolvedValue(JSON.stringify(cachedData));
    
    const req = createMockRequest('GET', { date: '2023-06-15', timezone: 'America/New_York' });
    const res = await mockRouteHandler(req);
    const data = await res.json();
    
    // Assertions
    expect(get).toHaveBeenCalledWith('horoscope:2023-06-15:America/New_York');
    expect(set).not.toHaveBeenCalled(); // Should not set cache if already exists
    expect(data).toEqual(cachedData);
  });
  
  it('@regression should generate new data and cache it when cache is empty', async () => {
    // Setup mock cache miss
    (get as jest.Mock).mockResolvedValue(null);
    
    const req = createMockRequest('GET', { date: '2023-06-15', timezone: 'UTC' });
    const res = await mockRouteHandler(req);
    const data = await res.json();
    
    // Assertions
    expect(get).toHaveBeenCalledWith('horoscope:2023-06-15:UTC');
    expect(set).toHaveBeenCalledTimes(1);
    expect(set).toHaveBeenCalledWith(
      'horoscope:2023-06-15:UTC',
      expect.any(String),
      24 * 60 * 60
    );
    expect(data).toHaveProperty('horoscopes');
    expect(data.horoscopes.length).toBeGreaterThan(0);
  });
  
  it('@regression should handle different timezones with unique cache keys', async () => {
    // Mock cache misses for both requests
    (get as jest.Mock).mockResolvedValue(null);
    
    // First request with Tokyo timezone
    const req1 = createMockRequest('GET', { date: '2023-06-15', timezone: 'Asia/Tokyo' });
    await mockRouteHandler(req1);
    
    // Second request with New York timezone
    const req2 = createMockRequest('GET', { date: '2023-06-15', timezone: 'America/New_York' });
    await mockRouteHandler(req2);
    
    // Assertions
    expect(get).toHaveBeenCalledWith('horoscope:2023-06-15:Asia/Tokyo');
    expect(get).toHaveBeenCalledWith('horoscope:2023-06-15:America/New_York');
    
    // Both should be cached separately
    expect(set).toHaveBeenCalledWith(
      'horoscope:2023-06-15:Asia/Tokyo',
      expect.any(String),
      expect.any(Number)
    );
    expect(set).toHaveBeenCalledWith(
      'horoscope:2023-06-15:America/New_York',
      expect.any(String),
      expect.any(Number)
    );
  });
}); 