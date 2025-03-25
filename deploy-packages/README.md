# Schema Markup Enhancements Deployment

This package contains the schema markup enhancements for the horoscope application. It includes:

1. Enhanced schema types (HowTo and Event schemas)
2. Feature flag control for both base and enhanced schemas
3. Updated SchemaMarkup component for better error handling
4. Comprehensive test coverage

## Deployment Instructions

### Phased Deployment Approach

We recommend a phased deployment to minimize risk:

#### Phase 1: Deploy with Base Schema Only

1. Deploy the backend first:
   ```
   cd deploy-packages/backend
   vercel deploy --prod
   ```

2. Deploy the frontend with enhanced schemas disabled:
   ```
   cd deploy-packages/frontend
   vercel deploy --prod
   ```

3. Verify the base schema markup using Google's Rich Results Test:
   - Visit [Google Rich Results Test](https://search.google.com/test/rich-results)
   - Test your site URL
   - Verify the basic schema types appear correctly

#### Phase 2: Enable Enhanced Schemas

After 24-48 hours of successful operation with base schemas:

1. Update the feature flag in Vercel's dashboard:
   - Go to the Vercel project settings
   - Update environment variables:
     - Set `FEATURE_FLAG_USE_ENHANCED_SCHEMA_MARKUP=true`
     - Set `NEXT_PUBLIC_FEATURE_FLAG_USE_ENHANCED_SCHEMA_MARKUP=true`
   - Redeploy both frontend and backend

2. Verify the enhanced schemas using schema validation tools:
   - [Google Rich Results Test](https://search.google.com/test/rich-results)
   - [Schema.org Validator](https://validator.schema.org/)

## Feature Flags

### Backend Environment Variables
- `FEATURE_FLAG_USE_SCHEMA_MARKUP=true` - Controls whether any schema markup is generated
- `FEATURE_FLAG_USE_ENHANCED_SCHEMA_MARKUP=false` - Controls enhanced schema types

### Frontend Environment Variables
- `NEXT_PUBLIC_FEATURE_FLAG_USE_SCHEMA_MARKUP=true` - Controls client-side schema markup rendering
- `NEXT_PUBLIC_FEATURE_FLAG_USE_ENHANCED_SCHEMA_MARKUP=false` - Controls enhanced schema types

## Monitoring and Rollback

Monitor for any issues in:
- Search Console schema errors
- Application logs
- Performance metrics

If issues are detected, disable the enhanced schema feature first:
- Set `FEATURE_FLAG_USE_ENHANCED_SCHEMA_MARKUP=false`
- Set `NEXT_PUBLIC_FEATURE_FLAG_USE_ENHANCED_SCHEMA_MARKUP=false`

For critical issues, disable all schema markup:
- Set `FEATURE_FLAG_USE_SCHEMA_MARKUP=false`
- Set `NEXT_PUBLIC_FEATURE_FLAG_USE_SCHEMA_MARKUP=false` 