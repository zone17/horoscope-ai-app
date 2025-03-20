#!/bin/bash

# Script to test building the frontend locally

echo "Testing frontend build process"
echo "============================"

# Create a temp directory for the build test
TEMP_DIR=$(mktemp -d)
echo "Created temporary directory: $TEMP_DIR"

# Create necessary directory structure
mkdir -p $TEMP_DIR/src/app
mkdir -p $TEMP_DIR/public
mkdir -p $TEMP_DIR/src/components
mkdir -p $TEMP_DIR/src/utils
mkdir -p $TEMP_DIR/src/lib
mkdir -p $TEMP_DIR/src/hooks
mkdir -p $TEMP_DIR/src/styles

# Copy frontend code
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

# Copy styles
echo "Copying styles..."
cp -r src/styles/* $TEMP_DIR/src/styles/ 2>/dev/null || :

# Copy hooks and lib
echo "Copying hooks and utilities..."
cp -r src/hooks/* $TEMP_DIR/src/hooks/ 2>/dev/null || :
cp -r src/lib/* $TEMP_DIR/src/lib/ 2>/dev/null || :

# Copy utility files
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
cp tailwind.config.js $TEMP_DIR/ 2>/dev/null || :
cp tsconfig.json $TEMP_DIR/ 2>/dev/null || :
cp jsconfig.json $TEMP_DIR/ 2>/dev/null || :
cp next.config.js $TEMP_DIR/ 2>/dev/null || :
cp postcss.config.mjs $TEMP_DIR/ 2>/dev/null || :

# Create simple next.config.js if it doesn't exist
if [ ! -f "$TEMP_DIR/next.config.js" ]; then
  cat > $TEMP_DIR/next.config.js << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

module.exports = nextConfig;
EOF
fi

# Create package.json with all dependencies
cat > $TEMP_DIR/package.json << 'EOF'
{
  "name": "horoscope-frontend-test",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "@tanstack/react-query": "^5.24.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "framer-motion": "^11.0.8",
    "lucide-react": "^0.344.0",
    "next": "15.2.3",
    "next-themes": "^0.2.1",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "tailwind-merge": "^2.2.1",
    "tailwindcss-animate": "^1.0.7",
    "zustand": "^4.5.2"
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

# Create postcss.config.js if it doesn't exist
if [ ! -f "$TEMP_DIR/postcss.config.mjs" ]; then
  cat > $TEMP_DIR/postcss.config.mjs << 'EOF'
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOF
fi

# Create .env file
cat > $TEMP_DIR/.env << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:3000
EOF

# Navigate to the temp directory
cd $TEMP_DIR

# Install dependencies
echo "Installing dependencies..."
npm install

# Attempt to build
echo "Attempting to build..."
npm run build

# Show the build result
BUILD_RESULT=$?
if [ $BUILD_RESULT -eq 0 ]; then
  echo "✅ Build succeeded!"
else
  echo "❌ Build failed with exit code $BUILD_RESULT"
fi

# Return to the original directory
cd -

# Keep directory for inspection
echo ""
echo "Build test directory: $TEMP_DIR"
echo "You can inspect this directory for build issues."
echo "Once you're done, run: rm -rf $TEMP_DIR" 