# Today's Horoscope Application

## Recent Updates

### Timezone-Aware Content Generation (March 2024)
- **Feature Flag Implementation**: Added FEATURE_FLAG_USE_TIMEZONE_CONTENT to production environment
- **Enhanced Caching**: Implemented timezone-aware cache keys for better content delivery
- **API Improvements**: Enhanced responses to include timezone and local date information
- **Documentation**: Updated deployment configuration and technical documentation

The timezone-aware content generation feature ensures that users receive horoscopes based on their local date, improving the relevance and accuracy of predictions across different time zones.

### XML Sitemap Implementation (March 2024)
- **Dynamic Sitemap Generation**: Added XML sitemap for improved search engine crawling
- **Feature Flag Control**: Easily enable/disable with `FEATURE_FLAG_USE_XML_SITEMAP`
- **Documentation**: Added detailed documentation in [docs/seo/XML_SITEMAP.md](./docs/seo/XML_SITEMAP.md)
- **Testing**: Comprehensive unit tests for all sitemap components

The XML sitemap feature improves SEO by providing search engines with a comprehensive map of the site structure, helping them discover and index all pages more efficiently.

### Schema Markup Implementation (March 2024)
- **Enhanced Schema Generator**: Added full support for all required schema types (WebSite, Organization, Service, ItemList, FAQ, and Article/CreativeWork)
- **Improved Testing**: Added unit tests and regression tests for schema generation
- **Documentation**: Added detailed documentation in [docs/seo/SCHEMA_MARKUP.md](./docs/seo/SCHEMA_MARKUP.md) and [docs/TESTING.md](./docs/TESTING.md)
- **Feature Flag**: Enabled `FEATURE_FLAG_USE_SCHEMA_MARKUP` in production environment

The schema markup feature improves SEO by adding structured data to our pages, making them more accessible to search engines and potentially improving search result display.

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
FEATURE_FLAG_USE_TIMEZONE_CONTENT=true

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

## Testing

The application uses Jest for unit and integration testing. Tests are designed to verify component functionality, feature flag behavior, and business logic.

Key testing approaches include:
- **Unit Tests**: Verify individual components and utilities work correctly
- **Integration Tests**: Verify components work together properly
- **Feature Flag Testing**: Verify features can be toggled on/off via configuration

For detailed information on testing approaches and best practices, see:
- [Testing Documentation](./docs/TESTING.md)

## Features

### Timezone-Aware Content Generation

The application uses the user's local timezone to deliver horoscopes relevant to their current date, not UTC date:

- Automatically detects user timezone via browser APIs
- Generates and caches horoscopes based on local date in each timezone
- Utilizes batch generation to optimize API usage (all zodiac signs generated at once)
- Features a fallback to UTC date when timezone cannot be determined

For detailed information, see:
- [Timezone-Aware Content Technical Documentation](./docs/TIMEZONE_CONTENT.md)
- [Timezone-Aware Deployment Guide](./docs/TIMEZONE_DEPLOYMENT.md)

### Lunar Calendar Zodiac Ordering

The application supports displaying zodiac signs in lunar calendar order instead of the traditional solar order:

- Controlled by a feature flag for easy enabling/disabling
- Starts with Aquarius (lunar new year) instead of Capricorn
- Maintains all functionality while providing an alternative viewing experience
- Implemented only on the frontend with no impact on API or horoscope generation

For detailed information, see:
- [Lunar Calendar Ordering Documentation](./docs/LUNAR_CALENDAR_ORDER.md)

### Core Web Vitals Optimization

The application implements performance optimizations targeted at Google's Core Web Vitals metrics:

- **Current Status**: Fully implemented and enabled in both development and production
- **Feature Flag Control**: Uses `FEATURE_FLAG_USE_CORE_WEB_VITALS_OPT` for safe rollout and easy rollback
- **Toggle Script**: Easily enable/disable with `./scripts/toggle-core-web-vitals.sh [on|off]`
- **Performance Improvements**:
  - Optimizes Largest Contentful Paint (LCP) with resource hints and prioritized loading
  - Improves Cumulative Layout Shift (CLS) with fixed-size containers and placeholders
  - Enhances Interaction to Next Paint (INP) with optimized JavaScript handling
- **Analytics**: Collects and analyzes performance metrics via a dedicated API endpoint
- **Testing**: Comprehensive testing suite including unit tests, integration tests, and Lighthouse verification

For detailed information, see:
- [Core Web Vitals Documentation](./docs/CORE_WEB_VITALS.md)

### Content Optimization

The application includes several optimizations for content generation:

- **Batch Generation**: When a user requests a horoscope that isn't cached for their local date, the system generates horoscopes for all zodiac signs at once, reducing API calls
- **Philosopher Rotation**: Daily horoscopes feature content written in the style of different philosophers, rotating through a predefined list
- **Lazy Loading**: Content is generated on-demand rather than using scheduled jobs, ensuring freshness while minimizing API usage

### Schema Markup for SEO

The application implements comprehensive schema markup for improved search engine visibility:

- **Feature Flag Control**: Easily enable/disable schema markup via environment variables
- **Multiple Schema Types**: Includes WebSite, Organization, Service, ItemList, CreativeWork, and FAQPage schemas
- **Dynamic Generation**: Schema content adapts to the actual horoscope data
- **Structured Testing**: Comprehensive unit and integration tests validate schema generation

For detailed information, see:
- [Schema Markup Implementation Documentation](./docs/seo/SCHEMA_MARKUP.md)
