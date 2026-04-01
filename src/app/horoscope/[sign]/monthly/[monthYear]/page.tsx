import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import EmailCapture from '@/components/zodiac/EmailCapture';
import { generateHoroscope, VALID_SIGNS } from '@/utils/horoscope-generator';
import { VALID_MONTH_SLUGS, getMonthMeta, getValidMonthSlugs, isValidMonthSlug } from '@/utils/monthly-content';
import { AUTHOR } from '@/constants/author';

export const revalidate = 86400; // ISR: revalidate daily

const SIGN_META: Record<string, { symbol: string; dateRange: string; element: string }> = {
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

interface PageProps {
  params: Promise<{ sign: string; monthYear: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { sign, monthYear } = await params;
  const lower = sign.toLowerCase();

  if (!(VALID_SIGNS as readonly string[]).includes(lower) || !isValidMonthSlug(monthYear)) {
    return { title: 'Not Found' };
  }

  const monthMeta = getMonthMeta(monthYear)!;
  const capitalizedSign = capitalize(lower);
  const title = `${capitalizedSign} Horoscope ${monthMeta.display} — Monthly Philosophical Guidance`;
  const description = `${capitalizedSign} horoscope for ${monthMeta.display}. Philosophical guidance on the month's themes, challenges, and growth opportunities for ${capitalizedSign} (${SIGN_META[lower].dateRange}).`;
  const url = `https://www.gettodayshoroscope.com/horoscope/${lower}/monthly/${monthYear}`;
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
          alt: `${capitalizedSign} horoscope ${monthMeta.display}`,
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
  const monthSlugs = getValidMonthSlugs();
  const paths: { sign: string; monthYear: string }[] = [];
  for (const sign of VALID_SIGNS) {
    for (const monthYear of monthSlugs) {
      paths.push({ sign, monthYear });
    }
  }
  return paths;
}

export default async function MonthlyHoroscopePage({ params }: PageProps) {
  const { sign, monthYear } = await params;
  const lower = sign.toLowerCase();

  if (!(VALID_SIGNS as readonly string[]).includes(lower) || !isValidMonthSlug(monthYear)) {
    notFound();
  }

  const monthMeta = getMonthMeta(monthYear)!;
  const meta = SIGN_META[lower];
  const capitalizedSign = capitalize(lower);
  const otherMonths = getValidMonthSlugs().filter((m) => m !== monthYear);
  const baseUrl = 'https://www.gettodayshoroscope.com';
  const pageUrl = `${baseUrl}/horoscope/${lower}/monthly/${monthYear}`;

  // Generate monthly horoscope directly via the generator.
  // This server component is ISR-cached (revalidate=86400), so OpenAI is called
  // at most once per day per sign/month combination.
  let horoscope;
  try {
    horoscope = await generateHoroscope(lower, 'monthly', { month: monthYear });
  } catch (err) {
    console.error(`[monthly-page] Failed to generate horoscope for ${lower}/${monthYear}:`, err);
    notFound();
  }

  // JSON-LD schemas
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${capitalizedSign} Horoscope ${monthMeta.display}`,
    description: `Philosophical monthly guidance for ${capitalizedSign} in ${monthMeta.display}.`,
    url: pageUrl,
    datePublished: monthMeta.firstDay,
    dateModified: monthMeta.firstDay,
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
        name: 'Monthly',
        item: `${baseUrl}/horoscope/${lower}/monthly/${monthYear}`,
      },
      {
        '@type': 'ListItem',
        position: 4,
        name: monthMeta.display,
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
          <span className="text-indigo-200/60">Monthly</span>
          <span>/</span>
          <span className="text-indigo-200/80">{monthMeta.display}</span>
        </nav>

        {/* Sign header */}
        <div className="flex items-center gap-4 mb-2">
          <span className="text-5xl">{meta.symbol}</span>
          <div>
            <h1 className="text-3xl sm:text-4xl font-normal text-white tracking-tight">
              {capitalizedSign} Horoscope {monthMeta.display}
            </h1>
            <p className="text-indigo-200/70 text-sm font-light tracking-wide mt-0.5">
              {meta.dateRange} &bull; {meta.element} &bull; Monthly Philosophical Guidance
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
                  Closing reflection
                </p>
                <p className="text-white/70 text-sm font-light leading-relaxed">
                  {horoscope.peaceful_thought}
                </p>
              </div>
            )}
          </div>

          {/* Author attribution */}
          <div className="flex items-center gap-3 px-1">
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
        </article>

        {/* Internal links */}
        <div className="mt-10 space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={`/horoscope/${lower}`}
              className="inline-flex items-center gap-1.5 text-sm text-indigo-300/70 hover:text-indigo-200 transition-colors font-light"
            >
              &larr; Back to {capitalizedSign} daily horoscope
            </Link>
          </div>

          {otherMonths.length > 0 && (
            <div>
              <p className="text-xs text-indigo-300/50 font-light uppercase tracking-widest mb-2">
                Other months
              </p>
              <div className="flex gap-3 flex-wrap">
                {otherMonths.map((slug) => {
                  const m = VALID_MONTH_SLUGS[slug];
                  return (
                    <Link
                      key={slug}
                      href={`/horoscope/${lower}/monthly/${slug}`}
                      className="text-sm text-indigo-300/60 hover:text-indigo-200 transition-colors font-light underline underline-offset-2"
                    >
                      {m.display}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Email capture */}
        <EmailCapture sign={lower} />
      </div>
    </main>
  );
}
