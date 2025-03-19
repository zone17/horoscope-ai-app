/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'horoscope-ai-app.vercel.app', 'www.gettodayshoroscope.com', 'api.gettodayshoroscope.com'],
    },
  },
  // Disable TypeScript type checking for deployment
  typescript: {
    ignoreBuildErrors: true,
  },
  // Disable ESLint during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Only include API routes
  output: 'standalone',
  distDir: '.next',
  // Optimization
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Disable image optimization for API-only builds
  images: {
    unoptimized: true,
  }
};

module.exports = nextConfig; 