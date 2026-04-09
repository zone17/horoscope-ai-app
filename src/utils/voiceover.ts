/**
 * Voiceover generation using edge-tts (Microsoft Edge neural TTS).
 * Free, no API key, no limits. Uses Ava Multilingual voice.
 *
 * Also generates subtitle timing data (SRT) for text-voice sync.
 * Never throws. Returns null on failure and logs the error.
 */

import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execFileAsync = promisify(execFile);

const VOICE = 'en-US-AvaMultilingualNeural';
const RATE = '-5%'; // Slightly slower for contemplative tone

/**
 * Build the narration script from a reading's text components.
 * Uses periods and commas for natural pauses instead of "..." which
 * TTS engines handle inconsistently.
 */
/**
 * Build the full narration script covering all video scenes.
 * Each section separated by newlines for natural TTS pausing.
 */
export function buildNarrationScript(
  sign: string,
  message: string,
  quote: string,
  quoteAuthor: string,
  peacefulThought: string
): string {
  const signName = sign.charAt(0).toUpperCase() + sign.slice(1);
  const parts: string[] = [];

  // Hook (scene 1)
  parts.push(`${signName}. Stop scrolling.`);

  // Philosopher attribution (scene 1 continued)
  const a = quoteAuthor?.trim();
  if (a) {
    parts.push(`Guided by ${a}.`);
  }

  // Reading (scene 2)
  parts.push(message.trim());

  // Quote (scene 3)
  const q = quote?.trim();
  if (q && a) {
    parts.push(`${q}. ${a}.`);
  }

  // Peaceful thought (scene 4)
  const p = peacefulThought?.trim();
  if (p) {
    parts.push(p);
  }

  // CTA (scene 5)
  parts.push('Comment your sign below.');

  return parts.join('\n\n');
}

export interface VoiceoverResult {
  audioPath: string;
  subtitlePath: string;
  durationMs: number;
}

/**
 * Generate an MP3 voiceover + SRT subtitle file using edge-tts.
 *
 * @param text - The narration script to speak
 * @param outputDir - Directory to write files into
 * @param sign - Sign name (used for file naming)
 * @returns VoiceoverResult on success, or null on failure
 */
export async function generateVoiceover(
  text: string,
  outputDir: string,
  sign: string = 'reading'
): Promise<VoiceoverResult | null> {
  try {
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const audioPath = path.join(outputDir, `${sign}-voiceover.mp3`);
    const subtitlePath = path.join(outputDir, `${sign}-voiceover.srt`);

    await execFileAsync('edge-tts', [
      '--voice', VOICE,
      '--rate', RATE,
      '--text', text,
      '--write-media', audioPath,
      '--write-subtitles', subtitlePath,
    ], { timeout: 30000 });

    // Parse SRT to get total duration
    let durationMs = 0;
    if (fs.existsSync(subtitlePath)) {
      const srt = fs.readFileSync(subtitlePath, 'utf-8');
      const timeMatches = srt.match(/(\d{2}):(\d{2}):(\d{2}),(\d{3})/g);
      if (timeMatches && timeMatches.length > 0) {
        const last = timeMatches[timeMatches.length - 1];
        const [h, m, s, ms] = last.split(/[:,]/).map(Number);
        durationMs = h * 3600000 + m * 60000 + s * 1000 + ms;
      }
    }

    const fileSize = fs.statSync(audioPath).size;
    console.log(`[voiceover] Generated: ${audioPath} (${fileSize} bytes, ${(durationMs / 1000).toFixed(1)}s)`);

    return { audioPath, subtitlePath, durationMs };
  } catch (error) {
    console.error('[voiceover] Generation failed:', error instanceof Error ? error.message : error);
    return null;
  }
}
