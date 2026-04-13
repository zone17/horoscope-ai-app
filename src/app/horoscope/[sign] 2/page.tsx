import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import SignPageClient from './SignPageClient';

export const revalidate = 3600; // ISR: revalidate every hour

const VALID_SIGNS = [
  'aries', 'taurus', 'gemini', 'cancer',
  'leo', 'virgo', 'libra', 'scorpio',
  'sagittarius', 'capricorn', 'aquarius', 'pisces',
] as const;

type ValidSign = (typeof VALID_SIGNS)[number];

const SIGN_META: Record<ValidSign, { symbol: string; dateRange: string; element: string }> = {
  aries:       { symbol: '♈', dateRange: 'Mar 21 – Apr 19', element: 'Fire' },
  taurus:      { symbol: '♉', dateRange: 'Apr 20 – May 20', element: 'Earth' },
  gemini:      { symbol: '♊', dateRange: 'May 21 – Jun 20', element: 'Air' },
  cancer:      { symbol: '♋', dateRange: 'Jun 21 – Jul 22', element: 'Water' },
  leo:         { symbol: '♌', dateRange: 'Jul 23 – Aug 22', element: 'Fire' },
  virgo:       { symbol: '♍', dateRange: 'Aug 23 – Sep 22', element: 'Earth' },
  libra:       { symbol: '♎', dateRange: 'Sep 23 – Oct 22', element: 'Air' },
  scorpio:     { symbol: '♏', dateRange: 'Oct 23 – Nov 21', element: 'Water' },
  sagittarius: { symbol: '♐', dateRange: 'Nov 22 – Dec 21', element: 'Fire' },
  capricorn:   { symbol: '♑', dateRange: 'Dec 22 – Jan 19', element: 'Earth' },
  aquarius:    { symbol: '♒', dateRange: 'Jan 20 – Feb 18', element: 'Air' },
  pisces:      { symbol: '♓', dateRange: 'Feb 19 – Mar 20', element: 'Water' },
};

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function isValidSign(sign: string): sign is ValidSign {
  return (VALID_SIGNS as readonly string[]).includes(sign);
}

interface PageProps {
  params: Promise<{ sign: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { sign } = await params;
  const lower = sign.toLowerCase();

  if (!isValidSign(lower)) {
    return { title: 'Not Found' };
  }

  const { symbol, dateRange } = SIGN_META[lower];
  const title = `${capitalize(lower)} Horoscope Today ${symbol} | Get Today's Horoscope`;
  const description = `Daily horoscope for ${capitalize(lower)} (${dateRange}). Discover what the stars have in store for you today — love, career, and personal growth.`;
  const url = `https://www.gettodayshoroscope.com/horoscope/${lower}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: "Get Today's Horoscope",
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
    alternates: {
      canonical: url,
    },
  };
}

export function generateStaticParams() {
  return VALID_SIGNS.map((sign) => ({ sign }));
}

export default async function SignPage({ params }: PageProps) {
  const { sign } = await params;
  const lower = sign.toLowerCase();

  if (!isValidSign(lower)) {
    notFound();
  }

  const meta = SIGN_META[lower];

  return (
    <main className="min-h-screen">
      <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-indigo-300/70 hover:text-indigo-200 text-sm font-light mb-8 transition-colors"
        >
          ← All signs
        </Link>

        {/* Sign header */}
        <div className="flex items-center gap-4 mb-8">
          <span className="text-5xl">{meta.symbol}</span>
          <div>
            <h1 className="text-3xl sm:text-4xl font-normal text-white capitalize tracking-tight">
              {capitalize(lower)}
            </h1>
            <p className="text-indigo-200/70 text-sm font-light tracking-wide mt-0.5">
              {meta.dateRange} &bull; {meta.element}
            </p>
          </div>
        </div>

        {/* Client component handles data fetching + share button */}
        <SignPageClient sign={lower} symbol={meta.symbol} />
      </div>
    </main>
  );
}
