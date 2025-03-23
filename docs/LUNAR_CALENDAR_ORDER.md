# Lunar Calendar Zodiac Ordering

## Overview

This feature introduces the option to display zodiac signs in lunar calendar order instead of the traditional solar calendar order. This reordering provides a different perspective that aligns with lunar calendar traditions.

## Implementation Details

The implementation involves:

1. A feature flag `USE_LUNAR_ZODIAC_ORDER` to toggle between ordering systems
2. Two separate arrays for zodiac sign data in different orders
3. Conditional selection based on the feature flag state

**Note: This is a frontend-only feature that only affects the UI display order. No backend changes are required.**

## Ordering Comparison

### Traditional Zodiac Order (Solar Calendar)
1. Capricorn (Dec 22 - Jan 19)
2. Aquarius (Jan 20 - Feb 18)
3. Pisces (Feb 19 - Mar 20)
4. Aries (Mar 21 - Apr 19)
5. Taurus (Apr 20 - May 20)
6. Gemini (May 21 - Jun 20)
7. Cancer (Jun 21 - Jul 22)
8. Leo (Jul 23 - Aug 22)
9. Virgo (Aug 23 - Sep 22)
10. Libra (Sep 23 - Oct 22)
11. Scorpio (Oct 23 - Nov 21)
12. Sagittarius (Nov 22 - Dec 21)

### Lunar Calendar Order
1. Aquarius (Jan 20 - Feb 18)
2. Pisces (Feb 19 - Mar 20)
3. Aries (Mar 21 - Apr 19)
4. Taurus (Apr 20 - May 20)
5. Gemini (May 21 - Jun 20)
6. Cancer (Jun 21 - Jul 22)
7. Leo (Jul 23 - Aug 22)
8. Virgo (Aug 23 - Sep 22)
9. Libra (Sep 23 - Oct 22)
10. Scorpio (Oct 23 - Nov 21)
11. Sagittarius (Nov 22 - Dec 21)
12. Capricorn (Dec 22 - Jan 19)

The key difference is that the lunar calendar order starts with Aquarius as the first sign, which corresponds to the beginning of the lunar new year in many traditions, and continues through the zodiac cycle.

## Enabling the Feature

To enable this feature, you need to update the feature flag in your frontend environment:

### For Local Development
Update `.env.development`:
```
FEATURE_FLAG_USE_LUNAR_ZODIAC_ORDER=true
```

### For Production Deployment
Update `.env.frontend.production`:
```
FEATURE_FLAG_USE_LUNAR_ZODIAC_ORDER=true
```

Or update the environment variable in Vercel:
1. Go to your project in the Vercel dashboard
2. Navigate to Settings > Environment Variables
3. Add `FEATURE_FLAG_USE_LUNAR_ZODIAC_ORDER` with value `true`

## Testing

Tests have been created to verify that:
- The traditional order is used when the feature flag is off
- The lunar calendar order is used when the feature flag is on

To run the tests:
```
npm test src/components/zodiac/HoroscopeDisplay.test.tsx
```

## Considerations

This feature is purely presentational and does not affect:
- The content of horoscopes
- The API responses or backend functionality
- Core application performance

It provides an alternative viewing experience that may be preferred by users who follow lunar calendar traditions. 