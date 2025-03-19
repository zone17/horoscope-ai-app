This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Redis Caching Setup

This application uses Upstash Redis for caching and rate limiting. Follow these steps to set it up:

1. Create an account on [Upstash](https://upstash.com/)
2. Create a new Redis database named `horoscope-prod-cache`
3. Get your REST API credentials from the Upstash dashboard
4. Add them to your environment variables:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

The caching system supports:
- API response caching with configurable TTL
- Rate limiting for API endpoints
- Feature flags to control caching behavior

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## OpenAI Integration

This project uses OpenAI's API for generating horoscopes. For developers working on this codebase, please refer to the following resources:

- [OpenAI API Best Practices](./docs/api/OPENAI_BEST_PRACTICES.md) - Comprehensive guide for integrating with OpenAI
- [OpenAI Integration Checklist](./docs/api/OPENAI_CHECKLIST.md) - Use this checklist when implementing or reviewing OpenAI features

The OpenAI API key is managed through Vercel environment variables and all API requests are made server-side to ensure security.

## Domain Architecture Setup

This application is deployed using a subdomain-based architecture to separate frontend and backend:

- **Frontend**: `https://www.gettodayshoroscope.com`
- **Backend API**: `https://api.gettodayshoroscope.com`

### Deployment Instructions

#### Step 1: Create Two Vercel Projects

1. Create a frontend project for the website (www subdomain)
2. Create a backend project for the API (api subdomain)

#### Step 2: Environment Variables

**Frontend Project**:
```
NEXT_PUBLIC_API_URL=https://api.gettodayshoroscope.com
```

**Backend Project**:
```
# Redis connection
UPSTASH_REDIS_REST_URL=your-redis-url
UPSTASH_REDIS_REST_TOKEN=your-redis-token

# OpenAI
OPENAI_API_KEY=your-openai-key

# Feature flags
FEATURE_FLAG_USE_REDIS_CACHE=true
FEATURE_FLAG_USE_RATE_LIMITING=true

# Security (optional)
CRON_SECRET=your-secret-for-cron-jobs
```

#### Step 3: Domain Configuration

1. Add your custom domain to both Vercel projects:
   - Frontend: `www.gettodayshoroscope.com`
   - Backend: `api.gettodayshoroscope.com`

2. Configure DNS settings with your domain provider:
   - Add CNAME records pointing to Vercel's DNS targets
   - Follow Vercel's domain verification steps

#### Step 4: Deployment Order

1. Deploy the backend (API) project first
2. Deploy the frontend project after the backend is working

### Local Development

For local development, the application uses environment variables to determine API URLs. In development mode, both frontend and backend run on the same server (localhost:3000).
