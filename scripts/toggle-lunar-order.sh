#!/bin/bash

# Script to toggle the lunar calendar ordering feature flag

# Display current status
echo "Current Lunar Calendar Order Feature Status:"
echo "-----------------------------------------"

# Check local development status
if grep -q "FEATURE_FLAG_USE_LUNAR_ZODIAC_ORDER=true" .env.development; then
  echo "Development: ENABLED"
else
  echo "Development: DISABLED"
fi

# Check frontend production status
if grep -q "FEATURE_FLAG_USE_LUNAR_ZODIAC_ORDER=true" .env.frontend.production; then
  echo "Production: ENABLED"
else
  echo "Production: DISABLED"
fi

echo ""
echo "What would you like to do?"
echo "1. Enable feature in development"
echo "2. Disable feature in development"
echo "3. Enable feature in production (updates .env.frontend.production)"
echo "4. Disable feature in production (updates .env.frontend.production)"
echo "5. Exit"

read -p "Enter choice [1-5]: " choice

case $choice in
  1)
    # Enable in development
    sed -i'' -e 's/FEATURE_FLAG_USE_LUNAR_ZODIAC_ORDER=false/FEATURE_FLAG_USE_LUNAR_ZODIAC_ORDER=true/g' .env.development
    echo "Feature enabled in development"
    ;;
  2)
    # Disable in development
    sed -i'' -e 's/FEATURE_FLAG_USE_LUNAR_ZODIAC_ORDER=true/FEATURE_FLAG_USE_LUNAR_ZODIAC_ORDER=false/g' .env.development
    echo "Feature disabled in development"
    ;;
  3)
    # Enable in production
    sed -i'' -e 's/FEATURE_FLAG_USE_LUNAR_ZODIAC_ORDER=false/FEATURE_FLAG_USE_LUNAR_ZODIAC_ORDER=true/g' .env.frontend.production
    echo "Feature enabled in production (remember to redeploy)"
    echo "Don't forget to update the Vercel environment variable as well!"
    ;;
  4)
    # Disable in production
    sed -i'' -e 's/FEATURE_FLAG_USE_LUNAR_ZODIAC_ORDER=true/FEATURE_FLAG_USE_LUNAR_ZODIAC_ORDER=false/g' .env.frontend.production
    echo "Feature disabled in production (remember to redeploy)"
    echo "Don't forget to update the Vercel environment variable as well!"
    ;;
  5)
    # Exit
    echo "Exiting without changes"
    exit 0
    ;;
  *)
    echo "Invalid option"
    exit 1
    ;;
esac

echo ""
echo "Done!" 