#!/bin/bash

# Script to deploy the frontend website to Vercel by creating a clean frontend-only directory

echo "Deploying frontend to www.gettodayshoroscope.com"
echo "=================================================="

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "Error: Vercel CLI is not installed. Please install it first:"
    echo "npm install -g vercel"
    exit 1
fi

# Create a temp directory for deployment
TEMP_DIR=$(mktemp -d)
echo "Created temporary directory: $TEMP_DIR"

# Create necessary directory structure
mkdir -p $TEMP_DIR/src/app
mkdir -p $TEMP_DIR/public
mkdir -p $TEMP_DIR/src/components
mkdir -p $TEMP_DIR/src/utils

# Copy frontend code (excluding API routes)
echo "Copying frontend files..."
cp -r src/app/page.tsx $TEMP_DIR/src/app/
cp -r src/app/layout.tsx $TEMP_DIR/src/app/
cp -r src/app/globals.css $TEMP_DIR/src/app/
cp -r src/app/favicon.ico $TEMP_DIR/src/app/ 2>/dev/null || :
cp -r src/app/not-found.tsx $TEMP_DIR/src/app/ 2>/dev/null || :
cp -r src/app/error.tsx $TEMP_DIR/src/app/ 2>/dev/null || :
cp -r src/app/loading.tsx $TEMP_DIR/src/app/ 2>/dev/null || :

# Copy components
echo "Copying components..."
cp -r src/components/* $TEMP_DIR/src/components/

# Copy utility files (only frontend-related)
echo "Copying utility files..."
cp src/utils/horoscope-service.ts $TEMP_DIR/src/utils/
cp src/utils/feature-flags.ts $TEMP_DIR/src/utils/
cp src/utils/signs.ts $TEMP_DIR/src/utils/ 2>/dev/null || :
cp src/utils/date-utils.ts $TEMP_DIR/src/utils/ 2>/dev/null || :

# Copy images and assets
echo "Copying public assets..."
cp -r public/* $TEMP_DIR/public/ 2>/dev/null || :

# Copy config files
echo "Copying configuration files..."
cp package.frontend.json $TEMP_DIR/package.json
cp next.config.js $TEMP_DIR/
cp tailwind.config.js $TEMP_DIR/ 2>/dev/null || :
cp postcss.config.js $TEMP_DIR/ 2>/dev/null || :

# Create a mock API proxy for local development (empty directory)
mkdir -p $TEMP_DIR/src/app/api

# Create vercel.json for frontend
cat > $TEMP_DIR/vercel.json << 'EOF'
{
  "version": 2,
  "framework": "nextjs",
  "buildCommand": "next build",
  "outputDirectory": ".next",
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://api.gettodayshoroscope.com/api/:path*"
    }
  ]
}
EOF

# Create .env file
cat > $TEMP_DIR/.env.production << 'EOF'
# Frontend production environment variables
NEXT_PUBLIC_API_URL=https://api.gettodayshoroscope.com
EOF

# Navigate to the temp directory
cd $TEMP_DIR

# Deploy to production
echo "Deploying frontend-only codebase..."
vercel deploy --prod \
  --name horoscope-ai-frontend \
  --yes

# Return to the original directory
cd -

# Clean up
echo "Cleaning up temporary directory..."
rm -rf $TEMP_DIR

echo ""
echo "Deployment completed."
echo "Don't forget to add the domain 'www.gettodayshoroscope.com' in the Vercel project settings."
echo ""
echo "Test your deployment by visiting: https://www.gettodayshoroscope.com" 