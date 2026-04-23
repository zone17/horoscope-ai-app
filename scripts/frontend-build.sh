#!/bin/bash
# Frontend build: excludes API routes so they're proxied via Vercel rewrites.
# API routes live on api.gettodayshoroscope.com (separate Vercel project).

set -e

echo "Building frontend (API routes excluded)..."

# Move API routes and middleware out of build path
mkdir -p /tmp/horoscope-api-backup

if [ -d src/app/api ]; then
  mv src/app/api /tmp/horoscope-api-backup/
  echo "Moved API routes to temp backup"
fi

if [ -f src/middleware.ts ]; then
  mv src/middleware.ts /tmp/horoscope-api-backup/
  echo "Moved middleware to temp backup"
fi

# Build shared workspace packages first — @horoscope/shared exports a tsc-built
# dist/ that next build imports via src/tools/content/share-card.ts. Without this
# step, Vercel preview deploys fail with "Cannot find module '@horoscope/shared'".
echo "Building @horoscope/shared..."
npm run build --workspace=packages/shared

# Build
echo "Running Next.js build..."
npx next build

# Restore everything
if [ -d /tmp/horoscope-api-backup/api ]; then
  mv /tmp/horoscope-api-backup/api src/app/
  echo "Restored API routes"
fi

if [ -f /tmp/horoscope-api-backup/middleware.ts ]; then
  mv /tmp/horoscope-api-backup/middleware.ts src/
  echo "Restored middleware"
fi

rm -rf /tmp/horoscope-api-backup
echo "Frontend build completed"
