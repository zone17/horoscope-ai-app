# Production Activation Checklist

**Project:** gettodayshoroscope.com — Video Content Engine
**Date:** April 10, 2026
**Status:** Code is done. Pipeline is built. Waiting on account setup.

---

## Step 1: Google Workspace ($7/mo) — 5 minutes

1. Go to **workspace.google.com** → Get Started
2. Business name: `Get Today's Horoscope`
3. Admin email: `hello@gettodayshoroscope.com`
4. Choose Business Starter ($7/mo)
5. It will give you MX records + a TXT verification record
6. Go to **Squarespace** → Domains → gettodayshoroscope.com → DNS Settings → Add the records Google gives you
7. Wait for verification (few minutes)
8. Send yourself a test email to `hello@gettodayshoroscope.com` to confirm it works

**Save to 1Password:** Google Workspace admin login

---

## Step 2: Social Accounts — 10 minutes

Create all 4 using `hello@gettodayshoroscope.com`
Phone for OTP: `585-204-0081`

### Instagram
- Go to instagram.com → Sign Up
- Username: `gettodayshoroscope` (or `dailyphilosophyai` if taken)
- After creating: Settings → Account → Switch to Professional → **Business** (must be Business, not Creator)
- Bio: `Your personal philosophy engine. Daily guidance from 50+ legendary thinkers. ✨`

### Facebook Page
- Go to facebook.com/pages/create
- Page name: `Get Today's Horoscope`
- Category: `Personal Blog`
- Link your Instagram Business account to this Page (Instagram Settings → Linked Accounts → Facebook)

### TikTok
- Go to tiktok.com → Sign Up
- Username: `gettodayshoroscope` (or `dailyphilosophyai` if taken)
- Bio: `Daily philosophical horoscopes for all 12 signs ✨`

### X (Twitter)
- Go to x.com → Sign Up
- Handle: `@gettodayshoroscope` (or `@dailyphilosophyai` if taken)
- Bio: `Your personal philosophy engine. Daily guidance from 50+ legendary thinkers.`

**Save ALL passwords to 1Password** as you create each account.

---

## Step 3: Ayrshare — 5 minutes

1. Go to **ayrshare.com** → Sign Up with `hello@gettodayshoroscope.com`
2. Start free trial or choose Business plan
3. Dashboard → **Social Accounts** → Link Accounts
   - Connect Instagram (authorize the Business account)
   - Connect TikTok (authorize)
   - Connect Facebook (select the Page, not personal profile)
   - Connect X/Twitter (authorize)
4. Verify all 4 show "Connected" in the dashboard
5. Dashboard → **API Key** → Copy the API key

**Save to 1Password:** Ayrshare login + API key

---

## Step 4: Send These Values to Claude

Open Claude Code and provide:

```
Ayrshare API key: [paste it]
Instagram username: [username]
TikTok username: [username]
Facebook page name: [name]
X handle: [handle]
All 4 connected in Ayrshare: yes/no
```

Use the `!` prefix when pasting the API key so it goes through your terminal, not the conversation.

---

## Step 5: Claude Does the Rest (< 2 minutes)

Once Claude has the API key, the following will be completed automatically:

1. Set `AYRSHARE_API_KEY` in GitHub Actions secrets
2. Set up Vercel Blob storage + `BLOB_READ_WRITE_TOKEN` secret
3. Uncomment the daily cron schedule in `.github/workflows/render-videos.yml`
4. Trigger a manual test run of the video pipeline
5. Verify Telegram notification arrives with sample video
6. Confirm social posts appear on all 4 platforms

---

## What's Already Done (No Action Needed)

- [x] Video rendering pipeline (Remotion, 60s, 1080x1920)
- [x] Edge-tts Ava voiceover (free, SRT-synced)
- [x] Quality gate (file size, duration, audio check)
- [x] Ayrshare posting integration (code ready)
- [x] GitHub Actions workflow (render-videos.yml)
- [x] Telegram bot token + chat ID in GitHub secrets
- [x] Resend email integration + DNS verified
- [x] UNSUBSCRIBE_SECRET configured
- [x] Daily archive pages + sitemap
- [x] Voice tuning ("open heart, open mind")

---

## Time Estimate

| Step | Time | Who |
|------|------|-----|
| Google Workspace | 5 min | You (browser) |
| Social accounts | 10 min | You (browser) |
| Ayrshare | 5 min | You (browser) |
| Send values | 1 min | You → Claude |
| Final setup | 2 min | Claude (automated) |
| **Total** | **~23 min** | |

---

## After Activation

Once the pipeline is live, the daily cycle runs autonomously:

```
Midnight UTC:  Readings generated for all 12 signs
1:00 AM UTC:   Videos rendered (voiceover + ambient + text sync)
1:30 AM UTC:   Quality gate checks each video
1:35 AM UTC:   Passed videos uploaded to Vercel Blob
1:40 AM UTC:   Posts scheduled via Ayrshare (7am, 11am, 3pm, 7pm ET)
1:45 AM UTC:   Telegram summary + sample video sent to you
```

Zero human intervention after initial setup. The product improves itself daily.

---

## Future: Agent-Native Architecture

Once this vertical slice is in production, refactor utilities into atomic MCP tools:

```
Current utility file        →  Future MCP tool
src/utils/voiceover.ts      →  voice:synthesize
src/utils/social-posting.ts →  social:post
src/utils/video-helpers.ts  →  video:render
src/utils/email.ts          →  email:send
```

Account creation itself becomes a tool: `social:create-account`. The manual checklist above becomes a single agent invocation. That's the goal — but shipping comes first.
