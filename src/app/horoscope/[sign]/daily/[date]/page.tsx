import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import EmailCapture from '@/components/zodiac/EmailCapture';
import ShareButton from '@/components/home/ShareButton';
import { VALID_SIGNS, SIGN_META, isValidSign } from '@/constants/zodiac';
import { AUTHOR } from '@/constants/author';
import { capitalize } from '@/lib/utils';
import { ConstellationIcon, USE_CONSTELLATION_ICONS } from '@/components/icons/ConstellationIcon';
// Redis imports are dynamic (below) to avoid client initialization at build time
// — the frontend Vercel project doesn't have Redis env vars
import { getArchiveDateRange, isValidArchiveDate, formatArchiveDate } from '@/utils/daily-archive';
import { HoroscopeData } from '@/utils/horoscope-generator';

export const revalidate = 86400; // ISR: 24h

interface PageProps {
  params: Promise<{ sign: string; date: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { sign, date } = await params;
  const lower = sign.toLowerCase();

  if (!isValidSign(lower) || !isValidArchiveDate(date)) {
    return { title: 'Not Found' };
  }

  const capitalizedSign = capitalize(lower);
  const humanDate = formatArchiveDate(date);
  const title = `${capitalizedSign} Horoscope for ${humanDate} — Daily Philosophical Guidance`;
  const description = `${capitalizedSign} horoscope for ${humanDate}. Philosophical daily guidance for ${capitalizedSign} (${SIGN_META[lower].dateRange}).`;
  const url = `https://www.gettodayshoroscope.com/horoscope/${lower}/daily/${date}`;
  const ogImage = `https://www.gettodayshoroscope.com/api/og/${lower}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: "Get Today's Horoscope",
      type: 'article',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${capitalizedSign} horoscope ${humanDate}`,
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
  const dates = getArchiveDateRange(30);
  const paths: { sign: string; date: string }[] = [];
  for (const sign of VALID_SIGNS) {
    for (const date of dates) {
      paths.push({ sign, date });
    }
  }
  return paths;
}

export default async function DailyArchivePage({ params }: PageProps) {
  const { sign, date } = await params;
  const lower = sign.toLowerCase();

  if (!isValidSign(lower) || !isValidArchiveDate(date)) {
    notFound();
  }

  const meta = SIGN_META[lower];
  const capitalizedSign = capitalize(lower);
  const humanDate = formatArchiveDate(date);
  const baseUrl = 'https://www.gettodayshoroscope.com';
  const pageUrl = `${baseUrl}/horoscope/${lower}/daily/${date}`;

  // Dynamic import defers Redis client initialization to runtime
  let horoscope: HoroscopeData | null = null;
  try {
    const { horoscopeKeys } = await import('@/utils/cache-keys');
    const { safelyRetrieveForUI } = await import('@/utils/redis-helpers');
    const cacheKey = horoscopeKeys.daily(lower, date);
    horoscope = await safelyRetrieveForUI<HoroscopeData>(cacheKey);
  } catch {
    // Redis unavailable at build time — treat as cache miss
  }

  if (!horoscope) {
    notFound();
  }

  // JSON-LD schemas
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${capitalizedSign} Horoscope for ${humanDate}`,
    description: `Philosophical daily guidance for ${capitalizedSign} on ${humanDate}.`,
    url: pageUrl,
    datePublished: date,
    dateModified: date,
    author: {
      '@type': 'Person',
      name: AUTHOR.name,
      url: AUTHOR.url,
    },
    publisher: {
      '@type': 'Organization',
      name: "Get Today's Horoscope",
      url: baseUrl,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': pageUrl,
    },
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: baseUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: capitalizedSign,
        item: `${baseUrl}/horoscope/${lower}`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: 'Daily Archive',
        item: `${baseUrl}/horoscope/${lower}/daily/${date}`,
      },
      {
        '@type': 'ListItem',
        position: 4,
        name: humanDate,
        item: pageUrl,
      },
    ],
  };

  return (
    <main className="min-h-screen">
      {/* JSON-LD schemas */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumb nav */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-indigo-300/50 font-light mb-8 flex-wrap">
          <Link href="/" className="hover:text-indigo-200 transition-colors">Home</Link>
          <span>/</span>
          <Link href={`/horoscope/${lower}`} className="hover:text-indigo-200 transition-colors capitalize">{capitalizedSign}</Link>
          <span>/</span>
          <span className="text-indigo-200/60">Daily</span>
          <span>/</span>
          <span className="text-indigo-200/80">{humanDate}</span>
        </nav>

        {/* Sign header */}
        <div className="flex items-center gap-4 mb-2">
          {USE_CONSTELLATION_ICONS ? (
            <ConstellationIcon sign={sign} size={48} className="text-amber-400" />
          ) : (
            <span className="text-5xl">{meta.symbol}</span>
          )}
          <div>
            <h1 className="text-3xl sm:text-4xl font-normal text-white tracking-tight">
              {capitalizedSign} Horoscope for {humanDate}
            </h1>
            <p className="text-indigo-200/70 text-sm font-light tracking-wide mt-0.5">
              {meta.dateRange} &bull; {meta.element} &bull; Daily Philosophical Guidance
            </p>
          </div>
        </div>

        {/* Main content */}
        <article className="mt-10 space-y-6">
          <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-6 sm:p-8">
            <div className="prose prose-invert prose-sm max-w-none">
              {horoscope.message.split('\n').filter(Boolean).map((paragraph, i) => (
                <p key={i} className="text-white/85 text-base font-light leading-relaxed mb-4 last:mb-0">
                  {paragraph}
                </p>
              ))}
            </div>

            {/* Quote */}
            {horoscope.inspirational_quote && (
              <blockquote className="mt-6 border-l-2 border-indigo-400/40 pl-4">
                <p className="text-indigo-200/80 text-sm font-light italic leading-relaxed">
                  &ldquo;{horoscope.inspirational_quote}&rdquo;
                </p>
                <cite className="mt-1.5 block text-indigo-300/60 text-xs font-light not-italic">
                  — {horoscope.quote_author}
                </cite>
              </blockquote>
            )}

            {/* Peaceful thought */}
            {horoscope.peaceful_thought && (
              <div className="mt-6 rounded-lg bg-indigo-900/20 border border-indigo-500/10 p-4">
                <p className="text-xs text-indigo-300/60 font-light uppercase tracking-widest mb-1.5">
                  Evening reflection
                </p>
                <p className="text-white/70 text-sm font-light leading-relaxed">
                  {horoscope.peaceful_thought}
                </p>
              </div>
            )}
          </div>

          {/* Share + Author */}
          <div className="flex items-center justify-between flex-wrap gap-3 px-1">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-400/20 flex items-center justify-center shrink-0">
                <span className="text-indigo-300/80 text-xs font-medium">
                  {AUTHOR.name.charAt(0)}
                </span>
              </div>
              <p className="text-xs text-indigo-200/50 font-light">
                Curated by{' '}
                <Link href={AUTHOR.url} className="text-indigo-300/70 hover:text-indigo-200 transition-colors">
                  {AUTHOR.name}
                </Link>
                , {AUTHOR.title}
              </p>
            </div>
            <ShareButton
              sign={lower}
              date={humanDate}
              quote={horoscope.inspirational_quote}
              quoteAuthor={horoscope.quote_author}
            />
          </div>
        </article>

        {/* Navigation links */}
        <div className="mt-10 space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={`/horoscope/${lower}`}
              className="inline-flex items-center gap-1.5 text-sm text-indigo-300/70 hover:text-indigo-200 transition-colors font-light"
            >
              &larr; Back to {capitalizedSign} daily horoscope
            </Link>
          </div>
        </div>

        {/* Email capture */}
        <EmailCapture sign={lower} />
      </div>
    </main>
  );
}
