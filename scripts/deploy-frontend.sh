#!/bin/bash

# Script to deploy the frontend website to Vercel

echo "Deploying frontend to www.gettodayshoroscope.com"
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

# Copy frontend-specific files
cp vercel.frontend.json vercel.json
cp package.frontend.json package.json
cp .env.frontend.production .env.production

echo "Using frontend-specific configuration files"

# Deploy to production with frontend-specific configuration
vercel deploy --prod \
  --name horoscope-ai-frontend \
  --confirm

echo ""
echo "Deployment completed."
echo "Don't forget to add the domain 'www.gettodayshoroscope.com' in the Vercel project settings."
echo ""
echo "Test your deployment by visiting: https://www.gettodayshoroscope.com"

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