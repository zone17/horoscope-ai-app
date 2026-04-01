import { Metadata } from 'next';
import Link from 'next/link';
import { AUTHOR } from '@/constants/author';

export const revalidate = 86400; // ISR: revalidate once per day (author content rarely changes)

const VALID_SIGNS = [
  'aries', 'taurus', 'gemini', 'cancer',
  'leo', 'virgo', 'libra', 'scorpio',
  'sagittarius', 'capricorn', 'aquarius', 'pisces',
] as const;

export const metadata: Metadata = {
  title: `${AUTHOR.name} — ${AUTHOR.title} | Get Today's Horoscope`,
  description:
    "Meet Elena Vasquez, the philosophical astrologer behind Get Today's Horoscope. Her readings draw on Stoicism, Eastern philosophy, and scientific thinking to offer genuine daily guidance.",
  alternates: {
    canonical: AUTHOR.url,
  },
  openGraph: {
    title: `${AUTHOR.name} — ${AUTHOR.title}`,
    description:
      "Meet Elena Vasquez, the philosophical astrologer behind Get Today's Horoscope.",
    url: AUTHOR.url,
    siteName: "Get Today's Horoscope",
    type: 'profile',
  },
};

export default function AuthorPage() {
  const personSchema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: AUTHOR.name,
    jobTitle: AUTHOR.title,
    description: AUTHOR.bio[0],
    url: AUTHOR.url,
    image: `https://www.gettodayshoroscope.com${AUTHOR.image}`,
    worksFor: {
      '@type': 'Organization',
      name: "Get Today's Horoscope",
      url: 'https://www.gettodayshoroscope.com',
    },
    sameAs: ['https://www.gettodayshoroscope.com'],
  };

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
        name: 'About',
        item: 'https://www.gettodayshoroscope.com/about',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: AUTHOR.name,
        item: AUTHOR.url,
      },
    ],
  };

  return (
    <main className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-indigo-300/70 hover:text-indigo-200 text-sm font-light mb-8 transition-colors"
        >
          &larr; Home
        </Link>

        {/* Author header */}
        <div className="mb-10">
          <p className="text-indigo-300/60 text-xs font-light tracking-widest uppercase mb-3">
            About the Author
          </p>
          <h1 className="text-3xl sm:text-4xl font-normal text-white tracking-tight mb-2">
            {AUTHOR.name}
          </h1>
          <p className="text-indigo-200/70 text-sm font-light tracking-wide">
            {AUTHOR.title}
          </p>
        </div>

        {/* Bio */}
        <div className="space-y-5 mb-12">
          {AUTHOR.bio.map((paragraph, i) => (
            <p key={i} className="text-indigo-100/80 font-light text-base leading-relaxed">
              {paragraph}
            </p>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-white/10 my-10" />

        {/* Internal links — homepage */}
        <div className="mb-8">
          <h2 className="text-lg font-normal text-white tracking-tight mb-4">
            Start with today&apos;s reading
          </h2>
          <Link
            href="/"
            className="inline-block px-5 py-2.5 rounded-lg bg-indigo-500/20 border border-indigo-400/30 text-sm text-indigo-200 hover:bg-indigo-500/30 transition-colors font-medium"
          >
            Today&apos;s Philosophical Horoscope
          </Link>
        </div>

        {/* Internal links — all 12 signs */}
        <div>
          <h2 className="text-lg font-normal text-white tracking-tight mb-4">
            Read by sign
          </h2>
          <nav aria-label="Zodiac sign pages">
            <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {VALID_SIGNS.map((sign) => (
                <li key={sign}>
                  <Link
                    href={`/horoscope/${sign}`}
                    className="block px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-indigo-200/80 hover:text-white hover:bg-white/10 transition-colors font-light capitalize text-center"
                  >
                    {sign}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </main>
  );
}
