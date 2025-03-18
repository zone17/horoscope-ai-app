/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'horoscope-ai-app.vercel.app', '*.vercel.app']
    }
  }
};

module.exports = nextConfig;
