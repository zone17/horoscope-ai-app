// ─── Picker Composition — pure functions over the data snapshot ────
//
// These mirror the atomic verbs in:
//   • src/tools/philosopher/registry.ts → listPhilosophers
//   • src/tools/philosopher/recommend.ts → recommendPhilosophers
//
// We inline them in the app because the Vite singlefile build lives outside
// the Next.js workspace and cannot resolve `@/*` path aliases. The logic is a
// verbatim port: element-affinity + seeded wildcard, no new behavior.

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

/** recommendPhilosophers — element-affinity + 1 wildcard. Mirrors recommend.ts. */
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
    picks.push({ ...p, reason: 'affinity', element });
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
      picks.push({ ...p, reason: 'wildcard', element });
    }
  }

  return picks;
}

export { TRADITIONS };
