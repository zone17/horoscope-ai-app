import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';

export const metadata: Metadata = {
  title: 'Terms — Today\'s Horoscope',
  description: 'The terms under which you may use Today\'s Horoscope.',
  alternates: { canonical: 'https://www.gettodayshoroscope.com/terms' },
};

export default function TermsPage() {
  return (
    <main className="min-h-screen">
      <Header />

      <article className="max-w-2xl mx-auto px-4 py-16 text-indigo-100/90 font-light leading-relaxed">
        <h1 className="font-display text-3xl sm:text-4xl text-[#F0EEFF] mb-3">Terms of Use</h1>
        <p className="text-indigo-200/60 text-sm mb-10">Last updated: 2026-05-04</p>

        <h2 className="font-display text-xl text-[#F0EEFF] mb-3">What this is</h2>
        <p className="mb-6">
          Today&apos;s Horoscope is a free daily reading service. The readings are generated for entertainment, reflection, and philosophical engagement. They are not medical, legal, financial, or psychological advice. If you are dealing with something hard, please talk to a real human professional.
        </p>

        <h2 className="font-display text-xl text-[#F0EEFF] mt-10 mb-3">Using the site</h2>
        <ul className="list-disc pl-6 mb-6 space-y-2">
          <li>You may read, save, screenshot, or share individual readings for personal and non-commercial use.</li>
          <li>You may not scrape, mirror, or systematically republish the site&apos;s content without our written permission.</li>
          <li>You may not abuse the API or attempt to disrupt the service.</li>
        </ul>

        <h2 className="font-display text-xl text-[#F0EEFF] mt-10 mb-3">Content and quotes</h2>
        <p className="mb-6">
          Quoted material from named philosophers is reproduced under fair use for commentary and criticism. Sources are cited where possible. If you believe a quote is misattributed or want a citation removed, contact us at <a href="mailto:hello@gettodayshoroscope.com" className="text-indigo-300 hover:text-indigo-200 underline underline-offset-2">hello@gettodayshoroscope.com</a> and we will respond promptly.
        </p>

        <h2 className="font-display text-xl text-[#F0EEFF] mt-10 mb-3">Liability</h2>
        <p className="mb-6">
          The site is provided as-is. We make no guarantees about uptime, accuracy, or fitness for any particular purpose. We are not liable for decisions you make based on a reading. The readings are guidance, not guidance counselors.
        </p>

        <h2 className="font-display text-xl text-[#F0EEFF] mt-10 mb-3">Subscription</h2>
        <p className="mb-6">
          The email subscription is free. You can unsubscribe at any time using the link in any email we send you. We do not run paid tiers (yet). If we add them, the existing free tier remains free for existing subscribers.
        </p>

        <h2 className="font-display text-xl text-[#F0EEFF] mt-10 mb-3">Changes</h2>
        <p className="mb-8">
          We may update these terms. Material changes will be noted at the top of this page with a new date. Continued use of the site after a change constitutes acceptance of the updated terms.
        </p>

        <p className="text-indigo-200/70 text-sm mb-10">
          Questions? <a href="mailto:hello@gettodayshoroscope.com" className="text-indigo-300 hover:text-indigo-200 underline underline-offset-2">hello@gettodayshoroscope.com</a>.
        </p>

        <nav className="border-t border-white/10 pt-6 flex gap-4 text-sm text-indigo-200/60">
          <Link href="/" className="hover:text-indigo-200">Home</Link>
          <Link href="/about" className="hover:text-indigo-200">About</Link>
          <Link href="/privacy" className="hover:text-indigo-200">Privacy</Link>
        </nav>
      </article>
    </main>
  );
}
