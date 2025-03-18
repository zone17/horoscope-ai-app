import { Suspense } from 'react';
import { HoroscopeDisplay } from '@/components/HoroscopeDisplay';
import { Header } from '@/components/Header';
import { ModeProvider } from '@/components/ModeProvider';

export default function Home() {
  return (
    <ModeProvider>
      <main className="min-h-screen bg-indigo-950">
        <Header />
        <Suspense fallback={<div className="text-center py-10 text-white">Loading zodiac insights...</div>}>
          <HoroscopeDisplay />
        </Suspense>
      </main>
    </ModeProvider>
  );
}
