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

  const data = SIGN_DATA[lower];
  const colors = ELEMENT_COLORS[data.element];
  const today = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

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
          background: `linear-gradient(135deg, ${colors.from}22 0%, #0C0B1E 40%, #06050E 100%)`,
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
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

        {/* Sign symbol */}
        <div
          style={{
            fontSize: 120,
            display: 'flex',
            marginBottom: 16,
          }}
        >
          {data.symbol}
        </div>

        {/* Sign name */}
        <div
          style={{
            fontSize: 56,
            fontWeight: 600,
            color: '#FFFFFF',
            display: 'flex',
            marginBottom: 8,
            letterSpacing: '-0.02em',
          }}
        >
          {capitalize(lower)}
        </div>

        {/* Element + Date */}
        <div
          style={{
            fontSize: 22,
            color: 'rgba(199, 210, 254, 0.7)',
            display: 'flex',
            gap: 12,
            alignItems: 'center',
            marginBottom: 32,
          }}
        >
          <span style={{ display: 'flex', color: colors.from }}>{data.element}</span>
          <span style={{ display: 'flex' }}>|</span>
          <span style={{ display: 'flex' }}>{today}</span>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 24,
            color: 'rgba(199, 210, 254, 0.5)',
            fontStyle: 'italic',
            display: 'flex',
          }}
        >
          Your daily horoscope reading
        </div>

        {/* Watermark */}
        <div
          style={{
            position: 'absolute',
            bottom: 32,
            right: 40,
            fontSize: 16,
            color: 'rgba(199, 210, 254, 0.3)',
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
    }
  );
}
