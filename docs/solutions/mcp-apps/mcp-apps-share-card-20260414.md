# Compound Doc: MCP Apps Share Card Implementation

**Date:** 2026-04-14
**PRs:** #51 (tool tests), #52 (MCP Apps share card)
**Duration:** Single session
**Outcome:** First MCP App shipped. 120 tool tests + interactive share card rendering in Claude/ChatGPT/VS Code.

## What We Built

1. **120 tests for 8 pure-function atomic tools** — validates every verb independently
2. **First MCP App** — interactive share card with sign picker, live SVG preview, constellation art
3. **Migrated all 12 MCP tools** from deprecated `server.tool()` to `registerTool` API
4. **Fixed share card divergence** — canonical 312-line implementation replaces 18-line stub

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| Vanilla HTML/JS over React for MCP App | Single component, no routing needed. 107KB vs ~150KB. Migrate to Preact if 3+ MCP Apps emerge |
| Copy share-card.ts into MCP server instead of shared package | Zero external deps makes copy trivial. Shared package is the right move but a separate structural refactor |
| DOMParser over innerHTML for SVG rendering | Security: innerHTML allows script injection. DOMParser + sanitization strips script/foreignObject |
| Disable sign picker until initial data arrives | Prevents sending empty quote/author which produces visually broken cards |

## Patterns Learned

### 1. MCP Apps = Tool + Resource (not a new primitive)
The MCP SDK has no "app" object. An MCP App is just:
- A tool with `_meta.ui.resourceUri` pointing to a `ui://` resource
- A resource registered with `registerAppResource` that serves HTML
- The HTML uses the `App` class from `@modelcontextprotocol/ext-apps` for communication

**Pattern:** `registerAppTool(server, name, { _meta: { ui: { resourceUri } } }, handler)` + `registerAppResource(server, name, uri, config, readCallback)`

### 2. SVG innerHTML is an XSS vector even in sandboxed iframes
Even though MCP Apps run in sandboxed iframes with strict CSP, `innerHTML` with SVG content allows `<script>`, `<foreignObject>`, and event handler injection. The fix:
```js
const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
const el = doc.documentElement;
el.querySelectorAll('script, foreignObject').forEach(n => n.remove());
container.replaceChildren(document.importNode(el, true));
```

### 3. File copies diverge — always plan the extraction
Copying `share-card.ts` into the MCP server package was the fastest path, but 3 review agents flagged it as the #1 maintenance risk. The file has zero external deps, making extraction into a shared package trivial. Do this in the next sprint.

### 4. Hoisted deps break standalone installs
`zod`, `vite`, and `vite-plugin-singlefile` worked in the monorepo because they were hoisted from the root. But the MCP server is published as an npm package (`npx horoscope-philosophy-mcp`). Missing deps = crash on standalone install. Always declare deps explicitly in the consuming package.json.

### 5. HTML email formatting needs escaping at generation time
The `content_format` tool's email case interpolated user text directly into `<p>` and `<blockquote>` tags. Even though it "just returns text," the output is designed to be rendered as HTML. Escape at generation time, not at consumption time.

### 6. Test pure functions first, mock impure functions later
Of the 16 atomic tools, 8 are pure functions (no I/O). We tested all 8 with zero mocks in 0.8s. The remaining 3 impure tools (Redis, OpenAI) need mocking — that's a separate effort. Pure-function tests deliver the most trust per line of test code.

## Review Findings Summary

| Reviewer | Findings | Fixed | Deferred |
|----------|----------|-------|----------|
| Correctness (tests) | 8 | 8 | 0 |
| Testing quality | 8 | 3 | 5 (low sev) |
| Maintainability (tests) | 8 | 4 | 4 (low sev) |
| Correctness (MCP Apps) | 6 | 4 | 2 (pre-existing) |
| Security (MCP Apps) | 3 | 2 | 1 (defense-in-depth) |
| Maintainability (MCP Apps) | 9 | 3 | 6 (pre-existing/structural) |

**Top deferred items for next sprint:**
- Extract share-card.ts into shared package (P0 divergence risk)
- Extract embedded SIGN_DATA/PHILOSOPHERS into shared data (P1 already diverged)
- Import canonical formatReading into MCP server (P1 output inconsistency)

## Files Changed

### PR #51 (tool tests)
- 7 new test files in `__tests__/tools/` — 120 tests

### PR #52 (MCP Apps)
- `packages/mcp-server/src/index.ts` — rewritten: registerTool, ext-apps, escapeHtml
- `packages/mcp-server/src/tools/share-card.ts` — canonical copy
- `packages/mcp-server/src/app/share-card/{index.html,app.js,styles.css}` — interactive UI
- `packages/mcp-server/vite.config.ts` — singlefile build
- `packages/mcp-server/package.json` — deps, scripts, version, ESM
- `packages/mcp-server/tsconfig.json` — NodeNext module
- `src/tools/content/share-card.ts` — removed unused escapedQuote
- `docs/plans/2026-04-14-001-feat-mcp-apps-share-card-plan.md` — plan
