/**
 * OpenAI TTS voiceover generation for horoscope videos.
 * Uses tts-1 model with "nova" voice — warm, friendly tone.
 *
 * Never throws. Returns null on failure and logs the error.
 */

import fs from 'fs';
import path from 'path';

/**
 * Build the narration script from a reading's text components.
 * The "..." creates a natural pause in TTS output.
 */
export function buildNarrationScript(
  message: string,
  quote: string,
  quoteAuthor: string
): string {
  const parts = [message.trim()];
  const q = quote?.trim();
  const a = quoteAuthor?.trim();
  if (q && a) {
    parts.push(`... ${q} ... by ${a}`);
  }
  return parts.join(' ');
}

/**
 * Generate an MP3 voiceover file using OpenAI TTS.
 *
 * @param text - The narration script to speak
 * @param outputPath - Absolute path where the MP3 will be saved
 * @returns The outputPath on success, or null on failure
 */
export async function generateVoiceover(
  text: string,
  outputPath: string
): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn('[voiceover] OPENAI_API_KEY not set — skipping voiceover generation');
    return null;
  }

  try {
    // Dynamic import to avoid loading OpenAI in environments that don't need it
    const { default: OpenAI } = await import('openai');
    const openai = new OpenAI({ apiKey });

    // Ensure output directory exists
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const response = await openai.audio.speech.create({
      model: 'tts-1',
      voice: 'nova',
      input: text,
      response_format: 'mp3',
    });

    // Stream the response to a file
    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(outputPath, buffer);

    console.log(`[voiceover] Generated: ${outputPath} (${buffer.length} bytes)`);
    return outputPath;
  } catch (error) {
    console.error('[voiceover] Generation failed:', error instanceof Error ? error.message : error);
    return null;
  }
}
