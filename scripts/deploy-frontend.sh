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

# Copy frontend code (explicitly excluding API routes)
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

# Copy utility files (only frontend-related, explicitly excluding Redis/API utilities)
echo "Copying utility files..."
cp src/utils/horoscope-service.ts $TEMP_DIR/src/utils/
cp src/utils/feature-flags.ts $TEMP_DIR/src/utils/
cp src/utils/signs.ts $TEMP_DIR/src/utils/ 2>/dev/null || :
cp src/utils/date-utils.ts $TEMP_DIR/src/utils/ 2>/dev/null || :

# Copy images and assets
echo "Copying public assets..."
cp -r public/* $TEMP_DIR/public/ 2>/dev/null || :

# Fix CSS configuration
echo "Setting up proper Tailwind CSS configuration..."
cat > $TEMP_DIR/src/app/globals.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: #ffffff;
  --foreground: #171717;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0a;
    --foreground: #ededed;
  }
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-sans);
}

@layer utilities {
  .line-clamp-4 {
    display: -webkit-box;
    -webkit-line-clamp: 4;
    -webkit-box-orient: vertical;  
    overflow: hidden;
  }
  
  .backdrop-blur-lg {
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
  }
}
EOF

# Set up proper PostCSS config
cat > $TEMP_DIR/postcss.config.js << 'EOF'
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOF

# Copy config files
echo "Copying configuration files..."
cp package.frontend.json $TEMP_DIR/package.json
cp next.config.frontend.js $TEMP_DIR/next.config.js
cp tailwind.config.js $TEMP_DIR/ 2>/dev/null || :
cp tsconfig.json $TEMP_DIR/ 2>/dev/null || :
cp jsconfig.json $TEMP_DIR/ 2>/dev/null || :

# IMPORTANT: Do NOT create any API directories
echo "Ensuring no API routes are included..."

# Create vercel.json for frontend with explicit builds section
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
  ],
  "builds": [
    {
      "src": "next.config.js",
      "use": "@vercel/next"
    }
  ]
}
EOF

# Create .env file
cat > $TEMP_DIR/.env.production << 'EOF'
# Frontend production environment variables
NEXT_PUBLIC_API_URL=https://api.gettodayshoroscope.com
EOF

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

# Add packages for CSS processing
cat > $TEMP_DIR/package.json << 'EOF'
{
  "name": "horoscope-frontend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "^15.2.3",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/node": "^20.11.30",
    "@types/react": "^18.2.73",
    "@types/react-dom": "^18.2.22",
    "autoprefixer": "^10.4.19",
    "eslint": "^8.57.0",
    "eslint-config-next": "^15.2.3",
    "postcss": "^8.4.38",
    "tailwindcss": "^3.4.1",
    "typescript": "^5.4.2"
  }
}
EOF

# Navigate to the temp directory
cd $TEMP_DIR

# List all files for debugging
echo "Deployment directory contents:"
find . -type f | sort

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