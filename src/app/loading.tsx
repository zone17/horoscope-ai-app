export default function Loading() {
  return (
    <div className="fixed inset-0 bg-indigo-50/80 dark:bg-indigo-950/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg p-8 rounded-xl shadow-xl border border-indigo-100 dark:border-indigo-900 flex flex-col items-center">
        <div className="flex space-x-2 mb-4">
          {[...Array(3)].map((_, i) => (
            <div 
              key={i} 
              className="w-4 h-4 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-bounce" 
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
        <p className="text-gray-700 dark:text-gray-300 font-medium">
          Loading cosmic insights...
        </p>
      </div>
    </div>
  );
} 