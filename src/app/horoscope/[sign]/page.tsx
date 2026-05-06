import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import SignPageClient from './SignPageClient';
import PushPrompt from '@/components/zodiac/PushPrompt';
import EmailCapture from '@/components/zodiac/EmailCapture';
import { VALID_SIGNS, SIGN_META, isValidSign } from '@/constants/zodiac';
import { capitalize } from '@/lib/utils';
import { ConstellationIcon, USE_CONSTELLATION_ICONS } from '@/components/icons/ConstellationIcon';
import type { ReadingV2 } from '@/tools/reading/types';

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
  const description = `Daily horoscope for ${capitalize(lower)} (${dateRange}). Philosophy that meets you where you are: today's reading, blended from your council of thinkers.`;
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

/**
 * Server-fetch today's reading so the body lands in SSR HTML.
 * Wave 1B QA finding 2.5 caught that the reading body was hydrated
 * client-side only, leaving the SEO surface empty. ISR-cached at 1h
 * (revalidate above) so this is one network call per (sign, hour).
 * Falls back to null on error; SignPageClient re-fetches and the page
 * degrades gracefully.
 */
async function fetchInitialReading(sign: string): Promise<ReadingV2 | null> {
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.gettodayshoroscope.com';
  try {
    const resp = await fetch(`${apiBase}/api/horoscope?sign=${encodeURIComponent(sign)}`, {
      next: { revalidate: 3600 },
    });
    if (!resp.ok) return null;
    const json = (await resp.json()) as { success?: boolean; data?: ReadingV2 };
    if (!json.success || !json.data) return null;
    return json.data;
  } catch {
    return null;
  }
}

export default async function SignPage({ params }: PageProps) {
  const { sign } = await params;
  const lower = sign.toLowerCase();

  if (!isValidSign(lower)) {
    notFound();
  }

  const meta = SIGN_META[lower];
  const initialReading = await fetchInitialReading(lower);

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

  /**
   * Article schema with correct datePublished from the API response. Wave 1B
   * QA finding 2.11 caught the previous layout-level Article schema using
   * `new Date()` at render time, which drifted from the API's actual reading
   * date when ISR served a stale-but-still-fresh page. Sourcing the date
   * from the API guarantees schema and content always match.
   */
  const readingDate = initialReading?.date ?? new Date().toISOString().split('T')[0];
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${capitalize(lower)} Horoscope ${meta.symbol} - ${readingDate}`,
    description: `Daily horoscope reading for ${capitalize(lower)}.`,
    datePublished: readingDate,
    dateModified: readingDate,
    author: {
      '@type': 'Organization',
      name: "Today's Horoscope",
      url: 'https://www.gettodayshoroscope.com',
    },
    publisher: {
      '@type': 'Organization',
      name: "Today's Horoscope",
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.gettodayshoroscope.com/favicon.svg',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://www.gettodayshoroscope.com/horoscope/${lower}`,
    },
  };

  return (
    <main className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-indigo-300/70 hover:text-indigo-200 text-sm font-light mb-8 transition-colors min-h-[44px] py-2 -ml-2 px-2 rounded"
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

        {/* SignPageClient handles share button + dynamic re-fetch.
            Reading body is now SSR'd via initialReading prop so search
            engines see the content in the initial HTML response. */}
        <SignPageClient sign={lower} symbol={meta.symbol} initialReading={initialReading} />

        {/* Growth: push notifications + email capture */}
        <PushPrompt sign={lower} />
        <EmailCapture sign={lower} />
      </div>
    </main>
  );
}
