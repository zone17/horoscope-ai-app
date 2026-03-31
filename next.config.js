/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'horoscope-ai-app.vercel.app', 'www.gettodayshoroscope.com', 'api.gettodayshoroscope.com'],
    },
  },
};

module.exports = nextConfig;
