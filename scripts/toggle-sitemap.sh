#!/bin/bash

# Script to toggle the XML sitemap feature flag
# Usage: ./toggle-sitemap.sh [on|off]

# Set colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if an argument was provided
if [ $# -eq 0 ]; then
  echo -e "${RED}Error: No argument provided${NC}"
  echo -e "Usage: ./toggle-sitemap.sh [on|off]"
  exit 1
fi

# Check if the argument is valid
if [ "$1" != "on" ] && [ "$1" != "off" ]; then
  echo -e "${RED}Error: Invalid argument${NC}"
  echo -e "Usage: ./toggle-sitemap.sh [on|off]"
  exit 1
fi

# Set the value based on the argument
if [ "$1" = "on" ]; then
  VALUE="true"
  STATUS="enabled"
else
  VALUE="false"
  STATUS="disabled"
fi

# Flag name
FLAG_NAME="USE_XML_SITEMAP"

# Files to update
ENV_FILES=(".env.development" ".env.production" ".env.local")
VERCEL_FILES=("vercel.json" "vercel.frontend.json" "vercel.backend.json")

# Output header
echo -e "${YELLOW}=== Toggling XML Sitemap Feature Flag: ${STATUS} ===${NC}"

# Update .env files
for file in "${ENV_FILES[@]}"; do
  if [ -f "$file" ]; then
    # Check if the flag already exists in the file
    if grep -q "FEATURE_FLAG_${FLAG_NAME}" "$file"; then
      # Update existing flag
      sed -i'' -e "s/FEATURE_FLAG_${FLAG_NAME}=.*/FEATURE_FLAG_${FLAG_NAME}=${VALUE}/" "$file"
      echo -e "${GREEN}✓ Updated ${file}${NC}"
    else
      # Add new flag
      echo "FEATURE_FLAG_${FLAG_NAME}=${VALUE}" >> "$file"
      echo -e "${GREEN}✓ Added to ${file}${NC}"
    fi
  else
    echo -e "${YELLOW}⚠ File not found: ${file}${NC}"
  fi
done

# Update Vercel configuration files
for file in "${VERCEL_FILES[@]}"; do
  if [ -f "$file" ]; then
    # Check if the file has an "env" section
    if grep -q '"env":' "$file"; then
      # Check if the flag already exists in the file
      if grep -q "\"FEATURE_FLAG_${FLAG_NAME}\":" "$file"; then
        # Update existing flag
        sed -i'' -e "s/\"FEATURE_FLAG_${FLAG_NAME}\": \"[^\"]*\"/\"FEATURE_FLAG_${FLAG_NAME}\": \"${VALUE}\"/" "$file"
        echo -e "${GREEN}✓ Updated ${file}${NC}"
      else
        # Find the end of the env section and add the new flag before the closing brace
        sed -i'' -e "/\"env\": {/,/}/s/}/,\n    \"FEATURE_FLAG_${FLAG_NAME}\": \"${VALUE}\"\n  }/" "$file"
        echo -e "${GREEN}✓ Added to ${file}${NC}"
      fi
    else
      echo -e "${YELLOW}⚠ No env section in ${file}${NC}"
    fi
  else
    echo -e "${YELLOW}⚠ File not found: ${file}${NC}"
  fi
done

# Summary
echo -e "${GREEN}=== XML Sitemap Feature Flag ${STATUS} ===${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo -e "1. Run tests to verify the change: ${GREEN}npm test${NC}"
echo -e "2. Deploy the changes using deployment scripts"
echo -e "3. Verify the sitemap is accessible at ${GREEN}https://www.gettodayshoroscope.com/sitemap.xml${NC}"
if [ "$1" = "on" ]; then
  echo -e "4. Submit the sitemap to search engines via their webmaster tools"
fi

exit 0 