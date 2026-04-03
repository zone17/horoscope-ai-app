import Link from 'next/link';

/**
 * Server component rendering the AutoResearch-optimized intro copy for the homepage.
 * Placed before HoroscopeDisplay so it is immediately visible (server-rendered) before the loading spinner.
 */
export default function HeroIntro() {
  return (
    <section
      className="w-full max-w-2xl mx-auto px-4 sm:px-6 pt-24 pb-4 text-center"
      aria-label="Site introduction"
    >
      <h1 className="text-3xl sm:text-4xl font-normal text-white tracking-tight mb-4">
        Your Personal Philosophy Engine
      </h1>
      <p className="text-indigo-100/80 font-light text-base sm:text-lg leading-relaxed mb-6">
        We trained an AI on 50+ of the world&apos;s greatest philosophers — from Marcus Aurelius
        to Alan Watts, Marie Curie to Rumi. Pick your sign, choose your council of thinkers,
        and receive daily guidance that blends their wisdom with your zodiac temperament.
        Not predictions. Philosophy that meets you where you are.
      </p>
      <Link
        href="#horoscope"
        className="inline-block px-6 py-2.5 rounded-full bg-indigo-500/40 border border-indigo-400/30 text-sm text-white hover:bg-indigo-500/60 transition-all duration-300 font-medium shadow-sm"
      >
        Build your council
      </Link>
    </section>
  );
}
