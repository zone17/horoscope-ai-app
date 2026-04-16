/**
 * content:share-card — Re-export from shared package
 *
 * The canonical implementation lives in @horoscope/shared.
 * This re-export keeps the tool discoverable from src/tools/
 * and available to any future Next.js app consumer.
 */
export { generateShareCard } from '@horoscope/shared';
export type { ShareCardInput, ShareCardOutput } from '@horoscope/shared';
