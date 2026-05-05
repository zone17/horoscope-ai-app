import { NextRequest, NextResponse } from 'next/server';
import { isValidSign, VALID_SIGNS } from '@/tools/zodiac/sign-profile';
import { composeReadingV2 } from '@/tools/reading/compose-v2';
import { buildCacheKeyV2 } from '@/tools/cache/keys';
import { redis, CACHE_DURATIONS } from '@/utils/redis';
import type { ReadingV2 } from '@/tools/reading/types';

export const dynamic = 'force-dynamic';

/**
 * Default council used when no `?philosophers=` param is provided. Per
 * docs/research/2026-04-29-readings-resonance.md §13.3, an anonymous browse
 * needs SOME council to drive the deep injection; a 3-philosopher composite
 * tuned for the median reader is the chosen default.
 */
const DEFAULT_COUNCIL: string[] = ['Marcus Aurelius', 'Pema Chödrön', 'Naval Ravikant'];

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sign = searchParams.get('sign')?.toLowerCase() || '';
    const type = searchParams.get('type')?.toLowerCase() || 'daily';
    const philosophersParam = searchParams.get('philosophers') || '';
    const timezone = searchParams.get('timezone') || 'UTC';

    const userCouncil = philosophersParam
      ? philosophersParam.split(',').map((p) => p.trim()).filter(Boolean)
      : [];
    const council = userCouncil.length > 0 ? userCouncil : DEFAULT_COUNCIL;

    if (!sign) {
      return NextResponse.json(
        { success: false, error: `Missing required ?sign= parameter. Provide one of: ${VALID_SIGNS.join(', ')}` },
        { status: 400 },
      );
    }
    if (!isValidSign(sign)) {
      return NextResponse.json(
        { success: false, error: `Invalid sign "${sign}". Must be one of: ${VALID_SIGNS.join(', ')}` },
        { status: 400 },
      );
    }

    if (type !== 'daily') {
      return NextResponse.json(
        { success: false, error: 'Only type=daily is supported' },
        { status: 400 },
      );
    }

    const date = new Date().toLocaleDateString('en-CA', { timeZone: timezone });

    // Cache key: same shape for default and user councils. Key is the
    // discriminator; cache value is the full ReadingV2 payload.
    const cacheKey = buildCacheKeyV2({
      sign,
      date,
      council: userCouncil.length > 0 ? userCouncil : undefined,
    });

    // Check cache. Cache value is JSON; redis client returns parsed object
    // when automaticDeserialization=false but the value was stored as JSON;
    // we explicitly parse to be safe across rotation between settings.
    try {
      const cached = await redis.get<string | ReadingV2>(cacheKey);
      if (cached) {
        const reading: ReadingV2 = typeof cached === 'string' ? JSON.parse(cached) : cached;
        return NextResponse.json({ success: true, cached: true, data: reading });
      }
    } catch {
      // Redis unavailable. Fall through to live generation.
    }

    // Live generation.
    const { reading } = await composeReadingV2({ sign, council, date });

    // Best-effort cache write.
    try {
      await redis.set(cacheKey, JSON.stringify(reading), { ex: CACHE_DURATIONS.ONE_DAY });
    } catch {
      // Non-fatal; next call regenerates.
    }

    return NextResponse.json({ success: true, cached: false, data: reading });
  } catch (error) {
    console.error('Horoscope API error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 },
    );
  }
}
