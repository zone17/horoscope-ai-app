import { NextRequest, NextResponse } from 'next/server';
import { CACHE_DURATIONS } from '@/utils/redis';
import { horoscopeKeys } from '@/utils/cache-keys';
import { safelyStoreInRedis, safelyRetrieveForUI } from '@/utils/redis-helpers';
import { generateHoroscope, VALID_SIGNS, getTodayDate } from '@/utils/horoscope-generator';
import { sendDailyEmail, type Subscriber, type ReadingContent } from '@/utils/email';
import { type ValidSign } from '@/constants/zodiac';
import { VERIFIED_QUOTES } from '@/utils/verified-quotes';

/**
 * Generate and cache horoscopes for all signs using the shared generator.
 */
async function generateAllHoroscopes() {
  const date = getTodayDate();
  const results: { sign: string; success: boolean }[] = [];
  const errors: { sign: string; error: string }[] = [];

  for (const sign of VALID_SIGNS) {
    try {
      console.log(`[cron] Generating ${sign}...`);
      const horoscope = await generateHoroscope(sign, 'daily');

      const cacheKey = horoscopeKeys.daily(sign, date);
      const storeSuccess = await safelyStoreInRedis(cacheKey, horoscope, {
        ttl: CACHE_DURATIONS.ONE_DAY
      });

      results.push({ sign, success: storeSuccess });
    } catch (error) {
      console.error(`Error generating horoscope for ${sign}:`, error);
      errors.push({ sign, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  return { results, errors };
}

/**
 * Send daily emails to all subscribers after horoscope generation.
 * Each subscriber gets a personalized email matching their sign + philosophers.
 * Errors for individual subscribers are logged but never block other sends.
 */
async function sendDailyEmails(): Promise<{ sent: number; failed: number; skipped: number }> {
  let sent = 0;
  let failed = 0;
  let skipped = 0;

  try {
    const { Redis } = await import('@upstash/redis');
    const redis = Redis.fromEnv();
    const date = getTodayDate();

    // Iterate all sign sets to find subscribers
    for (const sign of VALID_SIGNS) {
      const emails = await redis.smembers(`subscribers:${sign}`);
      if (!emails || emails.length === 0) continue;

      for (const email of emails) {
        try {
          // Fetch subscriber data (sign, philosophers)
          const subData = await redis.hgetall(`subscriber:${email}`);
          if (!subData || !subData.sign) {
            console.warn(`[cron-email] No subscriber data for ${email}, skipping`);
            skipped++;
            continue;
          }

          const subSign = (subData.sign as string).toLowerCase() as ValidSign;
          let philosophers: string[] = [];
          if (subData.philosophers) {
            try {
              philosophers = JSON.parse(subData.philosophers as string);
            } catch {
              // Invalid JSON — use empty array
            }
          }

          // Fetch the cached reading for this sign
          const cacheKey = horoscopeKeys.daily(subSign, date);
          const reading = await safelyRetrieveForUI<{
            message?: string;
            inspirational_quote?: string;
            quote_author?: string;
          }>(cacheKey);

          if (!reading || !reading.message) {
            console.warn(`[cron-email] No cached reading for ${subSign}, skipping ${email}`);
            skipped++;
            continue;
          }

          // Build reading content for the email
          const quoteAuthor = reading.quote_author || 'Unknown';
          const quoteText = reading.inspirational_quote || '';

          // Find quote source from verified bank
          let quoteSource = '';
          if (quoteAuthor && VERIFIED_QUOTES[quoteAuthor]) {
            const match = VERIFIED_QUOTES[quoteAuthor].find(
              (q) => quoteText.startsWith(q.text.substring(0, 20))
            );
            quoteSource = match?.source || '';
          }

          const readingContent: ReadingContent = {
            text: reading.message,
            quote: {
              text: quoteText,
              author: quoteAuthor,
              source: quoteSource,
            },
          };

          const subscriber: Subscriber = {
            email: email as string,
            sign: subSign,
            philosophers,
          };

          const result = await sendDailyEmail(subscriber, readingContent);
          if (result.success) {
            sent++;
          } else {
            failed++;
            console.error(`[cron-email] Failed for ${email}: ${result.error}`);
          }
        } catch (err) {
          failed++;
          console.error(`[cron-email] Error processing ${email}:`, err);
        }
      }
    }
  } catch (err) {
    console.error('[cron-email] Fatal error in sendDailyEmails:', err);
  }

  console.log(`[cron-email] Done: ${sent} sent, ${failed} failed, ${skipped} skipped`);
  return { sent, failed, skipped };
}

// CORS preflight is handled by middleware.ts for all /api/* routes
export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

/**
 * Vercel Cron handler - runs at midnight daily.
 * Requires CRON_SECRET in Authorization header for all requests.
 * The Vercel cron scheduler sends this automatically.
 */
export async function GET(request: NextRequest) {
  // Require CRON_SECRET for all requests — no origin-based bypass
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error('CRON_SECRET environment variable is not configured — denying all requests');
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${cronSecret}`) {
    console.log('Unauthorized request to generate horoscopes');
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    // Generate and cache all horoscopes
    const result = await generateAllHoroscopes();

    // Send daily emails in background after response is sent.
    // next/server `after()` keeps the function alive after response (Next.js 15+).
    // Each email send is ~200ms per subscriber, well within limits.
    try {
      const { after } = await import('next/server');
      after(async () => {
        await sendDailyEmails();
      });
    } catch {
      // Fallback if after() is not available in this runtime
      sendDailyEmails().catch((err) =>
        console.error('[cron] Background email send error:', err)
      );
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      date: getTodayDate(),
      emailsQueued: true,
      ...result
    });
  } catch (error) {
    console.error('Cron job error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'An error occurred during horoscope generation'
      },
      { status: 500 }
    );
  }
}
