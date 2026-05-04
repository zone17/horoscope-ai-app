import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';

export const metadata: Metadata = {
  title: 'About — Today\'s Horoscope',
  description: 'Today\'s Horoscope is a Philosophy Engine. Pick your sign, choose a council of thinkers, and receive a daily reading that blends their cognitive frames with your zodiac voice. Not predictions. Philosophy that meets you where you are.',
  alternates: { canonical: 'https://www.gettodayshoroscope.com/about' },
};

export default function AboutPage() {
  return (
    <main className="min-h-screen">
      <Header />

      <article className="max-w-2xl mx-auto px-4 py-16 text-indigo-100/90 font-light leading-relaxed">
        <h1 className="font-display text-3xl sm:text-4xl text-[#F0EEFF] mb-6">About</h1>

        <p className="mb-5">
          Today&apos;s Horoscope is a Philosophy Engine. ChatGPT can write a horoscope. ChatGPT can write about Seneca. ChatGPT cannot remember your specific council of thinkers across days and synthesize across their actual writings, rooted in verifiable sources, without sounding like a horoscope.
        </p>

        <p className="mb-5">
          That gap is the product. You pick your sign and a small group of philosophers from a roster of 50+ thinkers across 9 traditions. Each morning, an anonymous voice writes a reading that blends their cognitive frames with the documented texture of your sign, anchored in today&apos;s actual context: lunar phase, day of the week, season. The quote is separate, attributed, and rotates through your council&apos;s verified writings.
        </p>

        <p className="mb-5">
          We do not predict events. We are not fortune-tellers. The work is to give you something you can sit with for thirty seconds and recognize yourself inside.
        </p>

        <h2 className="font-display text-xl text-[#F0EEFF] mt-10 mb-3">How it works</h2>

        <p className="mb-5">
          Every reading is generated fresh each day from the sign profile, today&apos;s celestial context, and the worldview your council represents. Quotes come from a verified bank of source-attributed material; we never invent or paraphrase what a philosopher said. Models are pinned to specific versions; rotations are deliberate, reviewed, and tracked.
        </p>

        <h2 className="font-display text-xl text-[#F0EEFF] mt-10 mb-3">Who built this</h2>

        <p className="mb-5">
          A small team that thinks daily horoscopes deserve more care than the current internet gives them. Our principles are documented openly in <a href="https://github.com/zone17/horoscope-ai-app" className="text-indigo-300 hover:text-indigo-200 underline underline-offset-2">our repository</a>.
        </p>

        <h2 className="font-display text-xl text-[#F0EEFF] mt-10 mb-3">Get in touch</h2>

        <p className="mb-8">
          For feedback, partnerships, or a quiet word: <a href="mailto:hello@gettodayshoroscope.com" className="text-indigo-300 hover:text-indigo-200 underline underline-offset-2">hello@gettodayshoroscope.com</a>.
        </p>

        <nav className="border-t border-white/10 pt-6 flex gap-4 text-sm text-indigo-200/60">
          <Link href="/" className="hover:text-indigo-200">Home</Link>
          <Link href="/privacy" className="hover:text-indigo-200">Privacy</Link>
          <Link href="/terms" className="hover:text-indigo-200">Terms</Link>
        </nav>
      </article>
    </main>
  );
}
