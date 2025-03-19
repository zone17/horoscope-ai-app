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
  // Frontend specific optimizations
  output: 'standalone',
  distDir: '.next',
  // Enable image optimization for frontend
  images: {
    domains: ['api.gettodayshoroscope.com'],
  },
  // API rewrites for frontend
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://api.gettodayshoroscope.com/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig; 