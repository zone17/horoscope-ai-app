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
 * Build the narration script. The voice reads ONLY content the script
 * passes — visual-only CTAs ("Stop scrolling", platform CTAs) live in
 * the composition, not the narration.
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
  const parts: string[] = [];

  parts.push(`${signName}.`);

  const a = quoteAuthor?.trim();
  if (a) parts.push(`Guided by ${a}.`);

  parts.push(message.trim());

  const q = quote?.trim();
  if (q && a) parts.push(`${q}. ${a}.`);

  const p = peacefulThought?.trim();
  if (p) parts.push(p);

  // Outro CTA — visual-only in the composition; not spoken aloud anymore.

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
  type Alignment = {
    characters?: string[];
    character_start_times_seconds?: number[];
    character_end_times_seconds?: number[];
  };
  const a = alignment as Alignment;
  const chars = a.characters ?? [];
  const starts = a.character_start_times_seconds ?? [];
  const ends = a.character_end_times_seconds ?? [];

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
