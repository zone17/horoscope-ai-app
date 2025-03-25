#!/bin/bash

# Script to update schema markup feature flags and redeploy

echo "Updating schema markup feature flags"
echo "===================================="

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "Error: Vercel CLI is not installed. Please install it first:"
    echo "npm install -g vercel"
    exit 1
fi

# Function to check if we need to enable enhanced schema
check_enhanced_flag() {
  if [[ "$1" == "--enhanced" ]]; then
    return 0  # true
  else
    return 1  # false
  fi
}

# Stage 1: Enable Base Schema Markup (FEATURE_FLAG_USE_SCHEMA_MARKUP=true)
echo "Stage 1: Enabling base schema markup"

# Set flags based on command line argument
check_enhanced_flag "$1"
ENABLE_ENHANCED=$?
ENHANCED_VALUE="false"

if [ $ENABLE_ENHANCED -eq 0 ]; then
  echo "Enhanced schema will also be enabled (Stage 2)"
  ENHANCED_VALUE="true"
fi

# Update environment variables in Vercel dashboard
echo "Please go to the Vercel dashboard and update the following environment variables:"
echo ""
echo "For the frontend project (horoscope-ai-frontend):"
echo "- NEXT_PUBLIC_FEATURE_FLAG_USE_SCHEMA_MARKUP = true"
echo "- NEXT_PUBLIC_FEATURE_FLAG_USE_ENHANCED_SCHEMA_MARKUP = $ENHANCED_VALUE"
echo ""
echo "For the backend project (horoscope-ai-api):"
echo "- FEATURE_FLAG_USE_SCHEMA_MARKUP = true"
echo "- FEATURE_FLAG_USE_ENHANCED_SCHEMA_MARKUP = $ENHANCED_VALUE"
echo ""
echo "Once you've updated the environment variables, redeploy both projects from the Vercel dashboard."
echo ""

read -p "Would you like to open the Vercel dashboard now? (y/n) " OPEN_DASHBOARD

if [[ "$OPEN_DASHBOARD" =~ ^[Yy]$ ]]; then
  echo "Opening Vercel dashboard..."
  open https://vercel.com/dashboard
fi

echo ""
echo "After deployment, please verify the schema markup using Google's Rich Results Test:"
echo "https://search.google.com/test/rich-results"
echo ""
echo "Enter the URL: https://www.gettodayshoroscope.com"
echo ""
echo "Expected schema types in the results:"
echo "- WebSite"
echo "- Organization"
echo "- Service"
echo "- ItemList"
echo "- FAQPage"
echo "- CreativeWork/Article"

if [ $ENABLE_ENHANCED -eq 0 ]; then
  echo "- HowTo"
  echo "- Event"
fi 