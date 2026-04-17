# Compound Doc: Shared Package Extraction + Agent-Native Verbs

**Date:** 2026-04-16
**PRs:** #54, #55
**Session focus:** Composability, verbs not workflows, emergent capability

---

## Problem

The horoscope-ai-app had three architectural violations of agent-native principles:

1. **Composability broken:** `share-card.ts` existed as identical 312-line files in two locations (`src/tools/content/` and `packages/mcp-server/src/tools/`). Any edit to one would silently diverge from the other.

2. **Workflows masquerading as verbs:** `VALID_AUTHORS` (a validation constant) lived in `horoscope-prompts.ts` (a monolithic prompt builder), forcing `reading:generate` to import the entire old util just for one list. `HoroscopeData` type was only available from `horoscope-generator.ts`, coupling type consumers to the legacy generation function.

3. **No emergent capability:** 18 atomic tools existed but nothing described how to compose them. No agent could discover what verbs were available or what goals they could achieve.

---

## Solution

### Phase 1: npm workspaces + shared package

Created `packages/shared/` as the canonical home for tools shared between Next.js app and MCP server.

```
packages/
├── shared/           ← NEW: @horoscope/shared
│   ├── src/
│   │   ├── share-card.ts   ← CANONICAL (moved from mcp-server)
│   │   └── index.ts        ← barrel export
│   ├── package.json         ← type:module, NodeNext
│   └── tsconfig.json
└── mcp-server/
    └── src/index.ts         ← imports from @horoscope/shared
```

Root `package.json` gained `"workspaces": ["packages/shared", "packages/mcp-server"]`.

The Next.js app's `src/tools/content/share-card.ts` became a thin re-export:
```ts
export { generateShareCard } from '@horoscope/shared';
export type { ShareCardInput, ShareCardOutput } from '@horoscope/shared';
```

### Phase 2: Type and constant extraction

- `VALID_AUTHORS` moved to `reading:quote-bank` (where quote validation happens)
- `HoroscopeData` + `ReadingOutput` types extracted to `reading:types.ts`
- 3 consumer files migrated from old-util imports to tool imports

### Phase 3: Agent definitions

Three agents in `src/agents/`, each with a goal and a verb list:
- `daily-publisher`: 7 verbs for autonomous daily content publishing
- `social-poster`: 5 verbs for cross-platform distribution
- `onboarding-guide`: 5 verbs for conversational council building

---

## Lessons Learned

### 1. npm workspaces + `workspace:*` is pnpm-only

`"@horoscope/shared": "workspace:*"` in package.json fails with npm. Use `"@horoscope/shared": "*"` — npm resolves it to the local workspace automatically.

### 2. CI needs to build shared packages before `next build`

The shared package compiles TypeScript to `dist/`. Locally, you build once and it persists. In CI, `npm ci` installs the workspace symlink but `dist/` doesn't exist yet. Added `npm run build --workspace=packages/shared` before `next build` in all three CI jobs.

### 3. `npm test` cascades to workspace packages

After adding workspaces, `npm test` tries to run the `test` script in every workspace. Packages without tests need `"test": "echo 'No tests yet'"` to avoid CI failures.

### 4. Debug routes legitimately need old key formats

The debug/redis route uses `horoscopeKeys.daily(sign, today)` from old `cache-keys.ts`. Migrating it to `buildCacheKey` would make it query keys that don't exist in production Redis. Diagnostic tools should match production state, not tool conventions.

### 5. Monthly page migration needs feature work, not refactoring

The monthly page calls `generateHoroscope(sign, 'monthly', { month })`. The new `generateReading` only supports daily readings. This is a feature gap, not an import swap. Documented as deferred work.

### 6. Agent definitions are documentation, not runtime

The `src/agents/` definitions export plain objects with `name`, `goal`, `tools`, `constraints`. They're consumed by whatever runtime loads them (MCP client, orchestrator, manual reference). The tool names use `namespace:verb` semantic notation, not import paths.

---

## Patterns Established

| Pattern | Rule |
|---------|------|
| **Shared tools go in `packages/shared/`** | Any tool consumed by both Next.js app and MCP server lives here. Zero-dep tools are ideal candidates. |
| **Re-export from `src/tools/`** | The tool tree remains discoverable — `src/tools/content/share-card.ts` re-exports from the shared package. |
| **Types live near their verbs** | `reading:types.ts` sits alongside `reading:generate.ts`. Consumers import types without importing the generator. |
| **Agent = goal + verbs + constraints** | No scripts, no step sequences. The agent decides how to compose. |
| **CI: build shared before app** | Every CI job that runs `next build` must first run `npm run build --workspace=packages/shared`. |

---

## Files Changed

| File | Change |
|------|--------|
| `packages/shared/*` | NEW — shared workspace package |
| `packages/mcp-server/src/index.ts` | Import from `@horoscope/shared` |
| `packages/mcp-server/src/tools/share-card.ts` | DELETED (moved to shared) |
| `src/tools/content/share-card.ts` | Replaced 312-line copy with 3-line re-export |
| `src/tools/reading/types.ts` | NEW — shared types |
| `src/tools/reading/generate.ts` | Import ReadingOutput from types, VALID_AUTHORS from quote-bank |
| `src/tools/reading/quote-bank.ts` | Added VALID_AUTHORS constant |
| `src/agents/*` | NEW — 3 agent definitions |
| `.github/workflows/deploy.yml` | Added shared package build step to all jobs |
| `.gitignore` | Added dist/, .next/ subpackages, test-results/ |
| `package.json` | Added workspaces, updated test script |
