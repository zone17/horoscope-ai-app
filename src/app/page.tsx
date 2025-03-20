import { Suspense } from 'react';
import { HoroscopeDisplay } from '@/components/zodiac/HoroscopeDisplay';
import { Header } from '@/components/layout/Header';

// Disable static generation
export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <main className="min-h-screen">
      <Header />
      
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
        <HoroscopeDisplay />
      </Suspense>
      
      <footer className="text-center py-6 text-indigo-300/60 text-sm">
        <p>© {new Date().getFullYear()} Cosmic Insights. All rights reserved.</p>
      </footer>
    </main>
  );
}
