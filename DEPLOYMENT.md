# Deployment Guide

## Overview

This project uses a split deployment strategy with separate frontend and backend deployments:

- Frontend: Deployed to `gettodayshoroscope.com`
- Backend API: Deployed to `api.gettodayshoroscope.com`

## Backend API Deployment

The backend is deployed as a pure API service without any UI components. This is handled by the `scripts/deploy-api.sh` script which:

1. Creates a temporary deployment directory
2. Copies only the necessary API components:
   - API routes from `src/app/api/*`
   - Backend utilities from `src/utils/*`
   - Middleware files
   - Configuration files (including `vercel.backend.json`)
3. Creates a minimal app layout to prevent frontend rendering:
   ```javascript
   // src/app/layout.js
   export default function RootLayout({ children }) { return children; }
   
   // src/app/page.js
   export default function Page() { return <h1>API Only</h1>; }
   ```
4. Deploys to Vercel with the correct configuration

### Important Notes

- Always use `vercel.backend.json` for API deployment
- The minimal app layout is required to prevent frontend content from being rendered
- Never modify the deployment script to remove the minimal app layout
- The backend deployment should never include frontend components or pages

### Deployment Command

```bash
./scripts/deploy-api.sh
```

### Required Environment Variables

The following environment variables must be configured in the Vercel dashboard:
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `OPENAI_API_KEY`
- `CRON_SECRET`

## Frontend Deployment

The frontend is deployed separately using `vercel.frontend.json` and includes:
- UI components
- Pages
- Client-side utilities
- Frontend-specific configuration

### Deployment Command

```bash
./scripts/deploy-frontend.sh
```

## Feature Flags

Feature flags are managed through environment variables in the respective Vercel configurations:

### Backend Feature Flags
```json
{
  "env": {
    "FEATURE_FLAG_USE_REDIS_CACHE": "true",
    "FEATURE_FLAG_USE_RATE_LIMITING": "true",
    "FEATURE_FLAG_USE_TIMEZONE_CONTENT": "true",
    "FEATURE_FLAG_USE_SCHEMA_MARKUP": "true"
  }
}
```

### Frontend Feature Flags
```json
{
  "env": {
    "FEATURE_FLAG_USE_TIMEZONE_CONTENT": "true",
    "FEATURE_FLAG_USE_SCHEMA_MARKUP": "true"
  }
}
```

## Troubleshooting

### Common Issues

1. Frontend Content in API Deployment
   - Ensure `vercel.backend.json` is being used
   - Verify the minimal app layout is present
   - Check that no frontend components are being copied

2. Feature Flag Issues
   - Verify flags are set in the correct Vercel project
   - Check that flags are enabled in both frontend and backend if needed
   - Ensure flag names match between frontend and backend

3. Deployment Failures
   - Check environment variables are properly set
   - Verify all required files are present
   - Check deployment logs for specific errors

## Best Practices

1. Always use the provided deployment scripts
2. Never modify the deployment scripts without testing
3. Keep frontend and backend configurations separate
4. Document any changes to deployment process
5. Test deployments in a staging environment first 