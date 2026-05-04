/**
 * Generate sample v2 readings for operator review.
 *
 * Demonstrates the new architecture: anonymous voice, sign × day × council
 * deep injection, auto-fail filters. Output saved to docs/research/ for
 * easy diff against the live readings snapshot at
 * docs/research/2026-04-29-live-readings-snapshot.md.
 */

import 'dotenv/config';
import { generateReadingV2 } from '../src/tools/reading/generate-v2';
import { selectQuote } from '../src/tools/reading/quote-select';
import { writeFileSync } from 'fs';
import { join } from 'path';

const COUNCIL_A = ['Marcus Aurelius', 'Pema Chödrön', 'Naval Ravikant', 'Thich Nhat Hanh', 'Seneca'];
const COUNCIL_B = ['Albert Camus', 'Mary Oliver', 'Eckhart Tolle', 'Viktor Frankl', 'Jiddu Krishnamurti'];

const DATE = '2026-05-01';

type Spec = { label: string; sign: string; council: string[]; timeOfDay: 'morning' | 'evening' };
const SPECS: Spec[] = [
  { label: 'Aries — Morning — Council A (Stoic+Buddhist+Operator)', sign: 'aries', council: COUNCIL_A, timeOfDay: 'morning' },
  { label: 'Aries — Evening — Council A', sign: 'aries', council: COUNCIL_A, timeOfDay: 'evening' },
  { label: 'Aries — Morning — Council B (Existentialist+Poet+Advaitic)', sign: 'aries', council: COUNCIL_B, timeOfDay: 'morning' },
  { label: 'Aries — Evening — Council B', sign: 'aries', council: COUNCIL_B, timeOfDay: 'evening' },
  { label: 'Cancer — Morning — Council A', sign: 'cancer', council: COUNCIL_A, timeOfDay: 'morning' },
  { label: 'Capricorn — Morning — Council A', sign: 'capricorn', council: COUNCIL_A, timeOfDay: 'morning' },
];

async function main() {
  const sections: string[] = [];
  sections.push('# Sample Readings v2 — Operator Review\n');
  sections.push(`Generated: ${new Date().toISOString()}`);
  sections.push(`Date used in prompt: ${DATE} (Friday, full moon, mid spring, Beltane, first day of month)`);
  sections.push(`Architecture: anonymous voice (Witness), sign x day-context x council-as-deep-vector, auto-fail filtered for dashes / anti-tells / buzzwords / length.`);
  sections.push(`Compare against live snapshot at docs/research/2026-04-29-live-readings-snapshot.md\n`);

  for (const spec of SPECS) {
    process.stdout.write(`Generating: ${spec.label} ... `);
    const reading = await generateReadingV2({
      sign: spec.sign,
      council: spec.council,
      date: DATE,
      timeOfDay: spec.timeOfDay,
    });
    const quote = selectQuote({
      sign: spec.sign,
      council: spec.council,
      date: DATE,
    });
    const wordCount = reading.text.trim().split(/\s+/).length;
    process.stdout.write(`${wordCount} words, ${reading.retries} retries\n`);

    sections.push(`---\n`);
    sections.push(`## ${spec.label}`);
    sections.push(`**Word count**: ${wordCount} | **Retries**: ${reading.retries} | **Council**: ${spec.council.join(', ')}\n`);
    sections.push(`### Reading\n${reading.text}\n`);
    sections.push(`### Quote (separate surface)\n> "${quote.text}"\n> — ${quote.quote_philosopher} (${quote.source})\n`);
  }

  const outPath = join(__dirname, '..', 'docs', 'research', '2026-05-01-sample-readings-v2.md');
  writeFileSync(outPath, sections.join('\n'));
  console.log(`\nWrote ${SPECS.length} samples to ${outPath}`);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
