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

# Copy frontend config to vercel.json
cp vercel.frontend.json vercel.json

echo "Using frontend-specific Vercel configuration"

# Create frontend-specific package.json without Redis dependencies
cat package.json | jq 'del(.dependencies."@upstash/redis") | del(.dependencies."@vercel/kv")' > package.json.frontend
mv package.json.frontend package.json

echo "Created frontend-specific package.json without Redis dependencies"

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