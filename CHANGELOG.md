# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Timezone-aware horoscope generation feature flag in production environment
- Proper timezone handling for horoscope content generation
- Timezone-aware cache keys for better content delivery

### Changed
- Updated Vercel deployment configuration to include FEATURE_FLAG_USE_TIMEZONE_CONTENT
- Enhanced API responses to include timezone and local date information

### Technical Details
- Feature flag: FEATURE_FLAG_USE_TIMEZONE_CONTENT added to vercel.json
- Implementation verified in src/utils/feature-flags.ts
- Timezone handling confirmed in src/utils/timezone-utils.ts
- API route (src/app/api/horoscope/route.ts) updated to use timezone feature flag 