/**
 * HTML email template builder for daily horoscope emails.
 * Uses inline CSS only — no external stylesheets, no Tailwind, no images.
 * Designed for mobile-first rendering across Gmail, Apple Mail, Outlook.
 */

import { SIGN_META, type ValidSign } from '@/constants/zodiac';

export interface EmailTemplateData {
  sign: ValidSign;
  philosophers: string[];
  readingText: string;
  quote: {
    text: string;
    source: string;
    author: string;
  };
  date: string;
  unsubscribeUrl: string;
  shareUrl: string;
  siteUrl?: string;
}

/**
 * Builds the email subject line.
 * Format: "Your Aries reading - Apr 2, 2026"
 */
export function buildSubjectLine(sign: ValidSign, date: string): string {
  const signName = sign.charAt(0).toUpperCase() + sign.slice(1);
  return `Your ${signName} reading \u2022 ${date}`;
}

/**
 * Builds the preview text shown in email clients before opening.
 * Format: "Guided by Marcus Aurelius, Alan Watts & Lao Tzu"
 */
export function buildPreviewText(philosophers: string[]): string {
  if (philosophers.length === 0) {
    return 'Your daily philosophical horoscope';
  }
  if (philosophers.length === 1) {
    return `Guided by ${philosophers[0]}`;
  }
  if (philosophers.length === 2) {
    return `Guided by ${philosophers[0]} & ${philosophers[1]}`;
  }
  const last = philosophers[philosophers.length - 1];
  const rest = philosophers.slice(0, -1).join(', ');
  return `Guided by ${rest} & ${last}`;
}

/**
 * Builds the full HTML email template with inline CSS.
 */
export function buildEmailHtml(data: EmailTemplateData): string {
  const {
    sign,
    philosophers,
    readingText,
    quote,
    date,
    unsubscribeUrl,
    shareUrl,
    siteUrl = 'https://gettodayshoroscope.com',
  } = data;

  const meta = SIGN_META[sign];
  const signName = sign.charAt(0).toUpperCase() + sign.slice(1);
  const previewText = buildPreviewText(philosophers);
  const philosopherList = philosophers.length > 0
    ? philosophers.join(', ')
    : 'our rotating philosophers';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${buildSubjectLine(sign, date)}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#0f0f23;font-family:Georgia,'Times New Roman',serif;">
  <!-- Preview text (hidden) -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">
    ${previewText}
    ${'&zwnj;&nbsp;'.repeat(30)}
  </div>

  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#0f0f23;">
    <tr>
      <td align="center" style="padding:24px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:560px;">

          <!-- Header -->
          <tr>
            <td align="center" style="padding:32px 0 16px;">
              <span style="font-size:48px;line-height:1;">${meta.symbol}</span>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:0 0 8px;">
              <h1 style="margin:0;font-size:28px;font-weight:normal;color:#e0d4ff;letter-spacing:0.5px;">
                ${signName}
              </h1>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:0 0 24px;">
              <p style="margin:0;font-size:14px;color:#9b8ec4;font-style:italic;">
                Guided by ${philosopherList}
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 0 24px;">
              <hr style="border:none;border-top:1px solid #2a2a4a;margin:0;">
            </td>
          </tr>

          <!-- Reading -->
          <tr>
            <td style="padding:0 0 32px;">
              <p style="margin:0;font-size:17px;line-height:1.7;color:#d4d0e8;">
                ${readingText}
              </p>
            </td>
          </tr>

          <!-- Quote -->
          <tr>
            <td style="padding:0 0 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="border-left:3px solid #7c6aef;padding:16px 20px;background-color:#1a1a35;border-radius:0 8px 8px 0;">
                    <p style="margin:0 0 8px;font-size:16px;line-height:1.6;color:#c8c0e8;font-style:italic;">
                      &ldquo;${quote.text}&rdquo;
                    </p>
                    <p style="margin:0;font-size:13px;color:#8a7eb8;">
                      &mdash; ${quote.author}, <em>${quote.source}</em>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Share CTA -->
          <tr>
            <td align="center" style="padding:0 0 32px;">
              <a href="${shareUrl}" style="display:inline-block;padding:12px 32px;background-color:#7c6aef;color:#ffffff;text-decoration:none;font-size:15px;font-family:Arial,Helvetica,sans-serif;border-radius:6px;font-weight:bold;">
                Share Your Reading
              </a>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 0 24px;">
              <hr style="border:none;border-top:1px solid #2a2a4a;margin:0;">
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:0 0 8px;">
              <p style="margin:0;font-size:13px;color:#6b6390;">
                ${date} &bull; ${meta.dateRange}
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:0 0 8px;">
              <a href="${siteUrl}" style="font-size:13px;color:#7c6aef;text-decoration:none;">
                gettodayshoroscope.com
              </a>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:16px 0 0;">
              <a href="${unsubscribeUrl}" style="font-size:12px;color:#4a4570;text-decoration:underline;">
                Unsubscribe
              </a>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
