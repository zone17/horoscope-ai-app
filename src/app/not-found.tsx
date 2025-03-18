import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950 p-4">
      <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-lg p-8 md:p-12 rounded-xl shadow-lg border border-white/50 dark:border-slate-700/50 max-w-lg w-full text-center">
        <h1 className="text-6xl md:text-8xl font-bold text-indigo-500 dark:text-indigo-400 mb-4">404</h1>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-200 mb-6">Cosmic Alignment Error</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          The stars couldn't align to find the page you're looking for. Perhaps Mercury is in retrograde?
        </p>
        <Link 
          href="/" 
          className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-300"
        >
          Return to Cosmic Home
        </Link>
      </div>
    </div>
  );
} 