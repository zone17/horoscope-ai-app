/**
 * Voiceover generation — ElevenLabs primary, edge-tts fallback.
 *
 * Primary path: ElevenLabs `eleven_multilingual_v2` via `convertWithTimestamps()`
 *   - Best-in-class narration quality (MOS 4.14, breath, prosody)
 *   - Returns char-level timestamps which we aggregate to true word
 *     boundaries — fixes the linear-interpolation karaoke approximation.
 *   - Configured via ELEVENLABS_API_KEY + ELEVENLABS_VOICE_ID.
 *
 * Fallback path: edge-tts (free, sentence-level SRT only)
 *   - Activates when ELEVENLABS_API_KEY is unset.
 *   - Used during local dev / when iterating on the composition without
 *     burning ElevenLabs credits.
 *
 * Output (both paths):
 *   { audioPath, subtitlePath, durationMs }
 *   plus optional `wordTimings` (only on the ElevenLabs path) for the
 *   composition's frame-accurate word reveal.
 */

import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

const VOICE = 'en-US-AvaMultilingualNeural';
const RATE = '-5%'; // Slightly slower for contemplative tone (edge-tts only)

/** Voice settings for ElevenLabs — calibrated for contemplative narration.
 *  stability 0.55 keeps the voice consistent without flattening prosody;
 *  similarityBoost 0.75 preserves voice character; style 0.30 introduces
 *  mild expressiveness without theatricality; speed 0.93 mirrors the
 *  edge-tts -5% rate. */
const ELEVENLABS_VOICE_SETTINGS = {
  stability: 0.55,
  similarity_boost: 0.75,
  style: 0.30,
  speed: 0.93,
  use_speaker_boost: true,
};

export interface WordTiming {
  text: string;
  startMs: number;
  endMs: number;
}

export interface VoiceoverResult {
  audioPath: string;
  subtitlePath: string;
  durationMs: number;
  /** Word-level timings (ElevenLabs path only). When undefined, callers
   *  should fall back to interpolating word reveal within cue duration. */
  wordTimings?: WordTiming[];
}

/**
 * Strip AI-tell punctuation patterns from text before TTS / display. The
 * reading prompt instructs Sonnet to avoid these but it doesn't follow
 * reliably; post-processing is the durable fix.
 *
 * Currently strips:
 *   - em-dashes (—) and en-dashes (–) used as parenthetical asides:
 *     replaced with period+space so the voice gets a natural sentence
 *     break instead of a suspended hanging beat
 *   - double spaces collapsed to single
 *   - leading/trailing whitespace
 */
export function sanitizeForVideo(text: string): string {
  if (!text) return text;
  return text
    // " — " or " – " or "—" (with no spaces) → ". "
    .replace(/\s*[—–]\s*/g, '. ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Per-video-type narration builders. Each video voices ONLY its own
 * content — morning doesn't say "guided by", quote doesn't read the
 * full reading, night doesn't add a CTA.
 */

/**
 * Speech-friendly date format. Input can be either an ISO date string
 * ("2026-04-28") or a pre-formatted display date ("April 28, 2026") —
 * we normalise to a Date and return "Tuesday, April 28th".
 */
export function formatDateForSpeech(dateInput: string): string {
  if (!dateInput) return '';
  // Try ISO first; fall back to Date constructor for "April 28, 2026" etc.
  let d: Date;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput.trim())) {
    d = new Date(dateInput + 'T12:00:00Z');
  } else {
    d = new Date(dateInput);
  }
  if (isNaN(d.getTime())) return dateInput;

  const dayOfWeek = d.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' });
  const month = d.toLocaleDateString('en-US', { month: 'long', timeZone: 'UTC' });
  const day = d.getUTCDate();
  const ordinal = (n: number): string => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };
  return `${dayOfWeek}, ${month} ${ordinal(day)}`;
}

/**
 * Morning narration: announce the sign and the day first, then transition
 * into the reading. Voice flows:
 *   "Aries. Tuesday, April 28th."
 *   <pause>
 *   "<reading body>"
 *
 * The double newline introduces a natural sentence break in TTS so the
 * shift from intro to reading reads as a deliberate transition, not a
 * run-on. The composition uses the cue boundaries from this script to
 * extend the hook scene through the intro and start the reading scene
 * exactly when the voice does.
 */
export function buildMorningNarration(
  sign: string,
  date: string,
  message: string,
): string {
  const s = sign.trim().toLowerCase();
  const signName = s.charAt(0).toUpperCase() + s.slice(1);
  const spokenDate = formatDateForSpeech(date);
  const intro = spokenDate ? `${signName}. ${spokenDate}.` : `${signName}.`;
  return `${intro}\n\n${sanitizeForVideo(message)}`;
}

/**
 * Quote narration: announce the moment, then read the quote, then read
 * the author. Voice flows:
 *   "Aries. Today's wisdom."
 *   <pause>
 *   "<quote>"
 *   <pause>
 *   "<author>."
 *
 * The composition pairs the voice intro with the visible TODAY'S WISDOM
 * hook, then reveals the full quote on screen with an active-word
 * highlight (karaoke) tracking the voice through the body.
 */
export function buildQuoteNarration(
  sign: string,
  quote: string,
  quoteAuthor: string,
): string {
  const s = sign.trim().toLowerCase();
  const signName = s.charAt(0).toUpperCase() + s.slice(1);
  const q = sanitizeForVideo(quote ?? '').replace(/^["“”']+|["“”']+$/g, '');
  const a = (quoteAuthor ?? '').trim();
  const lines: string[] = [`${signName}. Today's wisdom.`];
  if (q) lines.push(q);
  if (a) lines.push(`${a}.`);
  return lines.join('\n\n');
}

export function buildNightlyNarration(peacefulThought: string): string {
  return sanitizeForVideo(peacefulThought);
}

/**
 * Legacy single-video narration kept for backwards-compatibility with
 * any callers that still expect the old combined script. The 3-video
 * pipeline uses the per-type builders above; this should not be invoked
 * by render-and-post.ts in the split world.
 */
export function buildNarrationScript(
  sign: string,
  message: string,
  quote: string,
  quoteAuthor: string,
  peacefulThought: string,
): string {
  const s = sign.trim().toLowerCase();
  const signName = s.charAt(0).toUpperCase() + s.slice(1);
  const parts: string[] = [
    `${signName}.`,
    sanitizeForVideo(message),
  ];
  const q = sanitizeForVideo(quote ?? '');
  if (q && quoteAuthor) parts.push(`${q} ${quoteAuthor}.`);
  const p = sanitizeForVideo(peacefulThought ?? '');
  if (p) parts.push(p);
  return parts.join('\n\n');
}

/**
 * Generate voiceover. Tries ElevenLabs first if configured; falls back to
 * edge-tts. Returns null on failure (caller proceeds without audio).
 */
export async function generateVoiceover(
  text: string,
  outputDir: string,
  sign: string = 'reading',
): Promise<VoiceoverResult | null> {
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  if (process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_VOICE_ID) {
    try {
      return await generateVoiceoverElevenLabs(text, outputDir, sign);
    } catch (err) {
      console.warn(
        `[voiceover] ElevenLabs failed, falling back to edge-tts:`,
        err instanceof Error ? err.message : err,
      );
    }
  }

  return generateVoiceoverEdgeTts(text, outputDir, sign);
}

// ─── ElevenLabs path ────────────────────────────────────────────────────

async function generateVoiceoverElevenLabs(
  text: string,
  outputDir: string,
  sign: string,
): Promise<VoiceoverResult> {
  const { ElevenLabsClient } = await import('@elevenlabs/elevenlabs-js');
  const client = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY! });
  const voiceId = process.env.ELEVENLABS_VOICE_ID!;

  // SDK accepts settings under `voiceSettings` (camelCase) and the API
  // returns char-level alignment when calling the with-timestamps endpoint.
  const result = await client.textToSpeech.convertWithTimestamps(voiceId, {
    text,
    modelId: 'eleven_multilingual_v2',
    outputFormat: 'mp3_44100_128',
    voiceSettings: ELEVENLABS_VOICE_SETTINGS,
  });

  const audioPath = path.join(outputDir, `${sign}-voiceover.mp3`);
  if (!result.audioBase64) {
    throw new Error('ElevenLabs returned no audio');
  }
  fs.writeFileSync(audioPath, Buffer.from(result.audioBase64, 'base64'));

  const wordTimings = aggregateAlignmentToWords(result.alignment);
  const durationMs = wordTimings.length > 0
    ? wordTimings[wordTimings.length - 1].endMs
    : 0;

  // Write SRT for downstream consumers (cleanup, debugging) — the
  // composition prefers wordTimings when present.
  const subtitlePath = path.join(outputDir, `${sign}-voiceover.srt`);
  fs.writeFileSync(subtitlePath, wordsToSrt(wordTimings, text));

  console.log(
    `[voiceover] ElevenLabs ready: ${(durationMs / 1000).toFixed(1)}s, ${wordTimings.length} word timings`,
  );

  return { audioPath, subtitlePath, durationMs, wordTimings };
}

/**
 * Aggregate ElevenLabs char-level alignment into word boundaries. The
 * alignment shape is:
 *   { characters: string[], character_start_times_seconds: number[],
 *     character_end_times_seconds: number[] }
 * We walk the chars; each non-whitespace run becomes a word whose start
 * is the first char's start and end is the last char's end.
 */
function aggregateAlignmentToWords(
  alignment: unknown,
): WordTiming[] {
  if (!alignment || typeof alignment !== 'object') return [];
  // The official @elevenlabs/elevenlabs-js SDK normalizes the API's
  // snake_case fields to camelCase. Reading snake_case here returns
  // undefined → every word gets startMs/endMs of 0 → the composition's
  // active-word highlight collapses to "all words spoken at frame 0",
  // killing the karaoke effect. We accept both forms to be resilient
  // across SDK major versions / direct REST consumers.
  type Alignment = {
    characters?: string[];
    characterStartTimesSeconds?: number[];
    characterEndTimesSeconds?: number[];
    character_start_times_seconds?: number[];
    character_end_times_seconds?: number[];
  };
  const a = alignment as Alignment;
  const chars = a.characters ?? [];
  const starts = a.characterStartTimesSeconds ?? a.character_start_times_seconds ?? [];
  const ends = a.characterEndTimesSeconds ?? a.character_end_times_seconds ?? [];

  const words: WordTiming[] = [];
  let buf = '';
  let bufStart = 0;
  let bufEnd = 0;

  for (let i = 0; i < chars.length; i++) {
    const c = chars[i];
    const isWordChar = /\S/.test(c);
    if (isWordChar) {
      if (buf === '') bufStart = (starts[i] ?? 0) * 1000;
      buf += c;
      bufEnd = (ends[i] ?? starts[i] ?? 0) * 1000;
    } else if (buf !== '') {
      words.push({ text: buf, startMs: bufStart, endMs: bufEnd });
      buf = '';
    }
  }
  if (buf !== '') words.push({ text: buf, startMs: bufStart, endMs: bufEnd });
  return words;
}

/** Build a sentence-level SRT from word timings — used only for legacy
 *  consumers (debugging). The composition uses wordTimings directly. */
function wordsToSrt(words: WordTiming[], text: string): string {
  if (words.length === 0) return '';
  // Group by sentence-ending punctuation in the original text — best-effort.
  const fmt = (ms: number) => {
    const total = Math.round(ms);
    const hh = Math.floor(total / 3600000).toString().padStart(2, '0');
    const mm = Math.floor((total % 3600000) / 60000).toString().padStart(2, '0');
    const ss = Math.floor((total % 60000) / 1000).toString().padStart(2, '0');
    const ms3 = (total % 1000).toString().padStart(3, '0');
    return `${hh}:${mm}:${ss},${ms3}`;
  };
  const cues: Array<{ start: number; end: number; text: string }> = [];
  let start = words[0].startMs;
  let buf: string[] = [];
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    buf.push(w.text);
    const isEnd = /[.!?]$/.test(w.text) || i === words.length - 1;
    if (isEnd) {
      cues.push({ start, end: w.endMs, text: buf.join(' ') });
      buf = [];
      if (i + 1 < words.length) start = words[i + 1].startMs;
    }
  }
  return cues
    .map((c, i) => `${i + 1}\n${fmt(c.start)} --> ${fmt(c.end)}\n${c.text}\n`)
    .join('\n');
}

// ─── edge-tts fallback path ─────────────────────────────────────────────

async function generateVoiceoverEdgeTts(
  text: string,
  outputDir: string,
  sign: string,
): Promise<VoiceoverResult | null> {
  try {
    const audioPath = path.join(outputDir, `${sign}-voiceover.mp3`);
    const subtitlePath = path.join(outputDir, `${sign}-voiceover.srt`);

    await execFileAsync(
      'edge-tts',
      [
        '--voice', VOICE,
        // Joined form so `-5%` is not parsed as a separate flag by argparse.
        `--rate=${RATE}`,
        '--text', text,
        '--write-media', audioPath,
        '--write-subtitles', subtitlePath,
      ],
      { timeout: 90_000 },
    );

    let durationMs = 0;
    if (fs.existsSync(subtitlePath)) {
      const srt = fs.readFileSync(subtitlePath, 'utf-8');
      const matches = srt.match(/(\d{2}):(\d{2}):(\d{2}),(\d{3})/g);
      if (matches && matches.length > 0) {
        const last = matches[matches.length - 1];
        const parts = last.match(/(\d{2}):(\d{2}):(\d{2}),(\d{3})/);
        if (parts) {
          durationMs =
            +parts[1] * 3600000 +
            +parts[2] * 60000 +
            +parts[3] * 1000 +
            +parts[4];
        }
      }
    }

    console.log(
      `[voiceover] edge-tts ready: ${(durationMs / 1000).toFixed(1)}s (no word-level timings)`,
    );
    return { audioPath, subtitlePath, durationMs };
  } catch (err) {
    console.warn(
      '[voiceover] Generation failed:',
      err instanceof Error ? err.message : err,
    );
    return null;
  }
}
