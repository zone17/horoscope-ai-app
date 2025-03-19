import { Suspense } from 'react';
import { HoroscopeDisplay } from '@/components/HoroscopeDisplay';
import { Header } from '@/components/Header';
import { ModeProvider } from '@/components/ModeProvider';

export default function Home() {
  return (
    <ModeProvider>
      <main className="min-h-screen bg-gradient-to-br from-indigo-950 via-[#0f0b30] to-[#0c0921] text-white">
        <Header />
        <Suspense fallback={
          <div className="text-center py-20 text-white">
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
      </main>
    </ModeProvider>
  );
}
