#!/usr/bin/env npx tsx
/**
 * Daily Video Content Pipeline
 *
 * Renders 12 daily horoscope videos via Remotion and optionally posts to
 * social media via Ayrshare. Designed to run in GitHub Actions or locally.
 *
 * Usage:
 *   npx tsx scripts/render-and-post.ts              # Render all 12 + post top 4
 *   npx tsx scripts/render-and-post.ts --dry-run    # Preview without rendering
 *   npx tsx scripts/render-and-post.ts --sign scorpio  # Render single sign
 *   npx tsx scripts/render-and-post.ts --no-post    # Render only, skip posting
 *   npx tsx scripts/render-and-post.ts --ramp 6     # Post top 6 signs
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import fs from 'fs';
import path from 'path';
import os from 'os';

// Signs ordered by engagement priority (research-backed)
const ENGAGEMENT_ORDER = [
  'scorpio', 'leo', 'virgo', 'gemini',
  'aries', 'libra', 'pisces', 'cancer',
  'sagittarius', 'capricorn', 'aquarius', 'taurus',
];

// Posting time slots (ET → UTC offset: +4h in EDT)
const POST_TIMES_UTC = ['11:00', '15:00', '19:00', '23:00']; // 7am, 11am, 3pm, 7pm ET

interface RenderResult {
  sign: string;
  blobUrl?: string;
  voiceoverPath?: string;
  videoPath?: string;
  error?: string;
  duration?: number;
}

// Parse CLI args
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const NO_POST = args.includes('--no-post');
const signIndex = args.indexOf('--sign');
const SINGLE_SIGN = signIndex >= 0 ? args[signIndex + 1] : null;
const rampIndex = args.indexOf('--ramp');
const RAMP_COUNT = rampIndex >= 0 ? parseInt(args[rampIndex + 1], 10) : 4;

function getTodayDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

async function loadRedisHelpers() {
  const { horoscopeKeys } = await import('../src/utils/cache-keys');
  const { safelyRetrieveForUI } = await import('../src/utils/redis-helpers');
  return { horoscopeKeys, safelyRetrieveForUI };
}

async function renderSign(sign: string, today: string, tmpDir: string): Promise<RenderResult> {
  const start = Date.now();
  console.log(`\n[render] Starting: ${sign}`);

  try {
    // 1. Read cached reading from Redis
    const { horoscopeKeys, safelyRetrieveForUI } = await loadRedisHelpers();
    const cacheKey = horoscopeKeys.daily(sign, today);
    const reading = await safelyRetrieveForUI<any>(cacheKey);

    if (!reading) {
      console.warn(`[render] No cached reading for ${sign} on ${today} — skipping`);
      return { sign, error: 'No cached reading' };
    }

    // 2. Transform to video props
    const { getSignVideoProps } = await import('../src/utils/video-helpers');
    const props = getSignVideoProps(sign, reading);

    if (DRY_RUN) {
      console.log(`[dry-run] Would render ${sign}: ${JSON.stringify(props).substring(0, 100)}...`);
      return { sign, duration: Date.now() - start };
    }

    // 3. Generate voiceover
    const { generateVoiceover, buildNarrationScript } = await import('../src/utils/voiceover');
    const narration = buildNarrationScript(props.message, props.quote, props.quoteAuthor);
    const voiceoverPath = path.join(tmpDir, `${sign}-voiceover.mp3`);
    const voResult = await generateVoiceover(narration, voiceoverPath);

    // Update props with audio paths if available
    if (voResult) {
      props.voiceoverSrc = voiceoverPath;
    }
    // Ambient music — use static file path for Remotion
    props.ambientSrc = 'audio/ambient-lofi.mp3';

    // 4. Render video via Remotion
    console.log(`[render] Rendering video for ${sign}...`);
    const { bundle } = await import('@remotion/bundler');
    const { renderMedia, selectComposition } = await import('@remotion/renderer');

    const bundleLocation = await bundle({
      entryPoint: path.resolve('remotion/index.ts'),
      onBundleProgress: (progress: number) => {
        if (progress === 100) console.log(`[render] Bundle complete for ${sign}`);
      },
    });

    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: 'HoroscopeDaily',
      inputProps: props,
    });

    const videoPath = path.join(tmpDir, `${sign}-daily.mp4`);
    await renderMedia({
      composition,
      serveUrl: bundleLocation,
      codec: 'h264',
      outputLocation: videoPath,
      inputProps: props,
      pixelFormat: 'yuv420p',
      crf: 23,
    });

    const fileSize = fs.statSync(videoPath).size;
    console.log(`[render] Rendered ${sign}: ${videoPath} (${(fileSize / 1024 / 1024).toFixed(1)} MB)`);

    // 5. Upload to Vercel Blob
    let blobUrl: string | undefined;
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
    if (blobToken) {
      const { put } = await import('@vercel/blob');
      const videoBuffer = fs.readFileSync(videoPath);
      const blob = await put(`videos/${today}/${sign}.mp4`, videoBuffer, {
        access: 'public',
        token: blobToken,
      });
      blobUrl = blob.url;
      console.log(`[render] Uploaded to Blob: ${blobUrl}`);
    } else {
      console.warn('[render] BLOB_READ_WRITE_TOKEN not set — skipping upload');
    }

    return {
      sign,
      blobUrl,
      voiceoverPath: voResult ?? undefined,
      videoPath,
      duration: Date.now() - start,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[render] Failed for ${sign}:`, msg);
    return { sign, error: msg, duration: Date.now() - start };
  }
}

async function postVideos(results: RenderResult[], today: string) {
  if (NO_POST || DRY_RUN) {
    console.log(`\n[post] Skipping posting (${DRY_RUN ? '--dry-run' : '--no-post'})`);
    return;
  }

  const { postVideoToSocial, buildCaption, getHashtags } = await import('../src/utils/social-posting');
  const platforms = ['instagram', 'tiktok', 'facebook', 'twitter'];

  // Only post top N signs (ramp strategy)
  const toPost = results
    .filter((r) => r.blobUrl && !r.error)
    .sort((a, b) => ENGAGEMENT_ORDER.indexOf(a.sign) - ENGAGEMENT_ORDER.indexOf(b.sign))
    .slice(0, RAMP_COUNT);

  console.log(`\n[post] Posting ${toPost.length} videos (ramp: ${RAMP_COUNT})`);

  for (let i = 0; i < toPost.length; i++) {
    const result = toPost[i];
    const timeSlot = POST_TIMES_UTC[i % POST_TIMES_UTC.length];

    // Schedule for today at the time slot
    const scheduleDate = `${today}T${timeSlot}:00Z`;
    const hashtags = getHashtags(result.sign);
    const signName = result.sign.charAt(0).toUpperCase() + result.sign.slice(1);
    const hookLine = `Your daily philosophical guidance is here, ${signName}.`;
    const caption = buildCaption(result.sign, today, hookLine, hashtags);

    console.log(`[post] Scheduling ${result.sign} for ${scheduleDate}`);

    const postResult = await postVideoToSocial({
      videoUrl: result.blobUrl!,
      caption,
      hashtags,
      platforms,
      scheduleDate,
    });

    if (postResult.success) {
      console.log(`[post] ✓ ${result.sign} scheduled for ${timeSlot} UTC`);
    } else {
      console.error(`[post] ✗ ${result.sign} failed:`, postResult.errors);
    }
  }
}

async function cleanupOldBlobs() {
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
  if (!blobToken) return;

  try {
    const { list, del } = await import('@vercel/blob');
    const { blobs } = await list({ prefix: 'videos/', token: blobToken });

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const old = blobs.filter((b) => new Date(b.uploadedAt) < sevenDaysAgo);
    if (old.length > 0) {
      console.log(`[cleanup] Deleting ${old.length} blobs older than 7 days`);
      await del(old.map((b) => b.url), { token: blobToken });
    }
  } catch (error) {
    console.warn('[cleanup] Blob cleanup failed:', error instanceof Error ? error.message : error);
  }
}

async function main() {
  const today = getTodayDate();
  const tmpDir = path.join(os.tmpdir(), `horoscope-videos-${today}`);
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

  console.log(`\n========================================`);
  console.log(`  Horoscope Video Pipeline — ${today}`);
  console.log(`  Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
  console.log(`  Signs: ${SINGLE_SIGN ?? 'all 12'}`);
  console.log(`  Post: ${NO_POST || DRY_RUN ? 'NO' : `top ${RAMP_COUNT}`}`);
  console.log(`========================================\n`);

  const signs = SINGLE_SIGN ? [SINGLE_SIGN] : ENGAGEMENT_ORDER;
  const results: RenderResult[] = [];

  // Render serially to manage memory
  for (const sign of signs) {
    const result = await renderSign(sign, today, tmpDir);
    results.push(result);
  }

  // Post videos
  await postVideos(results, today);

  // Cleanup old blobs
  await cleanupOldBlobs();

  // Summary
  const successes = results.filter((r) => !r.error);
  const failures = results.filter((r) => r.error);
  const totalTime = results.reduce((sum, r) => sum + (r.duration ?? 0), 0);

  console.log(`\n========================================`);
  console.log(`  Pipeline Complete`);
  console.log(`  ✓ Rendered: ${successes.length}/${signs.length}`);
  console.log(`  ✗ Failed: ${failures.length}`);
  console.log(`  Total time: ${(totalTime / 1000 / 60).toFixed(1)} min`);
  if (failures.length > 0) {
    console.log(`  Failures: ${failures.map((f) => `${f.sign} (${f.error})`).join(', ')}`);
  }
  console.log(`========================================\n`);

  // Clean up temp dir
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch {
    // Best effort cleanup
  }

  process.exit(failures.length > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('Pipeline crashed:', err);
  process.exit(1);
});
