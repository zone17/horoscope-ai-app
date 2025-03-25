#!/bin/bash

# Script to deploy schema markup fix using existing deployment scripts

echo "Deploying schema markup fix"
echo "=========================="

# First, update the feature flags file in the source code
echo "Updating feature-flags.ts file..."

# Create temp directory to store original files in case of rollback
mkdir -p temp_backup
cp src/utils/feature-flags.ts temp_backup/ 2>/dev/null || :

# Modify deployment scripts to include schema flags
echo "Modifying deployment scripts to enable schema markup flags..."

# Backup the original deployment scripts
cp scripts/deploy-frontend.sh temp_backup/ 2>/dev/null || :
cp scripts/deploy-api.sh temp_backup/ 2>/dev/null || :

# Update frontend deployment script to enable schema markup
sed -i '' 's/"NEXT_PUBLIC_FEATURE_FLAG_USE_SCHEMA_MARKUP": "false"/"NEXT_PUBLIC_FEATURE_FLAG_USE_SCHEMA_MARKUP": "true"/g' scripts/deploy-frontend.sh
sed -i '' 's/FEATURE_FLAG_USE_SCHEMA_MARKUP=false/FEATURE_FLAG_USE_SCHEMA_MARKUP=true/g' scripts/deploy-api.sh

echo "Deployment scripts updated to enable schema markup"

# Deploy backend API
echo "Deploying backend API with schema markup enabled..."
./scripts/deploy-api.sh

# Deploy frontend
echo "Deploying frontend with schema markup enabled..."
./scripts/deploy-frontend.sh

echo ""
echo "Deployment completed. Please verify the schema markup using:"
echo "./verify-schema-markup.sh"
echo ""
echo "Note: Original files were backed up to ./temp_backup in case a rollback is needed." 