import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';

export const metadata: Metadata = {
  title: 'Privacy — Today\'s Horoscope',
  description: 'How Today\'s Horoscope handles your data: what we collect, why, and what we never do with it.',
  alternates: { canonical: 'https://www.gettodayshoroscope.com/privacy' },
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen">
      <Header />

      <article className="max-w-2xl mx-auto px-4 py-16 text-indigo-100/90 font-light leading-relaxed">
        <h1 className="font-display text-3xl sm:text-4xl text-[#F0EEFF] mb-3">Privacy</h1>
        <p className="text-indigo-200/60 text-sm mb-10">Last updated: 2026-05-04</p>

        <h2 className="font-display text-xl text-[#F0EEFF] mb-3">What we collect</h2>
        <p className="mb-3">
          We collect what we need to deliver the daily reading you asked for, and nothing else.
        </p>
        <ul className="list-disc pl-6 mb-6 space-y-2">
          <li>
            <strong>Email address</strong>, only if you subscribe. Used to send you the daily reading and a single confirmation email when you sign up. Stored at our email provider (Resend).
          </li>
          <li>
            <strong>Sign and council selections</strong>, stored in your browser&apos;s localStorage so the site remembers them between visits. They never leave your device unless you subscribe.
          </li>
          <li>
            <strong>Anonymous traffic analytics</strong> via Vercel Analytics: page views, referrer, approximate region. No cross-site tracking. No third-party advertising cookies.
          </li>
        </ul>

        <h2 className="font-display text-xl text-[#F0EEFF] mt-10 mb-3">What we do not do</h2>
        <ul className="list-disc pl-6 mb-6 space-y-2">
          <li>We do not sell your data to anyone. Ever.</li>
          <li>We do not run third-party advertising trackers.</li>
          <li>We do not require an account to use the site.</li>
          <li>We do not retain email addresses after you unsubscribe.</li>
        </ul>

        <h2 className="font-display text-xl text-[#F0EEFF] mt-10 mb-3">Your rights</h2>
        <p className="mb-3">You can:</p>
        <ul className="list-disc pl-6 mb-6 space-y-2">
          <li>Unsubscribe from emails at any time using the link in any email we send you, or by emailing <a href="mailto:hello@gettodayshoroscope.com" className="text-indigo-300 hover:text-indigo-200 underline underline-offset-2">hello@gettodayshoroscope.com</a>.</li>
          <li>Request deletion of your stored email at any time by emailing the address above.</li>
          <li>Clear your local sign and council selections by clearing your browser&apos;s site data for this domain.</li>
        </ul>

        <h2 className="font-display text-xl text-[#F0EEFF] mt-10 mb-3">Service providers</h2>
        <p className="mb-3">
          We use the following providers to deliver this service:
        </p>
        <ul className="list-disc pl-6 mb-6 space-y-2">
          <li><strong>Vercel</strong> for hosting, analytics, and email delivery infrastructure.</li>
          <li><strong>Resend</strong> for transactional email.</li>
          <li><strong>Anthropic</strong> for the language model that generates the daily readings (no personal data is sent to the model; only sign and council are passed).</li>
          <li><strong>Upstash</strong> for cache.</li>
        </ul>

        <h2 className="font-display text-xl text-[#F0EEFF] mt-10 mb-3">Changes</h2>
        <p className="mb-8">
          If we change this policy materially, we will note it at the top of this page with a new date and, for subscribers, send a notice to your email.
        </p>

        <p className="text-indigo-200/70 text-sm mb-10">
          Questions? <a href="mailto:hello@gettodayshoroscope.com" className="text-indigo-300 hover:text-indigo-200 underline underline-offset-2">hello@gettodayshoroscope.com</a>.
        </p>

        <nav className="border-t border-white/10 pt-6 flex gap-4 text-sm text-indigo-200/60">
          <Link href="/" className="hover:text-indigo-200">Home</Link>
          <Link href="/about" className="hover:text-indigo-200">About</Link>
          <Link href="/terms" className="hover:text-indigo-200">Terms</Link>
        </nav>
      </article>
    </main>
  );
}
