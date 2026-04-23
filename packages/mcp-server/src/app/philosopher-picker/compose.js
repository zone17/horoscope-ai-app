// ─── Picker Composition — pure functions over the data snapshot ────
//
// These mirror the atomic verbs in:
//   • src/tools/philosopher/registry.ts → listPhilosophers
//   • src/tools/philosopher/recommend.ts → recommendPhilosophers
//
// We inline them in the app because the Vite singlefile build lives outside
// the Next.js workspace and cannot resolve `@/*` path aliases. The logic is a
// verbatim port: element-affinity + seeded wildcard, same buildReason table,
// same {name, reason} public shape plus transparent metadata (tradition, era,
// element, reasonKind) that the UI layer uses for badges.
//
// When the canonical registry is hoisted into `@horoscope/shared`, this file
// should collapse to a single re-export from that package.

import {
  PHILOSOPHERS,
  TRADITIONS,
  ELEMENT_TRADITIONS,
  SIGN_ELEMENTS,
} from './philosophers.data.js';

/** listPhilosophers — composition over PHILOSOPHERS with optional filters. */
export function listPhilosophers({ tradition, era } = {}) {
  let result = PHILOSOPHERS.slice();
  if (tradition) {
    const t = tradition.toLowerCase();
    result = result.filter((p) => p.tradition.toLowerCase() === t);
  }
  if (era) {
    const e = era.toLowerCase();
    result = result.filter((p) => p.era.toLowerCase() === e);
  }
  return result;
}

/** Deterministic shuffle (same seed → same order). Matches recommend.ts. */
function seededShuffle(arr, seed) {
  const result = arr.slice();
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

// ─── Sign-Specific Reason Templates (mirror recommend.ts) ──────────
//
// Keys are the canonical Tradition string values.

const ELEMENT_REASONS = {
  Fire: {
    'Stoicism':
      'Stoic discipline channels your fire into focused, unstoppable action.',
    'Poetry & Soul':
      'Their poetic vision matches your creative energy and passion for meaning.',
  },
  Earth: {
    'Stoicism':
      'Stoic pragmatism aligns with your grounded, results-oriented nature.',
    'Science & Wonder':
      'Their spirit of inquiry resonates with your love of tangible, provable truth.',
  },
  Air: {
    'Classical':
      'Classical depth feeds your hunger for rigorous, layered thinking.',
    'Contemporary':
      'Their systems thinking mirrors how you naturally see connections everywhere.',
    'Existentialism':
      'Existential questions energize your restless intellectual curiosity.',
  },
  Water: {
    'Eastern Wisdom':
      'Eastern wisdom honors the emotional depth and intuition you navigate by.',
    'Spiritual Leaders':
      'Their inner journey mirrors your instinct to explore beneath the surface.',
    'Poetry & Soul':
      'Poetic language speaks to the part of you that feels what words can barely hold.',
  },
};

const WILDCARD_REASON_PREFIX = 'A surprising pairing:';

/**
 * buildReason — mirrors src/tools/philosopher/recommend.ts buildReason().
 * Returns a human-readable reason string, chosen from ELEMENT_REASONS for
 * affinity picks or a generated line for wildcards.
 */
function buildReason(philosopher, element, isWildcard) {
  if (isWildcard) {
    return `${WILDCARD_REASON_PREFIX} ${philosopher.name}'s ${philosopher.tradition.toLowerCase()} perspective offers a fresh lens that complements your ${element.toLowerCase()} sign energy.`;
  }
  const templateReason = ELEMENT_REASONS[element]?.[philosopher.tradition];
  if (templateReason) return templateReason;
  // Fallback for traditions that match but don't have a specific template
  return `${philosopher.tradition} wisdom pairs naturally with your ${element.toLowerCase()} sign temperament.`;
}

/**
 * recommendPhilosophers — element-affinity + 1 wildcard. Mirrors recommend.ts.
 *
 * Canonical return shape is `{name, reason: <human string>}`. We also surface
 * `tradition`, `era`, `element`, and `reasonKind` ('affinity' | 'wildcard')
 * as transparent metadata — the picker UI consumes these for badges and
 * filtering. Keeping the human `reason` string identical to canonical means
 * this file is trivially replaceable by a shared-package re-export later.
 */
export function recommendPhilosophers(sign, count = 5) {
  const element = SIGN_ELEMENTS[sign];
  if (!element) return [];
  const affinityTraditions = ELEMENT_TRADITIONS[element] || [];

  const affinitySet = new Set(affinityTraditions);
  const matching = seededShuffle(
    PHILOSOPHERS.filter((p) => affinitySet.has(p.tradition)),
    sign,
  );

  const picks = [];
  const picked = new Set();
  const affinitySlots = count > 1 ? count - 1 : count;

  for (const p of matching) {
    if (picks.length >= affinitySlots) break;
    if (picked.has(p.name)) continue;
    picked.add(p.name);
    picks.push({
      name: p.name,
      tradition: p.tradition,
      era: p.era,
      reason: buildReason(p, element, false),
      reasonKind: 'affinity',
      element,
    });
  }

  if (count > 1) {
    const wildcards = seededShuffle(
      PHILOSOPHERS.filter((p) => !affinitySet.has(p.tradition) && !picked.has(p.name)),
      sign + '-wildcard',
    );
    for (const p of wildcards) {
      if (picks.length >= count) break;
      if (picked.has(p.name)) continue;
      picked.add(p.name);
      picks.push({
        name: p.name,
        tradition: p.tradition,
        era: p.era,
        reason: buildReason(p, element, true),
        reasonKind: 'wildcard',
        element,
      });
    }
  }

  return picks;
}

export { TRADITIONS };
