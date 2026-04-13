/**
 * content:distribute — Atomic tool
 *
 * Posts content to social platforms (TikTok, Instagram, Facebook, X)
 * via the Ayrshare API. Ported from src/utils/social-posting.ts with
 * per-platform error granularity.
 *
 * Input:  DistributeInput
 * Output: DistributeOutput
 *
 * Never throws. Returns per-platform success/failure results.
 */

// ─── Types ──────────────────────────────────────────────────────────────

export interface DistributeInput {
  /** Text content to post */
  content: string;
  /** Platforms to post to */
  platforms: ('tiktok' | 'instagram' | 'facebook' | 'x')[];
  /** Optional video/image URL */
  mediaUrl?: string;
  /** ISO 8601 date for scheduled posting */
  scheduleDate?: string;
}

export interface PlatformResult {
  success: boolean;
  postId?: string;
  error?: string;
}

export interface DistributeOutput {
  success: boolean;
  platformResults: Record<string, PlatformResult>;
}

// ─── Constants ──────────────────────────────────────────────────────────

const AYRSHARE_API_URL = 'https://app.ayrshare.com/api/post';

const VALID_PLATFORMS = new Set(['tiktok', 'instagram', 'facebook', 'x']);

// ─── Core Logic ─────────────────────────────────────────────────────────

/**
 * content:distribute
 *
 * Post content to one or more social platforms via Ayrshare.
 * Handles per-platform errors gracefully — a failure on one platform
 * does not block others (Ayrshare posts atomically but returns
 * per-platform status).
 *
 * @param input.content       - Text content to post
 * @param input.platforms     - Array of platform names
 * @param input.mediaUrl      - Optional media URL (video or image)
 * @param input.scheduleDate  - Optional ISO 8601 schedule date
 *
 * @returns { success, platformResults }
 */
export async function distribute(input: DistributeInput): Promise<DistributeOutput> {
  const { content, platforms, mediaUrl, scheduleDate } = input;

  // Validate inputs
  if (!content || content.trim().length === 0) {
    return buildErrorResult(platforms, 'Content is required');
  }

  if (!platforms || platforms.length === 0) {
    return { success: false, platformResults: {} };
  }

  const invalidPlatforms = platforms.filter((p) => !VALID_PLATFORMS.has(p));
  if (invalidPlatforms.length > 0) {
    return buildErrorResult(
      platforms,
      `Invalid platform(s): ${invalidPlatforms.join(', ')}`
    );
  }

  // Check API key
  const apiKey = process.env.AYRSHARE_API_KEY;
  if (!apiKey) {
    console.warn('[content:distribute] AYRSHARE_API_KEY not set — skipping post');
    return buildErrorResult(platforms, 'AYRSHARE_API_KEY not configured');
  }

  // Build request body — same shape as social-posting.ts
  const body: Record<string, unknown> = {
    post: content,
    platforms,
  };

  if (mediaUrl) {
    body.mediaUrls = [mediaUrl];
    // Ayrshare needs isVideo hint for video URLs
    if (isVideoUrl(mediaUrl)) {
      body.isVideo = true;
    }
  }

  if (scheduleDate) {
    body.scheduleDate = scheduleDate;
  }

  try {
    const response = await fetch(AYRSHARE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data?.message || data?.error || `HTTP ${response.status}`;
      console.error('[content:distribute] Ayrshare API error:', errorMsg);
      return buildErrorResult(platforms, errorMsg);
    }

    // Parse Ayrshare response into per-platform results
    const platformResults = parsePlatformResults(platforms, data);
    const allSucceeded = Object.values(platformResults).every((r) => r.success);

    console.log(
      `[content:distribute] Posted to ${platforms.join(', ')} — ` +
        `${allSucceeded ? 'all succeeded' : 'some failures'}`
    );

    return {
      success: allSucceeded,
      platformResults,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[content:distribute] Post failed:', msg);
    return buildErrorResult(platforms, msg);
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────

/**
 * Parse Ayrshare API response into per-platform results.
 * Ayrshare returns platform-specific data in different shapes depending
 * on success/failure. We normalize into a consistent structure.
 */
function parsePlatformResults(
  platforms: string[],
  data: Record<string, unknown>
): Record<string, PlatformResult> {
  const results: Record<string, PlatformResult> = {};

  for (const platform of platforms) {
    const platformData = data[platform] as Record<string, unknown> | undefined;

    if (platformData) {
      if (platformData.error || platformData.status === 'error') {
        results[platform] = {
          success: false,
          error: String(platformData.error || platformData.message || 'Unknown platform error'),
        };
      } else {
        results[platform] = {
          success: true,
          postId: platformData.id
            ? String(platformData.id)
            : platformData.postId
              ? String(platformData.postId)
              : undefined,
        };
      }
    } else {
      // Platform not in response — check top-level status
      if (data.status === 'success' || data.status === 'scheduled') {
        results[platform] = {
          success: true,
          postId: data.id ? String(data.id) : undefined,
        };
      } else {
        results[platform] = {
          success: false,
          error: 'No response data for platform',
        };
      }
    }
  }

  return results;
}

/**
 * Build a uniform error result for all platforms.
 */
function buildErrorResult(
  platforms: string[],
  error: string
): DistributeOutput {
  const platformResults: Record<string, PlatformResult> = {};
  for (const platform of platforms) {
    platformResults[platform] = { success: false, error };
  }
  return { success: false, platformResults };
}

/**
 * Simple heuristic to detect video URLs by extension.
 */
function isVideoUrl(url: string): boolean {
  const videoExtensions = ['.mp4', '.mov', '.avi', '.webm', '.mkv'];
  const lower = url.toLowerCase().split('?')[0];
  return videoExtensions.some((ext) => lower.endsWith(ext));
}
