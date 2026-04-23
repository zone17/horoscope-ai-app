/**
 * Contract tests for `philosopher_picker_confirm` — the atomic validator
 * behind the Philosopher Picker MCP App.
 *
 * The handler lives inline in packages/mcp-server/src/index.ts and wraps the
 * pure `confirmCouncil` helper below. Tests exercise the helper directly so
 * we can prove the new partial-success contract without spinning up a
 * Stdio-backed MCP server.
 *
 * Mirrors canonical `validatePhilosophers` (src/tools/philosopher/registry.ts):
 *   - valid[]  → normalized-casing records
 *   - invalid[] → unknown names, returned verbatim
 *   - isPartial → true iff invalid.length > 0
 *   - council → alias of valid[] (what the caller should hand downstream)
 */

import {
  confirmCouncil,
  type PhilosopherRecord,
} from '../../packages/mcp-server/src/confirm-council';

const REGISTRY: PhilosopherRecord[] = [
  { name: 'Marcus Aurelius', tradition: 'Stoicism', era: 'ancient' },
  { name: 'Seneca', tradition: 'Stoicism', era: 'ancient' },
  { name: 'Epictetus', tradition: 'Stoicism', era: 'ancient' },
  { name: 'Plato', tradition: 'Classical', era: 'ancient' },
  { name: 'Rumi', tradition: 'Eastern Wisdom', era: 'medieval' },
];

describe('philosopher_picker_confirm — confirmCouncil', () => {
  // ─── 1. All valid names ────────────────────────────────────────────

  it('returns all-valid payload when every name matches the registry', () => {
    const result = confirmCouncil(
      { sign: 'aries', philosophers: ['Marcus Aurelius', 'Seneca', 'Plato'] },
      REGISTRY,
    );
    expect(result.valid.map((v) => v.name)).toEqual([
      'Marcus Aurelius',
      'Seneca',
      'Plato',
    ]);
    expect(result.invalid).toEqual([]);
    expect(result.isPartial).toBe(false);
    expect(result.council).toEqual(result.valid);
    expect(result.count).toBe(3);
    expect(result.philosophersCsv).toBe('Marcus Aurelius,Seneca,Plato');
    expect(result.sign).toBe('aries');
  });

  // ─── 2. All invalid names (hard-failure signal for the caller) ────

  it('returns empty valid + all names in invalid when nothing matches', () => {
    const result = confirmCouncil(
      { sign: 'aries', philosophers: ['NotAPhilosopher', 'AlsoFake'] },
      REGISTRY,
    );
    expect(result.valid).toEqual([]);
    expect(result.invalid).toEqual(['NotAPhilosopher', 'AlsoFake']);
    expect(result.isPartial).toBe(true);
    expect(result.council).toEqual([]);
    expect(result.count).toBe(0);
    expect(result.philosophersCsv).toBe('');
  });

  // ─── 3. Mixed valid + invalid (the partial-success win) ───────────

  it('separates valid and invalid names and preserves the valid subset', () => {
    const result = confirmCouncil(
      {
        sign: 'aries',
        philosophers: ['Seneca', 'NotAPhilosopher', 'Plato', 'AlsoFake'],
      },
      REGISTRY,
    );
    expect(result.valid.map((v) => v.name)).toEqual(['Seneca', 'Plato']);
    expect(result.invalid).toEqual(['NotAPhilosopher', 'AlsoFake']);
    expect(result.isPartial).toBe(true);
    expect(result.council).toEqual(result.valid);
    expect(result.count).toBe(2);
    expect(result.philosophersCsv).toBe('Seneca,Plato');
  });

  // ─── 4. Case-insensitive matching (mirrors validatePhilosophers) ──

  it('matches philosophers case-insensitively and normalizes casing on the way out', () => {
    const result = confirmCouncil(
      {
        sign: 'aries',
        philosophers: ['marcus aurelius', 'SENECA', 'rUmI'],
      },
      REGISTRY,
    );
    expect(result.valid.map((v) => v.name)).toEqual([
      'Marcus Aurelius',
      'Seneca',
      'Rumi',
    ]);
    expect(result.invalid).toEqual([]);
    expect(result.isPartial).toBe(false);
  });

  // ─── 5. Sign handling ─────────────────────────────────────────────

  it('defaults sign to null when omitted', () => {
    const result = confirmCouncil(
      { philosophers: ['Seneca'] },
      REGISTRY,
    );
    expect(result.sign).toBeNull();
    expect(result.valid.map((v) => v.name)).toEqual(['Seneca']);
  });

  // ─── 6. Record completeness (tradition + era travel with name) ───

  it('returns tradition and era alongside the normalized name', () => {
    const result = confirmCouncil(
      { sign: 'aries', philosophers: ['Rumi'] },
      REGISTRY,
    );
    expect(result.valid).toEqual([
      { name: 'Rumi', tradition: 'Eastern Wisdom', era: 'medieval' },
    ]);
  });

  // ─── 7. Duplicate input names ─────────────────────────────────────
  //
  // The atomic validator is position-preserving — it mirrors the input order
  // and does not dedupe. Callers (the picker UI) guarantee uniqueness via
  // their Set-backed selection state, so this is the correct contract.

  it('preserves duplicate input entries (dedup is the caller\'s job)', () => {
    const result = confirmCouncil(
      { sign: 'aries', philosophers: ['Seneca', 'Seneca'] },
      REGISTRY,
    );
    expect(result.valid.map((v) => v.name)).toEqual(['Seneca', 'Seneca']);
    expect(result.isPartial).toBe(false);
  });
});
