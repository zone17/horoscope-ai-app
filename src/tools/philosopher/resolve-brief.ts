/**
 * resolve-brief — Lookup helper.
 *
 * Resolves a council-member display name to a deep brief. Tries the priority
 * subset first (DEEP_BRIEFS); falls back to the generic-by-tradition brief
 * informed by the existing registry's coarse tradition tags.
 *
 * The registry's "Eastern Wisdom" bucket conflates four traditions per
 * docs/research/2026-04-29-readings-resonance.md §9; the per-philosopher
 * override map below routes those into the correct fine-grained tradition.
 * This map covers the 80% case; uncovered philosophers fall through to the
 * coarse registry mapping.
 */

import { DEEP_BRIEFS, type PhilosopherDeepBrief, type Tradition as FineTradition } from '@/tools/philosopher/deep-briefs';
import { buildFallbackBrief } from '@/tools/philosopher/fallback-brief';
import { lookupPhilosopher, Tradition as RegistryTradition } from '@/tools/philosopher/registry';

// ─── Registry tradition → fine-grained tradition coarse map ─────────────

/**
 * Coarse mapping from the registry's 9-bucket tradition enum to the
 * unbundled fine-grained tags used by deep briefs. Eastern Wisdom and
 * Spiritual Leaders are the imprecise buckets; the per-philosopher overrides
 * below handle the cases where coarse mapping would be wrong.
 */
const COARSE_MAP: Record<RegistryTradition, FineTradition> = {
  [RegistryTradition.Stoicism]: 'stoic',
  [RegistryTradition.Epicureanism]: 'aristotelian', // closest neighbor; Epicurus is unique but classical-adjacent
  [RegistryTradition.Classical]: 'aristotelian',
  [RegistryTradition.EasternWisdom]: 'buddhist', // most common case; overrides handle Taoist/Confucian/Sufi/etc.
  [RegistryTradition.ScienceWonder]: 'modern_operator', // closest available; their move is "know what you don't know"
  [RegistryTradition.PoetrySoul]: 'poet_attentive',
  [RegistryTradition.SpiritualLeaders]: 'advaitic', // most common; overrides handle pop-Vedanta etc.
  [RegistryTradition.Existentialism]: 'existentialist',
  [RegistryTradition.Contemporary]: 'modern_operator',
};

// ─── Per-philosopher fine-tradition overrides ───────────────────────────

/**
 * For philosophers where the coarse map gets it wrong. Adding entries here
 * is the cheap path to better fallback quality before a full deep brief is
 * written. Names match the registry's display names exactly.
 */
const FINE_TRADITION_OVERRIDES: Record<string, FineTradition> = {
  // Eastern Wisdom — unbundle
  'Lao Tzu': 'taoist',
  'Zhuangzi': 'taoist',
  'Alan Watts': 'taoist', // popularizer of Taoism + Zen; Taoist tag is closest
  'Confucius': 'confucian',
  'Mencius': 'confucian',
  'Wang Yangming': 'confucian',
  'Rumi': 'poet_attentive', // Sufi inflection; poet_attentive is closest available bucket
  'Jiddu Krishnamurti': 'krishnamurti',
  'Pema Chödrön': 'buddhist',
  'Thich Nhat Hanh': 'buddhist',
  'D.T. Suzuki': 'buddhist',
  'Shunryu Suzuki': 'buddhist',
  'Dogen': 'buddhist',
  // Spiritual Leaders — distinguish real Advaita from pop-Vedanta
  'Eckhart Tolle': 'advaitic',
  'Mooji': 'advaitic',
  'Ram Dass': 'advaitic',
  'Yogananda': 'advaitic',
  'Ramana Maharshi': 'advaitic',
  'Nisargadatta': 'advaitic',
  'Sadhguru': 'advaitic',
  'Walter Russell': 'modern_operator', // honest reframing per research §9.2; image-source not physics
  'Joe Dispenza': 'modern_operator', // pop-Vedanta; modern_operator avoids advaitic over-claim
  'Deepak Chopra': 'modern_operator',
  'Wayne Dyer': 'modern_operator',
  // Existentialism subset — Frankl is religious-existentialist; everyone else atheist
  'Viktor Frankl': 'existentialist',
  'Albert Camus': 'existentialist',
  'Jean-Paul Sartre': 'existentialist',
  'Simone de Beauvoir': 'existentialist',
  'Søren Kierkegaard': 'existentialist',
  'Hannah Arendt': 'existentialist',
};

// ─── Public API ─────────────────────────────────────────────────────────

/**
 * Strip diacritics for Unicode-normalized comparison. Same normalization the
 * quote bank and cache keys use — keeps "Pema Chödrön" and "Pema Chodron"
 * equivalent across all lookups.
 */
function normalize(s: string): string {
  // Combining diacritical marks block: U+0300..U+036F. Explicit char-range
  // works under ES5 target where the \p{Diacritic} Unicode-property flag
  // is unavailable.
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

/**
 * Resolve a council member display name to a deep brief.
 * Strategy:
 *   1. Exact-name lookup in DEEP_BRIEFS (priority subset). Best quality.
 *   2. Diacritic-normalized match in DEEP_BRIEFS.
 *   3. Per-philosopher fine-tradition override → fallback brief.
 *   4. Coarse registry tradition → fallback brief.
 *   5. Last-resort 'unknown' fallback (logs a warning so unknown
 *      philosophers are visible to ops; Wave 1C QA finding 2.12).
 */
export function resolveBrief(name: string): PhilosopherDeepBrief {
  // 1. Priority subset, normalized
  const target = normalize(name);
  for (const brief of Object.values(DEEP_BRIEFS)) {
    if (normalize(brief.name) === target) return brief;
  }

  // 2. Per-philosopher override → fallback
  const override = FINE_TRADITION_OVERRIDES[name];
  if (override) return buildFallbackBrief(name, override);

  // 3. Registry tradition → coarse map → fallback
  const reg = lookupPhilosopher(name);
  if (reg && reg.tradition in COARSE_MAP) {
    return buildFallbackBrief(name, COARSE_MAP[reg.tradition]);
  }

  // 4. Last-resort 'unknown' fallback. Log a warning so silent fallbacks
  //    are visible in cron / API logs. Without this, an unknown council
  //    member produces a generic-but-plausible reading and the operator
  //    has no signal that the deep injection is degraded.
  console.warn(
    `[resolve-brief] unknown philosopher "${name}" — falling back to generic brief. Add to DEEP_BRIEFS or FINE_TRADITION_OVERRIDES for proper coverage.`,
  );
  return buildFallbackBrief(name, undefined);
}
