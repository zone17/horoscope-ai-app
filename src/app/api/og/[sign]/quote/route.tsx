import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

const VALID_SIGNS = [
  'aries', 'taurus', 'gemini', 'cancer',
  'leo', 'virgo', 'libra', 'scorpio',
  'sagittarius', 'capricorn', 'aquarius', 'pisces',
] as const;

type ValidSign = (typeof VALID_SIGNS)[number];

const SIGN_DATA: Record<ValidSign, { symbol: string; element: string }> = {
  aries:       { symbol: '\u2648', element: 'Fire' },
  taurus:      { symbol: '\u2649', element: 'Earth' },
  gemini:      { symbol: '\u264A', element: 'Air' },
  cancer:      { symbol: '\u264B', element: 'Water' },
  leo:         { symbol: '\u264C', element: 'Fire' },
  virgo:       { symbol: '\u264D', element: 'Earth' },
  libra:       { symbol: '\u264E', element: 'Air' },
  scorpio:     { symbol: '\u264F', element: 'Water' },
  sagittarius: { symbol: '\u2650', element: 'Fire' },
  capricorn:   { symbol: '\u2651', element: 'Earth' },
  aquarius:    { symbol: '\u2652', element: 'Air' },
  pisces:      { symbol: '\u2653', element: 'Water' },
};

const ELEMENT_COLORS: Record<string, { from: string; to: string }> = {
  Fire:  { from: '#F97316', to: '#DC2626' },
  Earth: { from: '#84CC16', to: '#15803D' },
  Air:   { from: '#38BDF8', to: '#6366F1' },
  Water: { from: '#A78BFA', to: '#7C3AED' },
};

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sign: string }> }
) {
  const { sign } = await params;
  const lower = sign.toLowerCase() as ValidSign;

  if (!VALID_SIGNS.includes(lower)) {
    return new Response('Invalid sign', { status: 400 });
  }

  const { searchParams } = request.nextUrl;
  const quote = searchParams.get('q') || 'The unexamined life is not worth living.';
  const author = searchParams.get('a') || 'Socrates';
  const date =
    searchParams.get('date') ||
    new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

  const data = SIGN_DATA[lower];
  const colors = ELEMENT_COLORS[data.element];

  // Load Playfair Display font
  let fontData: ArrayBuffer | undefined;
  try {
    const fontUrl =
      'https://fonts.gstatic.com/s/playfairdisplay/v37/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKdFvXDXbtM.ttf';
    const fontRes = await fetch(fontUrl);
    if (fontRes.ok) {
      fontData = await fontRes.arrayBuffer();
    }
  } catch {
    // Fall back to system fonts if fetch fails
  }

  // Truncate long quotes to prevent overflow
  const displayQuote =
    quote.length > 200 ? quote.slice(0, 197) + '...' : quote;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: `linear-gradient(135deg, ${colors.from}33 0%, #0C0B1E 50%, ${colors.to}22 100%)`,
          fontFamily: fontData ? 'Playfair Display' : 'Georgia, serif',
          position: 'relative',
          padding: '60px 80px',
        }}
      >
        {/* Gradient accent bar at top */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '6px',
            background: `linear-gradient(90deg, ${colors.from}, ${colors.to})`,
            display: 'flex',
          }}
        />

        {/* Sign header: symbol + name + date */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            marginBottom: 40,
          }}
        >
          <span style={{ fontSize: 48, display: 'flex' }}>
            {data.symbol}
          </span>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: '#FFFFFF',
                display: 'flex',
                letterSpacing: '-0.01em',
              }}
            >
              {capitalize(lower)}
            </span>
            <span
              style={{
                fontSize: 14,
                color: 'rgba(199, 210, 254, 0.6)',
                display: 'flex',
              }}
            >
              {date}
            </span>
          </div>
        </div>

        {/* Quote text */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            maxWidth: '900px',
          }}
        >
          <span
            style={{
              fontSize: 72,
              color: colors.from,
              lineHeight: 0.5,
              display: 'flex',
              marginBottom: 8,
            }}
          >
            &ldquo;
          </span>
          <p
            style={{
              fontSize: displayQuote.length > 120 ? 26 : 32,
              fontWeight: 400,
              color: '#F0EEFF',
              textAlign: 'center',
              lineHeight: 1.5,
              margin: 0,
              display: 'flex',
            }}
          >
            {displayQuote}
          </p>
          <span
            style={{
              fontSize: 72,
              color: colors.from,
              lineHeight: 0.5,
              display: 'flex',
              marginTop: 8,
            }}
          >
            &rdquo;
          </span>
        </div>

        {/* Author attribution */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginTop: 32,
          }}
        >
          <div
            style={{
              width: 40,
              height: 1,
              background: `${colors.from}66`,
              display: 'flex',
            }}
          />
          <span
            style={{
              fontSize: 18,
              color: 'rgba(199, 210, 254, 0.7)',
              fontStyle: 'italic',
              display: 'flex',
            }}
          >
            {author}
          </span>
          <div
            style={{
              width: 40,
              height: 1,
              background: `${colors.from}66`,
              display: 'flex',
            }}
          />
        </div>

        {/* Site watermark */}
        <div
          style={{
            position: 'absolute',
            bottom: 28,
            right: 40,
            fontSize: 14,
            color: 'rgba(199, 210, 254, 0.25)',
            display: 'flex',
          }}
        >
          gettodayshoroscope.com
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      ...(fontData
        ? {
            fonts: [
              {
                name: 'Playfair Display',
                data: fontData,
                style: 'normal',
                weight: 400,
              },
            ],
          }
        : {}),
    }
  );
}
