#!/bin/bash

# Script to toggle the Core Web Vitals feature flag

# Display current status
echo "Current Core Web Vitals Feature Status:"
echo "-----------------------------------------"

# Check local development status
if grep -q "NEXT_PUBLIC_FEATURE_FLAG_USE_CORE_WEB_VITALS_OPTIMIZATIONS=true" .env.development; then
  echo "Development: ENABLED"
else
  echo "Development: DISABLED"
fi

# Check frontend production status
if grep -q "NEXT_PUBLIC_FEATURE_FLAG_USE_CORE_WEB_VITALS_OPTIMIZATIONS=true" .env.frontend.production; then
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
    if grep -q "NEXT_PUBLIC_FEATURE_FLAG_USE_CORE_WEB_VITALS_OPTIMIZATIONS=" .env.development; then
      # Replace existing line
      sed -i'' -e "s/NEXT_PUBLIC_FEATURE_FLAG_USE_CORE_WEB_VITALS_OPTIMIZATIONS=.*/NEXT_PUBLIC_FEATURE_FLAG_USE_CORE_WEB_VITALS_OPTIMIZATIONS=true/" .env.development
    else
      # Add new line
      echo "NEXT_PUBLIC_FEATURE_FLAG_USE_CORE_WEB_VITALS_OPTIMIZATIONS=true" >> .env.development
    fi
    echo "Core Web Vitals optimizations enabled in development"
    ;;
  2)
    # Disable in development
    if grep -q "NEXT_PUBLIC_FEATURE_FLAG_USE_CORE_WEB_VITALS_OPTIMIZATIONS=" .env.development; then
      # Replace existing line
      sed -i'' -e "s/NEXT_PUBLIC_FEATURE_FLAG_USE_CORE_WEB_VITALS_OPTIMIZATIONS=.*/NEXT_PUBLIC_FEATURE_FLAG_USE_CORE_WEB_VITALS_OPTIMIZATIONS=false/" .env.development
    else
      # Add new line
      echo "NEXT_PUBLIC_FEATURE_FLAG_USE_CORE_WEB_VITALS_OPTIMIZATIONS=false" >> .env.development
    fi
    echo "Core Web Vitals optimizations disabled in development"
    ;;
  3)
    # Enable in production
    if grep -q "NEXT_PUBLIC_FEATURE_FLAG_USE_CORE_WEB_VITALS_OPTIMIZATIONS=" .env.frontend.production; then
      # Replace existing line
      sed -i'' -e "s/NEXT_PUBLIC_FEATURE_FLAG_USE_CORE_WEB_VITALS_OPTIMIZATIONS=.*/NEXT_PUBLIC_FEATURE_FLAG_USE_CORE_WEB_VITALS_OPTIMIZATIONS=true/" .env.frontend.production
    else
      # Add new line
      echo "NEXT_PUBLIC_FEATURE_FLAG_USE_CORE_WEB_VITALS_OPTIMIZATIONS=true" >> .env.frontend.production
    fi
    echo "Core Web Vitals optimizations enabled in production"
    ;;
  4)
    # Disable in production
    if grep -q "NEXT_PUBLIC_FEATURE_FLAG_USE_CORE_WEB_VITALS_OPTIMIZATIONS=" .env.frontend.production; then
      # Replace existing line
      sed -i'' -e "s/NEXT_PUBLIC_FEATURE_FLAG_USE_CORE_WEB_VITALS_OPTIMIZATIONS=.*/NEXT_PUBLIC_FEATURE_FLAG_USE_CORE_WEB_VITALS_OPTIMIZATIONS=false/" .env.frontend.production
    else
      # Add new line
      echo "NEXT_PUBLIC_FEATURE_FLAG_USE_CORE_WEB_VITALS_OPTIMIZATIONS=false" >> .env.frontend.production
    fi
    echo "Core Web Vitals optimizations disabled in production"
    ;;
  5)
    echo "Exiting..."
    exit 0
    ;;
  *)
    echo "Invalid option"
    exit 1
    ;;
esac

# Make the script executable
chmod +x scripts/toggle-web-vitals.sh

echo ""
echo "Changes applied. You may need to restart your development server for changes to take effect." 