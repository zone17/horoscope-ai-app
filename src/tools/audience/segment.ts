/**
 * audience:segment — Atomic tool
 *
 * Query subscribers by zodiac sign for targeted content delivery.
 * Uses Redis sign-specific sets (subscribers:{sign}) populated by
 * the subscribe tool, plus subscriber hashes for metadata.
 *
 * Input:  SegmentInput
 * Output: SegmentOutput
 *
 * Never throws. Returns { subscribers, count }.
 */

import { redis } from '@/utils/redis';
import { isValidSign } from '@/tools/zodiac/sign-profile';

// ─── Types ──────────────────────────────────────────────────────────────

export interface SegmentInput {
  /** Filter by zodiac sign. If omitted, returns all subscribers. */
  sign?: string;
}

export interface SubscriberRecord {
  email: string;
  sign?: string;
}

export interface SegmentOutput {
  subscribers: SubscriberRecord[];
  count: number;
}

// ─── Core Logic ─────────────────────────────────────────────────────────

/**
 * audience:segment
 *
 * Retrieve a list of subscribers, optionally filtered by zodiac sign.
 * When a sign is provided, reads from the sign-specific Redis set.
 * When no sign is provided, reads from the global subscribers:all set
 * and enriches with sign data from each subscriber hash.
 *
 * @param input.sign - Optional zodiac sign filter
 *
 * @returns { subscribers, count }
 */
export async function segment(input: SegmentInput): Promise<SegmentOutput> {
  const { sign } = input;

  // Validate sign if provided
  if (sign && !isValidSign(sign)) {
    return { subscribers: [], count: 0 };
  }

  try {
    if (sign) {
      return await segmentBySign(sign.toLowerCase());
    }
    return await segmentAll();
  } catch (err) {
    console.error('[audience:segment] Redis error:', err);
    return { subscribers: [], count: 0 };
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────

/**
 * Get all subscribers for a specific sign from the sign set.
 */
async function segmentBySign(sign: string): Promise<SegmentOutput> {
  const emails = await redis.smembers(`subscribers:${sign}`);

  if (!emails || emails.length === 0) {
    return { subscribers: [], count: 0 };
  }

  const subscribers: SubscriberRecord[] = emails.map((email) => ({
    email: String(email),
    sign,
  }));

  console.log(`[audience:segment] Found ${subscribers.length} subscribers for ${sign}`);

  return { subscribers, count: subscribers.length };
}

/**
 * Get all subscribers across all signs from the global set.
 * Enriches each with sign data from their subscriber hash.
 */
async function segmentAll(): Promise<SegmentOutput> {
  const emails = await redis.smembers('subscribers:all');

  if (!emails || emails.length === 0) {
    return { subscribers: [], count: 0 };
  }

  // Enrich with sign data — use pipeline-style fetches
  const subscribers: SubscriberRecord[] = [];

  for (const rawEmail of emails) {
    const email = String(rawEmail);
    try {
      const data = await redis.hgetall(`subscriber:${email}`);
      const record: SubscriberRecord = { email };
      if (data && typeof data === 'object') {
        const signValue = (data as Record<string, string>).sign;
        if (signValue) {
          record.sign = signValue;
        }
      }
      subscribers.push(record);
    } catch {
      // Individual fetch failure — include email without sign
      subscribers.push({ email });
    }
  }

  console.log(`[audience:segment] Found ${subscribers.length} total subscribers`);

  return { subscribers, count: subscribers.length };
}
