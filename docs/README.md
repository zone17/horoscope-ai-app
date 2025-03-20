# Horoscope AI Application Documentation

Welcome to the documentation for the Horoscope AI Application. This guide is designed to help engineers understand the codebase and quickly get up to speed on the project.

## 📑 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Frontend Documentation](#frontend-documentation)
3. [Backend Documentation](#backend-documentation)
4. [Smart Polling System](#smart-polling-system)
5. [UI Design System](#ui-design-system)
6. [Deployment Guide](#deployment-guide)
7. [API Integration](#api-integration)

## Architecture Overview

The application follows a subdomain-based architecture with separate frontend and backend deployments:

- **Frontend**: [`www.gettodayshoroscope.com`](https://www.gettodayshoroscope.com)
- **Backend API**: [`api.gettodayshoroscope.com`](https://api.gettodayshoroscope.com)

The frontend is a Next.js application that communicates with the backend API to retrieve horoscope data. The backend handles OpenAI integration, Redis caching, and data processing.

For detailed architecture information, see [ARCHITECTURE.md](./ARCHITECTURE.md).

## Frontend Documentation

### Key Components

- **ZodiacCard**: Displays individual zodiac sign information and horoscope data
- **HoroscopeDisplay**: Main component for fetching and displaying all zodiac signs
- **Header**: Navigation and UI controls
- **Theme Toggle**: Support for light/dark mode switching

The frontend uses a glassmorphic design system with modern UI elements, smooth animations, and responsive layout.

### State Management

- Client-side state management for UI interactions
- API data fetching with smart polling mechanism
- Error and loading state handling

## Backend Documentation

### API Endpoints

- `/api/horoscope?sign={sign}&type={type}`: Retrieves horoscope data for a specific sign
- `/api/cron/daily-horoscope`: Generates new horoscopes (can be triggered manually or via cron)

### Data Storage

- Redis is used for caching horoscope data with configurable TTL
- Cache keys follow consistent naming patterns
- Cache invalidation strategies are implemented

### Rate Limiting

- API endpoints include rate limiting to prevent abuse
- Rate limits can be configured via environment variables

## Smart Polling System

The application implements a sophisticated polling mechanism to handle asynchronous horoscope generation:

1. Frontend attempts to load all horoscopes
2. Missing data triggers backend generation job
3. Frontend polls for results with configurable timing
4. Graceful degradation if data cannot be retrieved

For detailed documentation on this system, see [SMART_POLLING.md](./SMART_POLLING.md).

## UI Design System

The UI follows a consistent glassmorphic design system:

- Translucent, borderless components with backdrop blur
- Light typography with extralight font weights
- Space-inspired color palette with gradients
- Subtle animations and hover effects
- Responsive design for all screen sizes

For detailed UI guidelines, see [UI_DESIGN_SYSTEM.md](./UI_DESIGN_SYSTEM.md).

## Deployment Guide

The project is deployed using Vercel with separate projects for frontend and backend:

1. Backend API is deployed first
2. Frontend is deployed with proper environment variables
3. Custom deployment scripts automate the process

For detailed deployment instructions, see [../DEPLOYMENT.md](../DEPLOYMENT.md).

## API Integration

### OpenAI Integration

The application uses OpenAI's API to generate horoscope content:

- GPT models generate personalized horoscope text
- Proper temperature and prompt engineering for diverse results
- Error handling and fallback strategies

For best practices when working with OpenAI:

- [OpenAI API Best Practices](./api/OPENAI_BEST_PRACTICES.md)
- [OpenAI Integration Checklist](./api/OPENAI_CHECKLIST.md)

### Feature Flags

The application uses environment variables for feature flags:

```typescript
// Example feature flag check
if (isFeatureEnabled(FEATURE_FLAGS.USE_REDIS_CACHE)) {
  // Use Redis caching
} else {
  // Use alternative strategy
}
```

Key feature flags:
- `USE_REDIS_CACHE`: Enable/disable Redis caching
- `USE_RATE_LIMITING`: Enable/disable API rate limiting

## Getting Started for New Developers

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables following `.env.example`
4. Start development server: `npm run dev`
5. Access the application at `http://localhost:3000`

## Contributing Guidelines

When contributing to this project:

1. Follow the existing code style and patterns
2. Document new features and changes
3. Write tests for new functionality
4. Update documentation when making significant changes

---

For questions or support, contact the project maintainers. 