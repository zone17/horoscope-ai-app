import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import SignPageClient from './SignPageClient';
import PushPrompt from '@/components/zodiac/PushPrompt';
import EmailCapture from '@/components/zodiac/EmailCapture';

export const revalidate = 3600; // ISR: revalidate every hour

const VALID_SIGNS = [
  'aries', 'taurus', 'gemini', 'cancer',
  'leo', 'virgo', 'libra', 'scorpio',
  'sagittarius', 'capricorn', 'aquarius', 'pisces',
] as const;

type ValidSign = (typeof VALID_SIGNS)[number];

const SIGN_META: Record<ValidSign, { symbol: string; dateRange: string; element: string }> = {
  aries:       { symbol: '\u2648', dateRange: 'Mar 21 \u2013 Apr 19', element: 'Fire' },
  taurus:      { symbol: '\u2649', dateRange: 'Apr 20 \u2013 May 20', element: 'Earth' },
  gemini:      { symbol: '\u264A', dateRange: 'May 21 \u2013 Jun 20', element: 'Air' },
  cancer:      { symbol: '\u264B', dateRange: 'Jun 21 \u2013 Jul 22', element: 'Water' },
  leo:         { symbol: '\u264C', dateRange: 'Jul 23 \u2013 Aug 22', element: 'Fire' },
  virgo:       { symbol: '\u264D', dateRange: 'Aug 23 \u2013 Sep 22', element: 'Earth' },
  libra:       { symbol: '\u264E', dateRange: 'Sep 23 \u2013 Oct 22', element: 'Air' },
  scorpio:     { symbol: '\u264F', dateRange: 'Oct 23 \u2013 Nov 21', element: 'Water' },
  sagittarius: { symbol: '\u2650', dateRange: 'Nov 22 \u2013 Dec 21', element: 'Fire' },
  capricorn:   { symbol: '\u2651', dateRange: 'Dec 22 \u2013 Jan 19', element: 'Earth' },
  aquarius:    { symbol: '\u2652', dateRange: 'Jan 20 \u2013 Feb 18', element: 'Air' },
  pisces:      { symbol: '\u2653', dateRange: 'Feb 19 \u2013 Mar 20', element: 'Water' },
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
  const description = `Daily horoscope for ${capitalize(lower)} (${dateRange}). Discover what the stars have in store for you today \u2014 love, career, and personal growth.`;
  const url = `https://www.gettodayshoroscope.com/horoscope/${lower}`;
  const ogImage = `https://www.gettodayshoroscope.com/api/og/${lower}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: "Get Today's Horoscope",
      type: 'website',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${capitalize(lower)} horoscope`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
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

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://www.gettodayshoroscope.com',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: capitalize(lower),
        item: `https://www.gettodayshoroscope.com/horoscope/${lower}`,
      },
    ],
  };

  return (
    <main className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-indigo-300/70 hover:text-indigo-200 text-sm font-light mb-8 transition-colors"
        >
          &larr; All signs
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

        {/* Growth: push notifications + email capture */}
        <PushPrompt sign={lower} />
        <EmailCapture sign={lower} />
      </div>
    </main>
  );
}
