/**
 * Resend email client for daily horoscope delivery.
 *
 * Design decisions:
 * - Errors are caught and logged, never thrown — a failed email must not crash the cron
 * - Missing RESEND_API_KEY is handled gracefully (logs warning, skips send)
 * - Designed for use with waitUntil() in the cron route (Unit 9)
 * - Unsubscribe tokens use HMAC-SHA256 for tamper-proof links
 */

import { Resend } from 'resend';
import { createHmac } from 'crypto';
import { type ValidSign } from '@/constants/zodiac';
import {
  buildSubjectLine,
  buildPreviewText,
  buildEmailHtml,
  type EmailTemplateData,
} from './email-template';

const FROM_ADDRESS = 'readings@gettodayshoroscope.com';
const SITE_URL = 'https://gettodayshoroscope.com';

/** Subscriber data as stored in Redis */
export interface Subscriber {
  email: string;
  sign: ValidSign;
  philosophers?: string[];
}

/** Result of a send attempt */
export interface SendResult {
  success: boolean;
  email: string;
  error?: string;
  messageId?: string;
}

/** Reading content to include in the email */
export interface ReadingContent {
  text: string;
  quote: {
    text: string;
    source: string;
    author: string;
  };
}

/**
 * Generate an HMAC-based unsubscribe token for a given email.
 * Uses UNSUBSCRIBE_SECRET env var. Returns empty string if secret is missing.
 */
export function generateUnsubscribeToken(email: string): string {
  const secret = process.env.UNSUBSCRIBE_SECRET;
  if (!secret) {
    console.warn('[email] UNSUBSCRIBE_SECRET not set — unsubscribe tokens will be empty');
    return '';
  }
  return createHmac('sha256', secret).update(email).digest('hex');
}

/**
 * Build a full unsubscribe URL for a subscriber.
 */
export function buildUnsubscribeUrl(email: string): string {
  const token = generateUnsubscribeToken(email);
  return `${SITE_URL}/api/unsubscribe?email=${encodeURIComponent(email)}&token=${token}`;
}

/**
 * Build a share URL for a sign's daily reading.
 */
export function buildShareUrl(sign: ValidSign): string {
  return `${SITE_URL}/horoscope/${sign}?utm_source=email&utm_medium=share`;
}

/**
 * Format today's date for display in emails.
 * Output: "Apr 2, 2026"
 */
export function formatEmailDate(date?: Date): string {
  const d = date ?? new Date();
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Create a Resend client instance.
 * Returns null if RESEND_API_KEY is not set.
 */
function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('[email] RESEND_API_KEY not set — email sends will be skipped');
    return null;
  }
  return new Resend(apiKey);
}

/**
 * Send a daily horoscope email to a single subscriber.
 *
 * - Returns a SendResult indicating success/failure
 * - Never throws — all errors are caught and logged
 * - Skips send gracefully when RESEND_API_KEY is missing
 */
export async function sendDailyEmail(
  subscriber: Subscriber,
  reading: ReadingContent,
  date?: Date,
): Promise<SendResult> {
  const { email, sign, philosophers = [] } = subscriber;

  try {
    const resend = getResendClient();
    if (!resend) {
      return {
        success: false,
        email,
        error: 'RESEND_API_KEY not configured',
      };
    }

    const dateStr = formatEmailDate(date);
    const unsubscribeUrl = buildUnsubscribeUrl(email);
    const shareUrl = buildShareUrl(sign);

    const templateData: EmailTemplateData = {
      sign,
      philosophers,
      readingText: reading.text,
      quote: reading.quote,
      date: dateStr,
      unsubscribeUrl,
      shareUrl,
    };

    const html = buildEmailHtml(templateData);
    const subject = buildSubjectLine(sign, dateStr);
    const previewText = buildPreviewText(philosophers);

    const { data, error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: email,
      subject,
      html,
      text: buildPlainText(templateData),
      headers: {
        'X-Entity-Ref-ID': `${sign}-${dateStr}`,
        'List-Unsubscribe': `<${unsubscribeUrl}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
      tags: [
        { name: 'type', value: 'daily-horoscope' },
        { name: 'sign', value: sign },
      ],
    });

    if (error) {
      console.error(`[email] Resend API error for ${email}:`, error);
      return {
        success: false,
        email,
        error: error.message,
      };
    }

    console.log(`[email] Sent daily email to ${email} (${sign}) — id: ${data?.id}`);
    return {
      success: true,
      email,
      messageId: data?.id,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[email] Failed to send to ${email}:`, message);
    return {
      success: false,
      email,
      error: message,
    };
  }
}

/**
 * Build a plain-text fallback for the email.
 */
function buildPlainText(data: EmailTemplateData): string {
  const signName = data.sign.charAt(0).toUpperCase() + data.sign.slice(1);
  const philosopherList = data.philosophers.length > 0
    ? data.philosophers.join(', ')
    : 'our rotating philosophers';

  return [
    `${signName} - ${data.date}`,
    `Guided by ${philosopherList}`,
    '',
    data.readingText,
    '',
    `"${data.quote.text}"`,
    `- ${data.quote.author}, ${data.quote.source}`,
    '',
    `Share: ${data.shareUrl}`,
    '',
    '---',
    'gettodayshoroscope.com',
    `Unsubscribe: ${data.unsubscribeUrl}`,
  ].join('\n');
}
