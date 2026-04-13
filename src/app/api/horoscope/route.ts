import { NextRequest, NextResponse } from 'next/server';
import { isValidSign, VALID_SIGNS } from '@/tools/zodiac/sign-profile';
import { assignDaily } from '@/tools/philosopher/assign-daily';
import { retrieve } from '@/tools/cache/retrieve';
import { store } from '@/tools/cache/store';
import { generateReading } from '@/tools/reading/generate';

export const dynamic = 'force-dynamic';

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

    const council = philosophersParam
      ? philosophersParam.split(',').map(p => p.trim()).filter(Boolean)
      : undefined;

    if (!sign || !isValidSign(sign)) {
      return NextResponse.json(
        { success: false, error: `Invalid sign. Must be one of: ${VALID_SIGNS.join(', ')}` },
        { status: 400 },
      );
    }

    if (type !== 'daily') {
      return NextResponse.json(
        { success: false, error: 'Only type=daily is supported' },
        { status: 400 },
      );
    }

    // Determine today's date from timezone
    const date = new Date().toLocaleDateString('en-CA', { timeZone: timezone });

    // 1. Assign philosopher
    const { philosopher } = assignDaily({ sign, council, date });

    // 2. Check cache
    const cached = await retrieve({ sign, philosopher, date, council });
    if (cached) {
      return NextResponse.json({ success: true, cached: true, data: cached });
    }

    // 3. Generate reading
    const reading = await generateReading({ sign, philosopher, date });

    // 4. Store in cache (fire-and-forget is fine)
    await store({ sign, philosopher, date, council, reading });

    return NextResponse.json({ success: true, cached: false, data: reading });
  } catch (error) {
    console.error('Horoscope API error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 },
    );
  }
}
