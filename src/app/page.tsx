import { Suspense } from 'react';
import { HoroscopeDisplay } from '@/components/HoroscopeDisplay';
import { Header } from '@/components/Header';
import { ModeProvider } from '@/components/ModeProvider';

export default function Home() {
  return (
    <ModeProvider>
      <main className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950 transition-colors duration-300">
        <Header />
        <div className="container mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-12 md:py-16">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center text-indigo-900 dark:text-indigo-100 mb-8 sm:mb-12 md:mb-16">
            Daily Cosmic Guidance
          </h1>
          
          <Suspense fallback={<div className="text-center py-10">Loading zodiac insights...</div>}>
            <HoroscopeDisplay />
          </Suspense>
        </div>
      </main>
    </ModeProvider>
  );
}
