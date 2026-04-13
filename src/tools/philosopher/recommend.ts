/**
 * philosopher:recommend — Atomic tool
 *
 * Recommends philosophers for a zodiac sign based on element-to-tradition
 * affinity. Designed for the onboarding flow so new users get a curated
 * starting council that resonates with their sign's personality.
 *
 * Input:  { sign, count? }
 * Output: { recommended: Array<{ name, reason }> }
 *
 * Logic:
 *   - Map sign element to high-affinity traditions
 *   - Pick top (count - 1) from matching traditions
 *   - Add 1 "wildcard" from a non-matching tradition for diversity
 *   - Each recommendation includes a personalized reason
 */

import {
  type Philosopher,
  Tradition,
  listPhilosophers,
  getAllPhilosophers,
} from '@/tools/philosopher/registry';
import {
  getSignProfile,
  isValidSign,
  VALID_SIGNS,
  type SignProfile,
} from '@/tools/zodiac/sign-profile';

// ─── Types ──────────────────────────────────────────────────────────────

export interface RecommendInput {
  sign: string;
  count?: number; // default 5
}

export interface PhilosopherRecommendation {
  name: string;
  reason: string;
}

export interface RecommendOutput {
  recommended: PhilosopherRecommendation[];
}

// ─── Element-to-Tradition Affinity Map ──────────────────────────────────

const ELEMENT_TRADITIONS: Record<SignProfile['element'], Tradition[]> = {
  Fire: [Tradition.Stoicism, Tradition.PoetrySoul],
  Earth: [Tradition.Stoicism, Tradition.ScienceWonder],
  Air: [Tradition.Classical, Tradition.Contemporary, Tradition.Existentialism],
  Water: [Tradition.EasternWisdom, Tradition.SpiritualLeaders, Tradition.PoetrySoul],
};

// ─── Sign-Specific Reason Templates ─────────────────────────────────────

const ELEMENT_REASONS: Record<SignProfile['element'], Record<string, string>> = {
  Fire: {
    [Tradition.Stoicism]:
      'Stoic discipline channels your fire into focused, unstoppable action.',
    [Tradition.PoetrySoul]:
      'Their poetic vision matches your creative energy and passion for meaning.',
  },
  Earth: {
    [Tradition.Stoicism]:
      'Stoic pragmatism aligns with your grounded, results-oriented nature.',
    [Tradition.ScienceWonder]:
      'Their spirit of inquiry resonates with your love of tangible, provable truth.',
  },
  Air: {
    [Tradition.Classical]:
      'Classical depth feeds your hunger for rigorous, layered thinking.',
    [Tradition.Contemporary]:
      'Their systems thinking mirrors how you naturally see connections everywhere.',
    [Tradition.Existentialism]:
      'Existential questions energize your restless intellectual curiosity.',
  },
  Water: {
    [Tradition.EasternWisdom]:
      'Eastern wisdom honors the emotional depth and intuition you navigate by.',
    [Tradition.SpiritualLeaders]:
      'Their inner journey mirrors your instinct to explore beneath the surface.',
    [Tradition.PoetrySoul]:
      'Poetic language speaks to the part of you that feels what words can barely hold.',
  },
};

const WILDCARD_REASON_PREFIX = 'A surprising pairing:';

// ─── Helpers ────────────────────────────────────────────────────────────

/**
 * Deterministic shuffle using sign name as seed.
 * Ensures the same sign always gets the same ordering, but different signs
 * get different orderings — so recommendations feel personalized.
 */
function seededShuffle<T>(arr: T[], seed: string): T[] {
  const result = [...arr];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  }
  for (let i = result.length - 1; i > 0; i--) {
    hash = ((hash << 5) - hash + i) | 0;
    const j = Math.abs(hash) % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function buildReason(
  philosopher: Philosopher,
  element: SignProfile['element'],
  isWildcard: boolean,
): string {
  if (isWildcard) {
    return `${WILDCARD_REASON_PREFIX} ${philosopher.name}'s ${philosopher.tradition.toLowerCase()} perspective offers a fresh lens that complements your ${element.toLowerCase()} sign energy.`;
  }

  const traditionKey = philosopher.tradition as string;
  const templateReason = ELEMENT_REASONS[element]?.[traditionKey];
  if (templateReason) {
    return templateReason;
  }
  // Fallback for traditions that match but don't have a specific template
  return `${philosopher.tradition} wisdom pairs naturally with your ${element.toLowerCase()} sign temperament.`;
}

// ─── Core Logic ─────────────────────────────────────────────────────────

function getMatchingPhilosophers(
  element: SignProfile['element'],
  sign: string,
): Philosopher[] {
  const affinityTraditions = ELEMENT_TRADITIONS[element];
  const allMatching: Philosopher[] = [];
  for (const tradition of affinityTraditions) {
    allMatching.push(...listPhilosophers({ tradition }));
  }
  return seededShuffle(allMatching, sign);
}

function getWildcardPhilosophers(
  element: SignProfile['element'],
  sign: string,
  excludeNames: Set<string>,
): Philosopher[] {
  const affinityTraditions = new Set(ELEMENT_TRADITIONS[element]);
  const wildcards = getAllPhilosophers().filter(
    (p) => !affinityTraditions.has(p.tradition) && !excludeNames.has(p.name),
  );
  return seededShuffle(wildcards, sign + '-wildcard');
}

// ─── Public API ─────────────────────────────────────────────────────────

/**
 * philosopher:recommend
 *
 * Recommend philosophers for a zodiac sign based on element affinity.
 *
 * @param input.sign   - Zodiac sign (case-insensitive)
 * @param input.count  - How many to recommend (default 5, min 1, max 20)
 *
 * @returns { recommended: Array<{ name, reason }> }
 *
 * @throws if sign is invalid
 */
export function recommendPhilosophers(input: RecommendInput): RecommendOutput {
  const sign = input.sign.toLowerCase();
  if (!isValidSign(sign)) {
    throw new Error(
      `Invalid sign: "${input.sign}". Valid signs: ${VALID_SIGNS.join(', ')}`,
    );
  }

  const count = Math.max(1, Math.min(input.count ?? 5, 20));
  const profile = getSignProfile(sign);
  const element = profile.element;

  // Get affinity-matched philosophers
  const matching = getMatchingPhilosophers(element, sign);

  // Reserve 1 slot for wildcard (if count > 1)
  const affinitySlots = count > 1 ? count - 1 : count;
  const picks: PhilosopherRecommendation[] = [];
  const pickedNames = new Set<string>();

  // Fill affinity slots
  for (const p of matching) {
    if (picks.length >= affinitySlots) break;
    if (pickedNames.has(p.name)) continue;
    pickedNames.add(p.name);
    picks.push({
      name: p.name,
      reason: buildReason(p, element, false),
    });
  }

  // Fill wildcard slot(s)
  if (count > 1) {
    const wildcards = getWildcardPhilosophers(element, sign, pickedNames);
    for (const p of wildcards) {
      if (picks.length >= count) break;
      if (pickedNames.has(p.name)) continue;
      pickedNames.add(p.name);
      picks.push({
        name: p.name,
        reason: buildReason(p, element, true),
      });
    }
  }

  // If we still don't have enough (unlikely), backfill from remaining affinity
  if (picks.length < count) {
    for (const p of matching) {
      if (picks.length >= count) break;
      if (pickedNames.has(p.name)) continue;
      pickedNames.add(p.name);
      picks.push({
        name: p.name,
        reason: buildReason(p, element, false),
      });
    }
  }

  return { recommended: picks };
}
