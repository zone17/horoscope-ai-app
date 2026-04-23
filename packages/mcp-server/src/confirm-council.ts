/**
 * confirmCouncil — pure validator powering the `philosopher_picker_confirm` tool.
 *
 * Mirrors the canonical `validatePhilosophers` shape
 * (src/tools/philosopher/registry.ts): separates input names into `valid`
 * (normalized casing, full record) and `invalid` (unchanged). Returns a
 * partial-success payload so the caller can still build a council when only
 * some names match.
 *
 * Lives in its own file so tests can import it without triggering the
 * StdioServerTransport bootstrap inside `index.ts`.
 */

export interface PhilosopherRecord {
  name: string;
  tradition: string;
  era: string;
}

export interface ConfirmCouncilInput {
  sign?: string | null;
  philosophers: string[];
}

export interface ConfirmCouncilOutput {
  sign: string | null;
  valid: PhilosopherRecord[];
  invalid: string[];
  count: number;
  council: PhilosopherRecord[];
  philosophersCsv: string;
  isPartial: boolean;
}

export function confirmCouncil(
  input: ConfirmCouncilInput,
  registry: ReadonlyArray<PhilosopherRecord>,
): ConfirmCouncilOutput {
  const valid: PhilosopherRecord[] = [];
  const invalid: string[] = [];
  for (const name of input.philosophers) {
    const p = registry.find((x) => x.name.toLowerCase() === name.toLowerCase());
    if (p) valid.push({ name: p.name, tradition: p.tradition, era: p.era });
    else invalid.push(name);
  }
  return {
    sign: input.sign ?? null,
    valid,
    invalid,
    count: valid.length,
    council: valid,
    philosophersCsv: valid.map((v) => v.name).join(','),
    isPartial: invalid.length > 0,
  };
}
