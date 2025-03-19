# Deployment Documentation

## Changes Made

The codebase has been updated to support a subdomain-based architecture with separate frontend and backend deployments:

1. **CORS Middleware**
   - Updated `middleware.ts` to handle CORS headers for API routes
   - Configured to allow requests from `https://www.gettodayshoroscope.com`
   - Set up preflight request handling for OPTIONS calls

2. **API Routes**
   - Removed hardcoded CORS headers from API routes
   - Now relying on centralized middleware for CORS handling

3. **Environment Configuration**
   - Created `.env.production` with settings for production deployment
   - Created `.env.development` with settings for local development
   - Updated `getBaseUrl()` function to use `NEXT_PUBLIC_API_URL` environment variable

4. **Next.js Config**
   - Added allowed origins for both www and api subdomains
   - Updated server actions configuration

5. **Deployment Scripts**
   - Created `scripts/deploy-api.sh` for deploying the backend
   - Created `scripts/deploy-frontend.sh` for deploying the frontend
   - Made scripts executable for use in terminal

6. **Documentation**
   - Updated README.md with deployment instructions
   - Added detailed steps for setting up domains and environment variables

## Architecture Separation

The application has been separated into two distinct deployments:

### Frontend (www.gettodayshoroscope.com)
- Contains only UI components and frontend logic
- Connects to the backend API via environment variables
- Uses API proxying via rewrites in vercel.json
- Dependencies:
  - Next.js
  - React
  - React DOM
  - No backend-specific dependencies like Redis or OpenAI

### Backend API (api.gettodayshoroscope.com)
- Contains all API endpoints and server-side logic
- Handles Redis caching and OpenAI integration
- Includes cron jobs for daily horoscope generation
- Dependencies:
  - Next.js (for API routes)
  - Redis (@upstash/redis, @vercel/kv)
  - OpenAI
  - No frontend-specific dependencies like React DOM

### Deployment Process

Each project has its own set of configuration files:

#### Frontend:
- package.frontend.json - Contains only frontend dependencies
- vercel.frontend.json - Contains frontend-specific Vercel configuration
- .env.frontend.production - Contains frontend environment variables
- scripts/deploy-frontend.sh - Deployment script for frontend

#### Backend:
- package.backend.json - Contains only backend dependencies
- vercel.backend.json - Contains backend-specific Vercel configuration
- .env.backend.production - Contains backend environment variables
- scripts/deploy-api.sh - Deployment script for backend API

### Clean Separation Benefits

1. Independent scaling - Each deployment can be scaled according to its needs
2. Focused dependencies - No unnecessary packages in each deployment
3. Simplified maintenance - Changes to one part don't require redeploying the other
4. Improved security - Backend has its own environment and configuration

### Cross-Origin Resource Sharing (CORS)

The middleware.ts file in the backend API explicitly allows requests from the frontend domain:
```typescript
// CORS headers for the frontend domain
response.headers.set('Access-Control-Allow-Origin', 'https://www.gettodayshoroscope.com');
```

This ensures proper security while allowing the necessary communication between frontend and backend.

## Next Steps

To complete the deployment process:

1. **Create Two Vercel Projects**
   - Backend API project: `api.gettodayshoroscope.com`
   - Frontend website project: `www.gettodayshoroscope.com`

2. **Configure Environment Variables**
   - Set up the environment variables listed in README.md for each project

3. **Deploy Projects**
   - Deploy backend first:
     ```
     ./scripts/deploy-api.sh
     ```
   - Then deploy frontend:
     ```
     ./scripts/deploy-frontend.sh
     ```

4. **Configure DNS**
   - Set up DNS records as instructed by Vercel
   - Verify domain ownership if required

5. **Test Deployment**
   - Visit `https://www.gettodayshoroscope.com`
   - Check browser console for any CORS or networking errors
   - Test all functionality, especially API calls

## Troubleshooting

If you encounter issues after deployment:

1. **CORS Errors**
   - Verify the `Access-Control-Allow-Origin` header in middleware.ts matches your actual frontend domain
   - Check that middleware is correctly applied to API routes

2. **API Connection Issues**
   - Verify the `NEXT_PUBLIC_API_URL` is correctly set in the frontend project
   - Test API endpoints directly to ensure they're accessible

3. **Redis Issues**
   - Check Redis environment variables are set correctly
   - Verify Redis service is running and accessible from the backend

4. **Domain Configuration**
   - Ensure DNS propagation is complete (can take up to 48 hours)
   - Verify Vercel domain settings match your DNS configuration 