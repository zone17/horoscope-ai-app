/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Pre-existing lint warnings in legacy code — addressed in eslint.config.mjs rules
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'horoscope-ai-app.vercel.app', 'www.gettodayshoroscope.com', 'api.gettodayshoroscope.com'],
    },
  },
};

module.exports = nextConfig;
