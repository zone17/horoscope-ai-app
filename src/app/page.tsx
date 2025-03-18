import OpenAITester from '@/components/OpenAITester';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 sm:p-8 md:p-12 lg:p-24">
      <div className="max-w-4xl w-full bg-white rounded-lg shadow-lg p-6 sm:p-8 md:p-10">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-6 sm:mb-8 md:mb-10">
          OpenAI API with Redis Caching
        </h1>
        
        <div className="w-full">
          <OpenAITester />
        </div>
      </div>
    </main>
  );
}
