/**
 * Thin re-export layer — canonical data lives in @/tools/philosopher/registry.
 * Backwards-compatible: all original exports preserved with legacy Tradition enum values.
 */

import {
  Tradition as NewTradition,
  type Philosopher as NewPhilosopher,
  getAllPhilosophers,
  lookupPhilosopher as toolLookup,
  listPhilosophers as toolList,
} from '@/tools/philosopher/registry';

// ─── Legacy Tradition enum (camelCase string values) ────────────────────────
// Old consumers expect Tradition.EasternWisdom === 'EasternWisdom', not 'Eastern Wisdom'.
// We re-declare the OLD enum and map to/from the new one.

export enum Tradition {
  Stoicism = 'Stoicism',
  EasternWisdom = 'EasternWisdom',
  ScienceWonder = 'ScienceWonder',
  PoetrySoul = 'PoetrySoul',
  SpiritualLeaders = 'SpiritualLeaders',
  ModernThinkers = 'ModernThinkers',
}

// ─── Mapping between new → old tradition values ─────────────────────────────

const newToOld: Record<string, Tradition> = {
  [NewTradition.Stoicism]: Tradition.Stoicism,
  [NewTradition.Epicureanism]: Tradition.Stoicism, // Epicurus was under Stoicism in old data
  [NewTradition.Classical]: Tradition.ModernThinkers, // Socrates/Plato/Aristotle were under ModernThinkers
  [NewTradition.EasternWisdom]: Tradition.EasternWisdom,
  [NewTradition.ScienceWonder]: Tradition.ScienceWonder,
  [NewTradition.PoetrySoul]: Tradition.PoetrySoul,
  [NewTradition.SpiritualLeaders]: Tradition.SpiritualLeaders,
  [NewTradition.Existentialism]: Tradition.ModernThinkers, // Camus/Frankl/etc were under ModernThinkers
  [NewTradition.Contemporary]: Tradition.ModernThinkers, // Taleb/Naval were under ModernThinkers
};

const oldToNew: Record<string, NewTradition[]> = {
  [Tradition.Stoicism]: [NewTradition.Stoicism, NewTradition.Epicureanism],
  [Tradition.EasternWisdom]: [NewTradition.EasternWisdom],
  [Tradition.ScienceWonder]: [NewTradition.ScienceWonder],
  [Tradition.PoetrySoul]: [NewTradition.PoetrySoul],
  [Tradition.SpiritualLeaders]: [NewTradition.SpiritualLeaders],
  [Tradition.ModernThinkers]: [NewTradition.Classical, NewTradition.Existentialism, NewTradition.Contemporary],
};

// ─── Legacy Philosopher interface (no `era` field) ──────────────────────────

export interface Philosopher {
  name: string;
  tradition: Tradition;
  description: string;
  sampleQuote: string;
}

function toLegacy(p: NewPhilosopher): Philosopher {
  return {
    name: p.name,
    tradition: newToOld[p.tradition] ?? Tradition.ModernThinkers,
    description: p.description,
    sampleQuote: p.sampleQuote,
  };
}

// ─── Legacy exports ─────────────────────────────────────────────────────────

export const PHILOSOPHERS: Philosopher[] = getAllPhilosophers().map(toLegacy);

export const TRADITIONS = Object.values(Tradition);

export function getPhilosophersByTradition(tradition: Tradition): Philosopher[] {
  const newTraditions = oldToNew[tradition] ?? [];
  return newTraditions.flatMap((t) => toolList({ tradition: t })).map(toLegacy);
}

export function getPhilosopher(name: string): Philosopher | undefined {
  const found = toolLookup(name);
  return found ? toLegacy(found) : undefined;
}
