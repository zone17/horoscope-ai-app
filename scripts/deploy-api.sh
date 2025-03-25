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

# Create a temporary directory for deployment
TEMP_DIR=$(mktemp -d)
echo "Created temporary directory: $TEMP_DIR"

# Create necessary directories
mkdir -p "$TEMP_DIR/src/app/api"
mkdir -p "$TEMP_DIR/src/utils"

# Copy API routes
echo "Copying API routes..."
cp -r src/app/api/* "$TEMP_DIR/src/app/api/"

# Copy backend utility files
echo "Copying backend utility files..."
# Only copy backend-specific utilities
cp -r src/utils/redis.ts "$TEMP_DIR/src/utils/"
cp -r src/utils/feature-flags.ts "$TEMP_DIR/src/utils/"
cp -r src/utils/openai.ts "$TEMP_DIR/src/utils/"
cp -r src/utils/rate-limit.ts "$TEMP_DIR/src/utils/"

# Copy middleware in all possible locations to ensure it's picked up
echo "Copying middleware files..."
if [ -f "middleware.ts" ]; then
  cp middleware.ts "$TEMP_DIR/"
  echo "Copied root middleware.ts"
fi

if [ -f "src/middleware.ts" ]; then
  cp src/middleware.ts "$TEMP_DIR/src/"
  echo "Copied src/middleware.ts"
else
  # If src/middleware.ts doesn't exist but root middleware.ts does, copy it there too
  if [ -f "middleware.ts" ]; then
    mkdir -p "$TEMP_DIR/src"
    cp middleware.ts "$TEMP_DIR/src/"
    echo "Copied middleware.ts to src/ directory"
  fi
fi

# Copy configuration files
echo "Copying configuration files..."
cp .env.production "$TEMP_DIR/"
cp next.config.backend.js "$TEMP_DIR/next.config.js"
cp package.json "$TEMP_DIR/"
cp tsconfig.json "$TEMP_DIR/"
cp vercel.backend.json "$TEMP_DIR/vercel.json"

# Create minimal app layout
mkdir -p "$TEMP_DIR/src/app"
if [ ! -f "$TEMP_DIR/src/app/layout.js" ]; then
  echo "Creating minimal app layout..."
  echo "export default function RootLayout({ children }) { return children; }" > "$TEMP_DIR/src/app/layout.js"
  echo "export default function Page() { return <h1>API Only</h1>; }" > "$TEMP_DIR/src/app/page.js"
fi

# Create jsconfig.json if it doesn't exist
if [ ! -f "$TEMP_DIR/jsconfig.json" ] && [ ! -f "$TEMP_DIR/tsconfig.json" ]; then
  cat > $TEMP_DIR/jsconfig.json << 'EOF'
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
EOF
fi

# Create .env file
cat > $TEMP_DIR/.env.production << 'EOF'
# Redis configuration
UPSTASH_REDIS_REST_URL=${UPSTASH_REDIS_REST_URL:-"your-redis-url-here"}
UPSTASH_REDIS_REST_TOKEN=${UPSTASH_REDIS_REST_TOKEN:-"your-redis-token-here"}

# Feature flags
FEATURE_FLAG_USE_REDIS_CACHE=true
FEATURE_FLAG_USE_RATE_LIMITING=true
FEATURE_FLAG_USE_TIMEZONE_CONTENT=true
FEATURE_FLAG_USE_SCHEMA_MARKUP=true

# OpenAI
OPENAI_API_KEY=${OPENAI_API_KEY:-"your-openai-key-here"}

# Security
CRON_SECRET=${CRON_SECRET:-"your-cron-secret-here"}
EOF

# Navigate to the temp directory
cd $TEMP_DIR

# List all files for debugging
echo "Deployment directory contents:"
find . -type f | sort

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