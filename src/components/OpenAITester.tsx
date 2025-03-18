'use client';

import { useState } from 'react';

// Define types for the OpenAI API response
interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

interface OpenAIResult {
  success: boolean;
  text: string;
  model: string;
  created: number;
  usage?: TokenUsage;
  cached: boolean;
  cache_key?: string;
  prompt: string;
  error?: string;
}

export default function OpenAITester() {
  const [prompt, setPrompt] = useState('Tell me something interesting about space.');
  const [result, setResult] = useState<OpenAIResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Call our enhanced OpenAI API endpoint
      const response = await fetch(`/api/openai-enhanced?prompt=${encodeURIComponent(prompt)}`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error('Error fetching from API:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="mb-4">
          <label 
            htmlFor="prompt" 
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Enter your prompt:
          </label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            rows={4}
            required
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300"
        >
          {loading ? 'Processing...' : 'Submit'}
        </button>
      </form>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          <p className="font-medium">Error:</p>
          <p>{error}</p>
        </div>
      )}
      
      {result && (
        <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Result:</h2>
          
          {result.cached && (
            <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded mb-4">
              <p className="font-medium">This response was cached in Redis</p>
              <p className="text-xs">Cache key: {result.cache_key}</p>
            </div>
          )}
          
          <div className="mb-4">
            <h3 className="font-medium mb-2">Response:</h3>
            <div className="bg-white p-4 rounded border border-gray-200">
              {result.text}
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium mb-2">Details:</h3>
              <ul className="text-sm">
                <li><span className="font-medium">Model:</span> {result.model}</li>
                <li><span className="font-medium">Created:</span> {new Date(result.created * 1000).toLocaleString()}</li>
                <li><span className="font-medium">Cached:</span> {result.cached ? 'Yes' : 'No'}</li>
              </ul>
            </div>
            
            {result.usage && (
              <div>
                <h3 className="font-medium mb-2">Token Usage:</h3>
                <ul className="text-sm">
                  <li><span className="font-medium">Prompt tokens:</span> {result.usage.prompt_tokens}</li>
                  <li><span className="font-medium">Completion tokens:</span> {result.usage.completion_tokens}</li>
                  <li><span className="font-medium">Total tokens:</span> {result.usage.total_tokens}</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 