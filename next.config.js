/** @type {import('next').NextConfig} */
const nextConfig = {
  // Type and lint errors must fail the build — no silent deploys.
  // If pre-existing errors block build, fix them or delete the dead code.
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'horoscope-ai-app.vercel.app', 'www.gettodayshoroscope.com', 'api.gettodayshoroscope.com'],
    },
  },
};

module.exports = nextConfig;
