#!/bin/bash

# Script to build the frontend without API routes

echo "Building frontend application with API routes excluded..."

# Create temp directory for storing API routes
mkdir -p temp_api_backup

# Move API routes out of the way for frontend build
if [ -d src/app/api ]; then
  echo "Temporarily moving API routes out of build path..."
  mv src/app/api temp_api_backup/
fi

# Run the build command
echo "Running Next.js build..."
next build

# Restore API routes
if [ -d temp_api_backup/api ]; then
  echo "Restoring API routes..."
  mv temp_api_backup/api src/app/
fi

# Clean up
rm -rf temp_api_backup

echo "Frontend build completed" 