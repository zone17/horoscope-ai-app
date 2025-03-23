# Deploying Timezone-Aware Content Generation

This document provides deployment instructions for enabling the timezone-aware content generation feature in the Horoscope AI application.

## Overview

The timezone-aware content generation feature allows the application to serve horoscopes based on the user's local date rather than UTC date. When a user from a particular timezone requests a horoscope and it doesn't exist for their local date, the system will generate horoscopes for all zodiac signs for that local date, optimizing API usage.

## Prerequisites

- Access to both frontend and backend Vercel deployments
- Administrator access to update environment variables
- Understanding of the dual deployment architecture (frontend/backend)

## Deployment Steps

### 1. Backend Deployment (api.gettodayshoroscope.com)

First, deploy the backend API with the new feature:

1. **Update Environment Variables**:
   - Log in to Vercel Dashboard for the backend deployment (horoscope-ai-api)
   - Navigate to Settings -> Environment Variables
   - Add or update the feature flag:
     ```
     FEATURE_FLAG_USE_TIMEZONE_CONTENT=true
     ```

2. **Deploy Backend Code**:
   ```bash
   # From project root
   cd horoscope-ai-app
   ./scripts/deploy-api.sh
   ```

3. **Verify API Deployment**:
   - Confirm successful deployment in Vercel Dashboard
   - Test the API endpoint with a timezone parameter:
     ```bash
     curl "https://api.gettodayshoroscope.com/api/horoscope?sign=libra&timezone=America/New_York"
     ```
   - Verify the response includes `"timezoneAware": true`

### 2. Frontend Deployment (www.gettodayshoroscope.com)

The frontend automatically detects user timezone and passes it to the API. Deploy the frontend after the backend is working:

1. **Deploy Frontend Code**:
   ```bash
   # From project root
   cd horoscope-ai-app
   ./scripts/deploy-frontend.sh
   ```

2. **Verify Frontend Deployment**:
   - Confirm successful deployment in Vercel Dashboard
   - Visit the website and open browser developer tools
   - Check network requests to see timezone parameter being sent to API
   - Verify the API response includes timezone information

## Verification Steps

After deployment, verify the feature is working correctly:

1. **Redis Cache Inspection**:
   - Visit `https://api.gettodayshoroscope.com/api/debug/redis`
   - Confirm horoscopes are stored with timezone-aware cache keys
   - The keys should include the user's local date, not the UTC date
   - Sample format: `horoscope-prod:horoscope:libra:localDate=2025-03-23:type=timezone-daily`

2. **Batch Generation Check**:
   - Clear Redis cache for testing (if possible)
   - Request a horoscope for a specific sign and timezone
   - Check the API response for `"batchGenerated": true`
   - Verify that horoscopes for all 12 zodiac signs were created in Redis

3. **Timezone Handling Test**:
   - Test with different timezones (e.g., America/New_York, Asia/Tokyo)
   - Verify that users in different timezones get content matching their local date

## Rollback Procedure

If issues occur with the timezone-aware content feature:

1. **Disable Feature Flag**:
   - Log in to Vercel Dashboard for the backend deployment
   - Navigate to Settings -> Environment Variables
   - Set the feature flag to false:
     ```
     FEATURE_FLAG_USE_TIMEZONE_CONTENT=false
     ```
   - Redeploy the backend

2. **Monitor System**:
   - Verify that the system reverts to UTC-based date handling
   - Check that horoscopes are being served correctly

## Monitoring

After deployment, monitor these metrics:

1. **API Usage**: Watch for significant changes in OpenAI API usage
2. **Response Times**: Ensure batch generation doesn't significantly impact response times
3. **Redis Storage**: Monitor increased Redis storage usage from multiple timezone-based caches

## Troubleshooting

Common issues and solutions:

1. **Timezone Not Detected**:
   - Check browser console for JavaScript errors
   - Verify `Intl.DateTimeFormat().resolvedOptions().timeZone` is working

2. **Batch Generation Failing**:
   - Check Vercel function logs for errors
   - Verify OpenAI API is responding correctly
   - Check for rate limiting issues

3. **Cache Keys Incorrect**:
   - Use debug endpoint to inspect cache keys
   - Verify local date calculation is correct

## Documentation

Ensure the following documentation is updated:

- ✅ `docs/TIMEZONE_CONTENT.md`: Technical documentation of the feature
- ✅ `docs/TIMEZONE_DEPLOYMENT.md`: This deployment guide
- ✅ Main README.md: Reference to timezone-aware feature

---

**Last Updated:** March 23, 2025 