# Research Program: SEO Optimization for gettodayshoroscope.com

## Goal
Optimize the SEO content configuration (seo-content.json) to maximize the SEO quality score.
The site is a daily AI-generated philosophical horoscope — "a philosopher in your corner, every morning."
Brand positioning: the thinking person's horoscope. Not fortune-telling, not wellness — philosophical guidance personalized by zodiac sign.

## What the Eval Measures (0-100 score across 9 dimensions)
1. Title tag (50-60 chars, keyword-first, contains "horoscope" + "today")
2. Meta description (150-160 chars, action words, keywords, emotional triggers, complete sentence)
3. H1 heading (contains "horoscope", "today", differentiator like "philosophical")
4. Intro copy (50-150 words, keywords, readability, value proposition, CTA)
5. Sign descriptions (20-50 words each, keyword variety, total 300+ words)
6. Internal linking (sign links, related content links, FAQ section)
7. CTA elements (email signup, push notifications, social sharing)
8. Content freshness (date signals, current astrological references)
9. Schema markup (WebSite, Article/CreativeWork, FAQPage, BreadcrumbList)

## Constraints
- Output must be valid JSON matching the existing schema
- Brand voice: philosophical, thoughtful, not clickbaity or spammy
- Never use generic horoscope language ("the stars say you will meet someone")
- Keep the "philosophical guidance, not predictions" positioning
- Sign descriptions must be unique per sign, reflecting each sign's personality
- Title must work for Google SERP display (not truncated)

## What to Try
- Add FAQ section with 3-5 common horoscope questions (boosts FAQPage schema opportunity)
- Add related_links (weekly horoscope, compatibility, zodiac elements guide)
- Add email_cta with compelling copy ("Your morning philosophy, delivered to your inbox")
- Add social_share and push_prompt flags
- Optimize title for click-through: curiosity + keyword + brand
- Make intro copy more compelling with a clear value proposition and CTA
- Add freshness signals (current astrological events, "updated daily")
- Ensure meta description hits 150-160 char sweet spot
- Add secondary_cta (bookmark, share, download app)

## What NOT to Try
- Don't make it sound like a generic horoscope site
- Don't stuff keywords unnaturally
- Don't exceed reasonable lengths (title >70 chars, meta >170 chars)
- Don't change the sign_links array (those are real routes)
- Don't remove existing schema types
