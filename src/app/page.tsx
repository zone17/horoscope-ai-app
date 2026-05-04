import { Suspense } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import HeroIntro from '@/components/seo/HeroIntro';
import FAQSection from '@/components/seo/FAQSection';
import HomeFlow from '@/components/home/HomeFlow';

// ISR: revalidate every hour (content changes once daily)
export const revalidate = 3600;

export default function Home() {
  return (
    <main className="min-h-screen">
      <Header />

      <HeroIntro />

      <div id="horoscope">
        <Suspense fallback={
          <div className="text-center py-32 text-white">
            <div className="inline-flex space-x-2 items-center">
              <div className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce"></div>
              <div className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              <span className="ml-2">Loading cosmic insights...</span>
            </div>
          </div>
        }>
          <HomeFlow />
        </Suspense>
      </div>

      <FAQSection />

      <footer className="text-center py-8 text-indigo-200/70 text-sm space-y-3">
        <nav className="flex justify-center gap-5">
          <Link href="/about" className="hover:text-indigo-200 transition-colors">About</Link>
          <Link href="/privacy" className="hover:text-indigo-200 transition-colors">Privacy</Link>
          <Link href="/terms" className="hover:text-indigo-200 transition-colors">Terms</Link>
        </nav>
        <p>&copy; {new Date().getFullYear()} Get Today&apos;s Horoscope. All rights reserved.</p>
      </footer>
    </main>
  );
}
