#!/bin/bash

# Script to deploy a pure API backend to Vercel without any UI components

echo "Deploying API to api.gettodayshoroscope.com"
echo "============================================"

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "Error: Vercel CLI is not installed. Please install it first:"
    echo "npm install -g vercel"
    exit 1
fi

# Create a temp directory for deployment
TEMP_DIR=$(mktemp -d)
echo "Created temporary directory: $TEMP_DIR"

# Create the API-only directory structure
mkdir -p $TEMP_DIR/src/app/api
mkdir -p $TEMP_DIR/src/utils

# Copy only API routes
echo "Copying API routes..."
cp -r src/app/api/* $TEMP_DIR/src/app/api/

# Copy only backend utility files
echo "Copying backend utility files..."
cp -r src/utils/openai.ts $TEMP_DIR/src/utils/ 2>/dev/null || :
cp -r src/utils/redis.ts $TEMP_DIR/src/utils/ 2>/dev/null || :
cp -r src/utils/redis-helpers.ts $TEMP_DIR/src/utils/ 2>/dev/null || :
cp -r src/utils/tokens.ts $TEMP_DIR/src/utils/ 2>/dev/null || :
cp -r src/utils/date-utils.ts $TEMP_DIR/src/utils/ 2>/dev/null || :
cp -r src/utils/signs.ts $TEMP_DIR/src/utils/ 2>/dev/null || :
cp -r src/utils/feature-flags.ts $TEMP_DIR/src/utils/ 2>/dev/null || :
cp -r src/utils/horoscope-service.ts $TEMP_DIR/src/utils/ 2>/dev/null || :
cp -r src/utils/cache.ts $TEMP_DIR/src/utils/ 2>/dev/null || :
cp -r src/utils/cache-keys.ts $TEMP_DIR/src/utils/ 2>/dev/null || :

# Copy backend configuration files
echo "Copying configuration files..."
cp package.backend.json $TEMP_DIR/package.json
cp next.config.backend.js $TEMP_DIR/next.config.js

# Create a minimal Next.js app structure (no UI, just basic routing)
mkdir -p $TEMP_DIR/src/app
cat > $TEMP_DIR/src/app/layout.js << 'EOF'
export const metadata = {
  title: 'API Only',
  description: 'API Only Backend',
};

export default function RootLayout({ children }) {
  return children;
}
EOF

cat > $TEMP_DIR/src/app/page.js << 'EOF'
export default function Home() {
  return null;
}
EOF

# Create vercel.json for API configuration
cat > $TEMP_DIR/vercel.json << 'EOF'
{
  "version": 2,
  "framework": "nextjs",
  "buildCommand": "next build",
  "outputDirectory": ".next",
  "crons": [
    {
      "path": "/api/cron/generate-horoscopes",
      "schedule": "0 0 * * *"
    }
  ]
}
EOF

# Create .env file with environment variable placeholders
cat > $TEMP_DIR/.env.production << 'EOF'
# API-only environment variables
# Configure these in the Vercel dashboard
# UPSTASH_REDIS_REST_URL=
# UPSTASH_REDIS_REST_TOKEN=
# OPENAI_API_KEY=
# CRON_SECRET=
EOF

# Navigate to the temp directory
cd $TEMP_DIR

# Deploy to production
echo "Deploying API-only codebase..."
vercel deploy --prod \
  --name horoscope-ai-api \
  --yes

# Return to the original directory
cd -

# Clean up
echo "Cleaning up temporary directory..."
rm -rf $TEMP_DIR

echo ""
echo "Deployment completed."
echo "IMPORTANT: Configure the following environment variables in the Vercel dashboard:"
echo "  - UPSTASH_REDIS_REST_URL"
echo "  - UPSTASH_REDIS_REST_TOKEN"
echo "  - OPENAI_API_KEY"
echo "  - CRON_SECRET"
echo ""
echo "Don't forget to add the domain 'api.gettodayshoroscope.com' in the Vercel project settings." 