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
const rawSign = signIndex >= 0 ? args[signIndex + 1]?.toLowerCase() : null;
const SINGLE_SIGN = rawSign && ENGAGEMENT_ORDER.includes(rawSign) ? rawSign : null;
if (rawSign && !SINGLE_SIGN) {
  console.error(`[error] Invalid sign: "${rawSign}". Must be one of: ${ENGAGEMENT_ORDER.join(', ')}`);
  process.exit(1);
}
const rampIndex = args.indexOf('--ramp');
const RAMP_COUNT = Math.min(Math.max(rampIndex >= 0 ? parseInt(args[rampIndex + 1], 10) || 4 : 4, 1), 12);

function parseSrt(srt: string): Array<{ startMs: number; endMs: number; text: string }> {
  const blocks = srt.trim().split(/\n\n+/);
  return blocks
    .map((block) => {
      const lines = block.split('\n');
      if (lines.length < 3) return null;
      const timeMatch = lines[1].match(/(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})/);
      if (!timeMatch) return null;
      const startMs = +timeMatch[1] * 3600000 + +timeMatch[2] * 60000 + +timeMatch[3] * 1000 + +timeMatch[4];
      const endMs = +timeMatch[5] * 3600000 + +timeMatch[6] * 60000 + +timeMatch[7] * 1000 + +timeMatch[8];
      const text = lines.slice(2).join(' ').trim();
      return { startMs, endMs, text };
    })
    .filter((c): c is { startMs: number; endMs: number; text: string } => c !== null);
}

function getTodayDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ============ Quality Gate ============

interface QualityResult {
  pass: boolean;
  reason?: string;
  summary: string;
  fileSizeMB: number;
  durationSec: number;
  hasAudio: boolean;
}

async function qualityCheck(
  videoPath: string,
  sign: string,
  voiceoverGenerated: boolean
): Promise<QualityResult> {
  const fileSizeBytes = fs.statSync(videoPath).size;
  const fileSizeMB = fileSizeBytes / (1024 * 1024);

  // Check 1: File size sanity (2-15 MB for a 60s video)
  if (fileSizeMB < 1) {
    return { pass: false, reason: 'File too small (<1 MB) — likely corrupted render', summary: '', fileSizeMB, durationSec: 0, hasAudio: false };
  }
  if (fileSizeMB > 20) {
    return { pass: false, reason: 'File too large (>20 MB) — abnormal render', summary: '', fileSizeMB, durationSec: 0, hasAudio: false };
  }

  // Check 2: Duration via ffprobe (must be 58-62 seconds)
  let durationSec = 0;
  let hasAudio = false;
  try {
    const { execFileSync } = await import('child_process');
    const probeResult = execFileSync('ffprobe', [
      '-v', 'quiet',
      '-print_format', 'json',
      '-show_format',
      '-show_streams',
      videoPath,
    ], { encoding: 'utf-8' });

    const probe = JSON.parse(probeResult);
    durationSec = parseFloat(probe.format?.duration ?? '0');
    hasAudio = probe.streams?.some((s: any) => s.codec_type === 'audio') ?? false;
  } catch {
    // ffprobe not available — skip duration/audio check but warn
    console.warn(`[quality] ffprobe not available — skipping duration/audio check for ${sign}`);
    return { pass: true, reason: undefined, summary: `${fileSizeMB.toFixed(1)} MB (ffprobe unavailable)`, fileSizeMB, durationSec: 0, hasAudio: voiceoverGenerated };
  }

  if (durationSec < 55 || durationSec > 65) {
    return { pass: false, reason: `Duration ${durationSec.toFixed(1)}s outside 55-65s range`, summary: '', fileSizeMB, durationSec, hasAudio };
  }

  // Check 3: Audio stream must exist if voiceover was generated
  if (voiceoverGenerated && !hasAudio) {
    return { pass: false, reason: 'Voiceover generated but no audio stream in output', summary: '', fileSizeMB, durationSec, hasAudio };
  }

  return {
    pass: true,
    summary: `${fileSizeMB.toFixed(1)} MB, ${durationSec.toFixed(1)}s, audio: ${hasAudio ? 'yes' : 'no'}`,
    fileSizeMB,
    durationSec,
    hasAudio,
  };
}

// ============ Telegram Notification ============

async function sendTelegramSummary(
  results: RenderResult[],
  today: string,
  sampleVideoPath?: string
) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!botToken || !chatId) {
    console.log('[telegram] TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set — skipping notification');
    return;
  }

  const successes = results.filter((r) => !r.error);
  const failures = results.filter((r) => r.error);

  const message = [
    `🎬 *Daily Video Pipeline — ${today}*`,
    '',
    `✅ Rendered: ${successes.length}/${results.length}`,
    failures.length > 0 ? `❌ Failed: ${failures.map((f) => `${f.sign} (${f.error})`).join(', ')}` : '',
    '',
    successes.length > 0 ? `Signs: ${successes.map((r) => r.sign).join(', ')}` : '',
    '',
    '_This is your daily spot-check. Reply if anything looks off._',
  ].filter(Boolean).join('\n');

  try {
    // Send text summary
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
      }),
    });

    // Send one sample video if available
    if (sampleVideoPath && fs.existsSync(sampleVideoPath)) {
      const FormData = (await import('node-fetch')).default ? undefined : globalThis.FormData;
      // Use curl for multipart upload (simpler than FormData in Node)
      const { execFileSync } = await import('child_process');
      execFileSync('curl', [
        '-s', '-X', 'POST',
        `https://api.telegram.org/bot${botToken}/sendVideo`,
        '-F', `chat_id=${chatId}`,
        '-F', `video=@${sampleVideoPath}`,
        '-F', `caption=Sample: ${path.basename(sampleVideoPath)}`,
      ], { timeout: 60000 });
      console.log('[telegram] Sent sample video');
    }

    console.log('[telegram] Summary sent');
  } catch (error) {
    console.warn('[telegram] Notification failed:', error instanceof Error ? error.message : error);
  }
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

    // 3. Generate voiceover (edge-tts, free) — outputs MP3 + SRT timing
    const { generateVoiceover, buildNarrationScript } = await import('../src/utils/voiceover');
    const narration = buildNarrationScript(sign, props.message, props.quote, props.quoteAuthor, props.peacefulThought);
    const voResult = await generateVoiceover(narration, tmpDir, sign);

    if (voResult) {
      // Copy audio to public/ so Remotion can load via staticFile()
      const publicVoPath = path.resolve('public', 'audio', `${sign}-voiceover.mp3`);
      fs.copyFileSync(voResult.audioPath, publicVoPath);
      props.voiceoverSrc = `audio/${sign}-voiceover.mp3`;
      (props as any).voiceoverDurationMs = voResult.durationMs;

      // Parse SRT for subtitle cues — drives text-voice sync
      if (fs.existsSync(voResult.subtitlePath)) {
        const srt = fs.readFileSync(voResult.subtitlePath, 'utf-8');
        const cues = parseSrt(srt);
        (props as any).subtitleCues = cues;
        console.log(`[render] Voiceover ready: ${(voResult.durationMs / 1000).toFixed(1)}s, ${cues.length} subtitle cues`);
      }
    } else {
      console.warn(`[render] Voiceover generation failed for ${sign} — rendering without audio`);
    }
    // Ambient music
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

    // 4b. Quality gate — reject bad renders before uploading
    const qc = await qualityCheck(videoPath, sign, !!voResult);
    if (!qc.pass) {
      console.error(`[quality] FAILED for ${sign}: ${qc.reason}`);
      return { sign, error: `Quality check failed: ${qc.reason}`, duration: Date.now() - start };
    }
    console.log(`[quality] ✓ ${sign}: ${qc.summary}`);

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
  const runId = Math.random().toString(36).substring(2, 8);
  const tmpDir = path.join(os.tmpdir(), `horoscope-videos-${today}-${runId}`);
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

  // Send Telegram summary + one sample video for spot-check
  const sampleVideo = successes.find((r) => r.videoPath)?.videoPath;
  await sendTelegramSummary(results, today, sampleVideo);

  // Clean up temp dir + voiceover files from public/audio/
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    // Remove voiceover MP3s copied to public/audio/ during rendering
    for (const sign of signs) {
      const voPath = path.resolve('public', 'audio', `${sign}-voiceover.mp3`);
      if (fs.existsSync(voPath)) fs.unlinkSync(voPath);
    }
  } catch {
    // Best effort cleanup
  }

  process.exit(failures.length > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('Pipeline crashed:', err);
  process.exit(1);
});
