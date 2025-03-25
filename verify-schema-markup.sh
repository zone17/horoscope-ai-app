#!/bin/bash

# Script to verify schema markup implementation on the production site

echo "Verifying schema markup implementation"
echo "====================================="

echo "Fetching the production site HTML..."
curl -s https://www.gettodayshoroscope.com > site.html

# Check if schema markup (JSON-LD) is present
echo "Checking for JSON-LD schema markup..."
SCHEMA_COUNT=$(grep -c "application/ld+json" site.html)

if [ $SCHEMA_COUNT -gt 0 ]; then
  echo "✅ Schema markup found! ($SCHEMA_COUNT schema blocks detected)"
  
  # Extract and validate JSON-LD scripts
  echo "Extracting schema types..."
  echo ""
  
  # Create a temp file for the schema JSON
  mkdir -p tmp
  grep -o '<script type="application/ld+json">.*</script>' site.html > tmp/schemas.txt
  
  # Count schema types
  SCHEMAS_FOUND=()
  
  echo "Checking for base schema types:"
  BASE_SCHEMAS=("WebSite" "Organization" "Service" "ItemList" "FAQPage" "CreativeWork" "Article")
  
  for schema in "${BASE_SCHEMAS[@]}"; do
    if grep -q "\"@type\":\"$schema\"" tmp/schemas.txt; then
      echo "✅ Found: $schema"
      SCHEMAS_FOUND+=("$schema")
    else
      echo "❌ Missing: $schema"
    fi
  done
  
  echo ""
  echo "Checking for enhanced schema types:"
  ENHANCED_SCHEMAS=("HowTo" "Event")
  
  for schema in "${ENHANCED_SCHEMAS[@]}"; do
    if grep -q "\"@type\":\"$schema\"" tmp/schemas.txt; then
      echo "✅ Found: $schema (Enhanced schema enabled)"
      SCHEMAS_FOUND+=("$schema")
    else
      echo "ℹ️ Not found: $schema (Enhanced schema might be disabled)"
    fi
  done
  
  echo ""
  echo "Summary:"
  echo "--------"
  echo "Total schemas found: ${#SCHEMAS_FOUND[@]}"
  echo "Schema types detected: ${SCHEMAS_FOUND[*]}"
  
  if [[ " ${SCHEMAS_FOUND[*]} " =~ " HowTo " ]]; then
    echo "Status: Both base and enhanced schema markup are enabled"
  elif [ ${#SCHEMAS_FOUND[@]} -gt 0 ]; then
    echo "Status: Base schema markup is enabled, enhanced schema markup is disabled"
  fi
  
  echo ""
  echo "Next steps:"
  echo "1. Validate the schema with Google's Rich Results Test: https://search.google.com/test/rich-results"
  echo "2. If satisfied with base schema, enable enhanced schema by setting FEATURE_FLAG_USE_ENHANCED_SCHEMA_MARKUP=true"
  
  # Clean up
  rm -rf tmp
else
  echo "❌ No schema markup found on the site."
  echo ""
  echo "Possible issues:"
  echo "1. Feature flags might not be correctly set in Vercel"
  echo "2. The site may not have been redeployed after updating flags"
  echo "3. There might be an implementation issue with the SchemaMarkup component"
  echo ""
  echo "Next steps:"
  echo "1. Verify that FEATURE_FLAG_USE_SCHEMA_MARKUP=true in both frontend and backend"
  echo "2. Redeploy both projects from the Vercel dashboard"
  echo "3. Run this verification script again after deployment completes"
fi

# Clean up
rm -f site.html 