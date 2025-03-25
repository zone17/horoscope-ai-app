#!/bin/bash

# Script to deploy the fixed feature flag implementation

echo "Deploying fixed feature flags implementation"
echo "==========================================="

# Create temp directories
TEMP_DIR=$(mktemp -d)
echo "Created temporary directory: $TEMP_DIR"

mkdir -p $TEMP_DIR/frontend/src/utils
mkdir -p $TEMP_DIR/backend/src/utils

# Copy the fixed feature flags file
cp src/utils/feature-flags.ts $TEMP_DIR/frontend/src/utils/
cp src/utils/feature-flags.ts $TEMP_DIR/backend/src/utils/

echo "Copied fixed feature-flags.ts to deployment packages"

echo ""
echo "Please manually upload these files to Vercel:"
echo ""
echo "1. Frontend project (horoscope-ai-frontend):"
echo "   - Upload $TEMP_DIR/frontend/src/utils/feature-flags.ts to src/utils/feature-flags.ts"
echo ""
echo "2. Backend project (horoscope-ai-api):"
echo "   - Upload $TEMP_DIR/backend/src/utils/feature-flags.ts to src/utils/feature-flags.ts"
echo ""
echo "After uploading, redeploy both projects."
echo ""
echo "To verify the schema markup is working after redeployment, run:"
echo "./verify-schema-markup.sh" 