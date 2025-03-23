#!/bin/bash

# Script to toggle Core Web Vitals optimizations feature flag
# Usage: ./toggle-core-web-vitals.sh [on|off]

set -e

# Default to current state if no argument provided
ACTION=${1:-"status"}

# Define color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if .env files exist
if [ ! -f .env.development ] || [ ! -f .env.production ]; then
  echo -e "${RED}Error: .env files not found. Make sure you're in the project root.${NC}"
  exit 1
fi

# Function to check current status
check_status() {
  DEV_STATUS=$(grep "FEATURE_FLAG_USE_CORE_WEB_VITALS_OPT" .env.development | grep -q "true" && echo "enabled" || echo "disabled")
  PROD_STATUS=$(grep "FEATURE_FLAG_USE_CORE_WEB_VITALS_OPT" .env.production | grep -q "true" && echo "enabled" || echo "disabled")
  
  echo -e "${BLUE}Current Core Web Vitals status:${NC}"
  echo -e "  Development: ${DEV_STATUS}"
  echo -e "  Production: ${PROD_STATUS}"
  
  # Check Vercel config
  if [ -f vercel.frontend.json ]; then
    VERCEL_STATUS=$(grep "FEATURE_FLAG_USE_CORE_WEB_VITALS_OPT" vercel.frontend.json | grep -q "true" && echo "enabled" || echo "disabled")
    echo -e "  Vercel Frontend: ${VERCEL_STATUS}"
  fi
}

# Function to enable the feature
enable_feature() {
  # Update development environment
  sed -i'.bak' 's/FEATURE_FLAG_USE_CORE_WEB_VITALS_OPT=false/FEATURE_FLAG_USE_CORE_WEB_VITALS_OPT=true/g' .env.development
  # If the flag doesn't exist yet, add it
  if ! grep -q "FEATURE_FLAG_USE_CORE_WEB_VITALS_OPT" .env.development; then
    echo "FEATURE_FLAG_USE_CORE_WEB_VITALS_OPT=true" >> .env.development
  fi
  
  # Update production environment
  sed -i'.bak' 's/FEATURE_FLAG_USE_CORE_WEB_VITALS_OPT=false/FEATURE_FLAG_USE_CORE_WEB_VITALS_OPT=true/g' .env.production
  # If the flag doesn't exist yet, add it
  if ! grep -q "FEATURE_FLAG_USE_CORE_WEB_VITALS_OPT" .env.production; then
    echo "FEATURE_FLAG_USE_CORE_WEB_VITALS_OPT=true" >> .env.production
  fi
  
  # Update Vercel configuration if it exists
  if [ -f vercel.frontend.json ]; then
    # Use temp file for JSON editing
    cat vercel.frontend.json | jq '.env.FEATURE_FLAG_USE_CORE_WEB_VITALS_OPT = "true"' > vercel.frontend.json.tmp
    mv vercel.frontend.json.tmp vercel.frontend.json
  fi
  
  echo -e "${GREEN}Core Web Vitals optimization enabled in all environments${NC}"
  echo -e "${YELLOW}Note: Feature enabled in production (remember to redeploy)${NC}"
}

# Function to disable the feature
disable_feature() {
  # Update development environment
  sed -i'.bak' 's/FEATURE_FLAG_USE_CORE_WEB_VITALS_OPT=true/FEATURE_FLAG_USE_CORE_WEB_VITALS_OPT=false/g' .env.development
  
  # Update production environment
  sed -i'.bak' 's/FEATURE_FLAG_USE_CORE_WEB_VITALS_OPT=true/FEATURE_FLAG_USE_CORE_WEB_VITALS_OPT=false/g' .env.production
  
  # Update Vercel configuration if it exists
  if [ -f vercel.frontend.json ]; then
    # Use temp file for JSON editing
    cat vercel.frontend.json | jq '.env.FEATURE_FLAG_USE_CORE_WEB_VITALS_OPT = "false"' > vercel.frontend.json.tmp
    mv vercel.frontend.json.tmp vercel.frontend.json
  fi
  
  echo -e "${RED}Core Web Vitals optimization disabled in all environments${NC}"
  echo -e "${YELLOW}Note: Feature disabled in production (remember to redeploy)${NC}"
}

# Handle the requested action
case "$ACTION" in
  "on")
    enable_feature
    ;;
  "off")
    disable_feature
    ;;
  "status")
    check_status
    ;;
  *)
    echo -e "${RED}Invalid action. Use 'on', 'off', or no argument for status.${NC}"
    exit 1
    ;;
esac

# Clean up backup files
rm -f .env.development.bak .env.production.bak

# Final status check
check_status

echo -e "\n${BLUE}Next steps:${NC}"
echo "1. For development: restart dev server with 'npm run dev'"
echo "2. For production: redeploy with './scripts/deploy-frontend.sh'" 