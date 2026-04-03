import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';

const VALID_SIGNS = [
  'aries', 'taurus', 'gemini', 'cancer',
  'leo', 'virgo', 'libra', 'scorpio',
  'sagittarius', 'capricorn', 'aquarius', 'pisces',
];

/**
 * Verify an HMAC-SHA256 unsubscribe token.
 */
function verifyToken(email: string, token: string): boolean {
  const secret = process.env.UNSUBSCRIBE_SECRET;
  if (!secret) {
    console.error('[unsubscribe] UNSUBSCRIBE_SECRET not configured');
    return false;
  }
  const expected = createHmac('sha256', secret).update(email).digest('hex');
  // Timing-safe comparison
  if (expected.length !== token.length) return false;
  let result = 0;
  for (let i = 0; i < expected.length; i++) {
    result |= expected.charCodeAt(i) ^ token.charCodeAt(i);
  }
  return result === 0;
}

/**
 * GET /api/unsubscribe?email=X&token=Y
 *
 * One-click unsubscribe endpoint. Verifies HMAC token then removes
 * the subscriber from Redis. Returns a simple HTML confirmation page.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  const token = searchParams.get('token');

  if (!email || !token) {
    return new NextResponse(buildHtmlPage('Missing Parameters', 'Invalid unsubscribe link.'), {
      status: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  if (!verifyToken(email, token)) {
    return new NextResponse(buildHtmlPage('Invalid Link', 'This unsubscribe link is invalid or expired.'), {
      status: 403,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  try {
    const { Redis } = await import('@upstash/redis');
    const redis = Redis.fromEnv();

    // Get subscriber sign so we can remove from the sign set
    const subscriberData = await redis.hgetall(`subscriber:${email}`);
    const sign = subscriberData?.sign as string | undefined;

    // Remove subscriber hash
    await redis.del(`subscriber:${email}`);

    // Remove from sign-specific set
    if (sign && VALID_SIGNS.includes(sign.toLowerCase())) {
      await redis.srem(`subscribers:${sign.toLowerCase()}`, email);
    }

    console.log(`[unsubscribe] Removed subscriber: ${email}`);

    return new NextResponse(
      buildHtmlPage(
        'Unsubscribed',
        'You have been successfully unsubscribed. You will no longer receive daily readings.'
      ),
      {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      }
    );
  } catch (err) {
    console.error('[unsubscribe] Redis error:', err);
    return new NextResponse(
      buildHtmlPage('Error', 'Something went wrong. Please try again later.'),
      {
        status: 500,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      }
    );
  }
}

/**
 * Build a simple HTML confirmation page for unsubscribe results.
 */
function buildHtmlPage(title: string, message: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - gettodayshoroscope.com</title>
  <style>
    body { margin: 0; padding: 40px 20px; background: #0C0B1E; color: #F0EEFF; font-family: Georgia, serif; }
    .container { max-width: 480px; margin: 0 auto; text-align: center; }
    h1 { font-size: 24px; font-weight: normal; margin-bottom: 16px; }
    p { font-size: 16px; line-height: 1.6; color: #a89cc8; }
    a { color: #7c6aef; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="container">
    <h1>${title}</h1>
    <p>${message}</p>
    <p style="margin-top: 32px;"><a href="https://gettodayshoroscope.com">Return to gettodayshoroscope.com</a></p>
  </div>
</body>
</html>`;
}
