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
  }
};

module.exports = nextConfig;
