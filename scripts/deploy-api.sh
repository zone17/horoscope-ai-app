#!/bin/bash

# Script to deploy the API backend to Vercel

echo "Deploying API backend to api.gettodayshoroscope.com"
echo "=================================================="

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "Error: Vercel CLI is not installed. Please install it first:"
    echo "npm install -g vercel"
    exit 1
fi

# Back up existing files
if [ -f vercel.json ]; then
    cp vercel.json vercel.json.bak
fi
if [ -f package.json ]; then
    cp package.json package.json.bak
fi
if [ -f .env.production ]; then
    cp .env.production .env.production.bak
fi

# Copy backend-specific files
cp vercel.backend.json vercel.json
cp package.backend.json package.json
cp .env.backend.production .env.production

echo "Using backend-specific configuration files"

# Deploy to production with API-specific configuration
vercel deploy --prod \
  --name horoscope-ai-api \
  --confirm

echo ""
echo "Deployment completed. Make sure to configure these environment variables in the Vercel dashboard:"
echo "- UPSTASH_REDIS_REST_URL"
echo "- UPSTASH_REDIS_REST_TOKEN" 
echo "- OPENAI_API_KEY"
echo "- CRON_SECRET (c8b2a1f5e7d3c6a9b2e5d8f1a4c7b3e6)"
echo ""
echo "Don't forget to add the domain 'api.gettodayshoroscope.com' in the Vercel project settings."

# Restore original files
if [ -f vercel.json.bak ]; then
    mv vercel.json.bak vercel.json
fi
if [ -f package.json.bak ]; then
    mv package.json.bak package.json
fi
if [ -f .env.production.bak ]; then
    mv .env.production.bak .env.production
fi 