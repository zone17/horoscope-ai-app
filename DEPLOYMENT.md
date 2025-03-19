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