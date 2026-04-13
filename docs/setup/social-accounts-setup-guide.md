# Social Media Account Setup Guide

**Project:** gettodayshoroscope.com — Automated Video Content Engine
**Purpose:** Create social media accounts and connect them to Ayrshare for automated daily video posting.

## What This Is

The site generates daily philosophical horoscope readings for all 12 zodiac signs. We've built a video pipeline that renders these into 60-second short-form videos and auto-posts them. This guide walks through creating the social accounts and connecting them.

## Step 1: Create Email Address (if needed)

Create a dedicated email for these accounts (or use an existing one):
- Suggested: `horoscope@gettodayshoroscope.com` or a Gmail address

## Step 2: Create Social Media Accounts

### Instagram (Business Account Required)
1. Download Instagram app or go to instagram.com
2. Sign up with the email above
3. Username suggestion: `gettodayshoroscope` or `dailyphilosophy`
4. After creating: go to Settings → Account → Switch to Professional Account → Business
5. Connect to a Facebook Page (Step 2c below creates this)
6. **Must be Business account** — Creator and Personal accounts can't use the posting API

### TikTok
1. Go to tiktok.com or download the app
2. Sign up with the email above
3. Username suggestion: `gettodayshoroscope` or `dailyphilosophy`
4. No special account type needed

### Facebook Page
1. Go to facebook.com/pages/create
2. Create a Page (not a personal profile)
3. Page name: "Get Today's Horoscope" or "Daily Philosophy"
4. Category: "Entertainment" or "Personal Blog"
5. This Page is what Instagram Business connects to

### X (Twitter)
1. Go to x.com/i/flow/signup
2. Sign up with the email above
3. Handle suggestion: `@gettodayshoroscope` or `@dailyphilosophy`

## Step 3: Sign Up for Ayrshare

Ayrshare is the service that posts videos to all 4 platforms with one API call.

1. Go to **ayrshare.com** → Sign Up
2. Choose the **Business plan** (required for video posting — $149/month, can start with free trial)
3. After signing up, go to the **Dashboard**

### Connect Social Accounts in Ayrshare
1. Dashboard → **Social Accounts** → **Link Accounts**
2. Click **Instagram** → Log in with the Instagram Business account → Authorize
3. Click **TikTok** → Log in with TikTok → Authorize
4. Click **Facebook** → Log in → Select the Facebook Page → Authorize
5. Click **Twitter/X** → Log in with X account → Authorize

### Get the API Key
1. Dashboard → **API Key** (or Settings → Developer)
2. Copy the API key — it looks like a long string
3. Send this key securely (NOT via regular email/text — use a password manager share or encrypted message)

## Step 4: Send These Values Back

After completing the above, send back:
- [ ] Ayrshare API key
- [ ] Confirmation that all 4 accounts are connected in Ayrshare dashboard
- [ ] The usernames/handles for each platform

## Step 5: What Happens Next (Automated)

Once we have the Ayrshare API key, we'll:
1. Add it to GitHub Actions secrets
2. Enable Vercel Blob storage
3. Run a test video render and post
4. Enable the daily cron (1am UTC automatic pipeline)

After that, 12 horoscope videos render and post daily with zero human intervention.

## Time Estimate

- Creating 4 accounts: ~15-20 minutes
- Ayrshare setup + connecting accounts: ~10 minutes
- Total: ~30 minutes

## Notes

- All accounts should use the same email for simplicity
- Instagram MUST be Business (not Creator or Personal)
- Facebook needs a Page (not a personal profile)
- Keep all passwords in a password manager
- The Ayrshare API key is the only thing that needs to come back to us
