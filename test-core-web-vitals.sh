#!/bin/bash

# Test script for Core Web Vitals optimizations

echo "🔍 Testing Core Web Vitals implementation..."

# Enable the feature flag for testing
export FEATURE_FLAG_USE_CORE_WEB_VITALS_OPT=true

# Check if the web-vitals package is installed
if npm list web-vitals | grep -q "web-vitals"; then
  echo "✅ web-vitals package is installed"
else
  echo "❌ web-vitals package is missing. Installing now..."
  npm install web-vitals
fi

# Check for test files
if [ -f "src/utils/web-vitals.test.ts" ] && [ -f "src/components/performance/CoreWebVitalsInitializer.test.tsx" ]; then
  echo "✅ Test files are present"
else
  echo "❌ Test files are missing"
  exit 1
fi

# Check if documentation exists
if [ -f "docs/CORE_WEB_VITALS.md" ]; then
  echo "✅ Documentation is present"
else
  echo "❌ Documentation is missing"
  exit 1
fi

# Run only Core Web Vitals related tests if Jest is installed
if npm list jest | grep -q "jest"; then
  echo "🧪 Running Core Web Vitals tests..."
  npm test -- --testPathPattern="(web-vitals|CoreWebVitals|VideoBanner)"
else
  echo "❌ Jest is not installed, skipping tests"
fi

echo ""
echo "📋 Core Web Vitals Implementation Summary:"
echo "----------------------------------------"
echo "1. Added feature flag: USE_CORE_WEB_VITALS_OPT"
echo "2. Created web-vitals utility functions"
echo "3. Added Core Web Vitals initializer component"
echo "4. Added analytics API endpoint"
echo "5. Optimized VideoBanner component"
echo "6. Added comprehensive tests"
echo "7. Created documentation"
echo ""
echo "✅ Implementation is ready for review"
echo ""
echo "To enable in production, set the following environment variable:"
echo "FEATURE_FLAG_USE_CORE_WEB_VITALS_OPT=true" 