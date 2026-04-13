import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import SignPageClient from './SignPageClient';
import PushPrompt from '@/components/zodiac/PushPrompt';
import EmailCapture from '@/components/zodiac/EmailCapture';
import { VALID_SIGNS, SIGN_META, isValidSign } from '@/constants/zodiac';
import { capitalize } from '@/lib/utils';
import { ConstellationIcon, USE_CONSTELLATION_ICONS } from '@/components/icons/ConstellationIcon';

export const revalidate = 3600; // ISR: revalidate every hour

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
          {USE_CONSTELLATION_ICONS ? (
            <ConstellationIcon sign={lower} size={48} className="text-amber-400" />
          ) : (
            <span className="text-5xl">{meta.symbol}</span>
          )}
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
