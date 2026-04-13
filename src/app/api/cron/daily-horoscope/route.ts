import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/utils/redis';
import { sendDailyEmail, type ReadingContent } from '@/utils/email';
import { assignDaily } from '@/tools/philosopher/assign-daily';
import { generateReading, type ReadingOutput } from '@/tools/reading/generate';
import { store } from '@/tools/cache/store';
import { formatReading } from '@/tools/content/format';
import { segment } from '@/tools/audience/segment';
import { VALID_SIGNS, type ValidSign } from '@/tools/zodiac/sign-profile';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  // P0 #6: Redis health check — degrade gracefully if unavailable
  let redisHealthy = true;
  try {
    await redis.ping();
  } catch {
    console.error('Redis unavailable — generating readings without caching');
    redisHealthy = false;
  }

  const date = new Date().toISOString().split('T')[0];
  const readings = new Map<string, ReadingOutput>();
  const errors: string[] = [];

  // Phase 1: Generate readings for all 12 signs
  for (const sign of VALID_SIGNS) {
    try {
      const { philosopher } = assignDaily({ sign, date });
      const reading = await generateReading({ sign, philosopher, date });
      readings.set(sign, reading);
      if (redisHealthy) {
        await store({ sign, philosopher, date, reading });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      errors.push(`${sign}: ${msg}`);
      console.error(`[cron] Failed for ${sign}:`, msg);
    }
  }

  // Phase 2: Email subscribers per sign
  let emailed = 0;
  for (const sign of VALID_SIGNS) {
    const reading = readings.get(sign);
    if (!reading) continue;
    try {
      const { subscribers } = await segment({ sign });
      if (subscribers.length === 0) continue;

      const formatted = formatReading({ reading, platform: 'email' });
      const emailContent: ReadingContent = {
        text: formatted.text,
        quote: { text: reading.inspirationalQuote, author: reading.quoteAuthor, source: '' },
      };

      for (const sub of subscribers) {
        const result = await sendDailyEmail(
          { email: sub.email, sign: sign as ValidSign },
          emailContent,
        );
        if (result.success) emailed++;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      errors.push(`email:${sign}: ${msg}`);
      console.error(`[cron] Email failed for ${sign}:`, msg);
    }
  }

  return NextResponse.json({
    success: true,
    generated: readings.size,
    emailed,
    errors,
    date,
    redisHealthy,
  });
}
