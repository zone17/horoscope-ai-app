---
title: "feat: MCP Apps interactive share card"
type: feat
status: active
date: 2026-04-14
---

# feat: MCP Apps Interactive Share Card

## Overview

Upgrade the horoscope MCP server's share card tool into an MCP App — an interactive HTML UI that renders directly inside Claude, ChatGPT, VS Code, and any MCP Apps-supporting client. Users and agents see a live, customizable share card (pick sign, browse quotes, preview the card) instead of receiving raw SVG data.

This is our first MCP App and validates the agent-native architecture: atomic tools composed into interactive experiences that work everywhere.

## Problem Frame

Today the `content_share_card` MCP tool returns SVG as a JSON string inside a text content block. The user gets a wall of XML. They can't preview it, customize it, or share it without saving the SVG manually. Additionally, the MCP server has a diverged, simplified share card implementation (18 lines, no constellation art, no XML escaping) while the canonical tool in `src/tools/content/share-card.ts` has the full visual treatment (312 lines).

MCP Apps (GA Jan 2026) solves this by letting tools return interactive HTML UIs in a sandboxed iframe. The share card becomes a live visual component the user interacts with directly in chat.

## Requirements Trace

- R1. Share card tool renders an interactive visual card inside MCP Apps-supporting clients
- R2. Users can customize: sign, philosopher/quote author, and see a live preview
- R3. Card retains the brand design: dark cosmic palette, constellation art, golden accents
- R4. Non-MCP-Apps clients still receive the SVG data as text (graceful degradation)
- R5. Fix share card divergence — single canonical implementation, no duplicated SVG generation
- R6. Migrate from deprecated `server.tool()` to `registerTool` API
- R7. The interactive UI uses host theme CSS variables for native look in each client

## Scope Boundaries

- This plan covers only the share card MCP App
- NOT building additional MCP Apps (philosopher picker, reading dashboard) — those are future work
- NOT adding HTTP transport to the MCP server (stdio remains primary)
- NOT changing the Next.js app's share card UI — this is MCP-only

### Deferred to Separate Tasks

- Additional MCP Apps (philosopher picker, reading dashboard): future iteration after validating this pattern
- MCP server HTTP transport (StreamableHTTP): separate task when web-based MCP clients are needed

## Context & Research

### Relevant Code and Patterns

- `packages/mcp-server/src/index.ts` — current MCP server, 12 tools, deprecated `server.tool()` API
- `src/tools/content/share-card.ts` — canonical share card (312 lines, constellation art, text wrapping, XML escaping)
- `@modelcontextprotocol/sdk` v1.29.0 installed — supports `registerTool`, `outputSchema`, `image` content type
- All tools use `textResult()`/`jsonResult()`/`errorResult()` helpers

### MCP Apps Architecture (from research)

- Server-side: `registerAppTool()` adds `_meta.ui.resourceUri` to tool definition, `registerAppResource()` serves the HTML
- Client-side: `App` class from `@modelcontextprotocol/ext-apps` handles iframe ↔ host communication
- HTML runs in sandboxed iframe with strict CSP. No external connections by default
- 50+ CSS custom properties from host for native theming
- `app.callServerTool()` lets the UI call other MCP tools (e.g., change sign → call `zodiac_sign_profile`)
- `app.ontoolresult` receives the initial tool result when the card is first rendered

### Institutional Learnings

- Share card was P0 #10 fix during agent-native migration — preserve the existing `ShareCardInput`/`ShareCardOutput` contract
- MCP server's inline SVG generator lacks XML escaping (XSS-adjacent risk)
- Agent-native principle: MCP server is a thin transport layer over atomic tools in `src/tools/`

## Key Technical Decisions

- **Vanilla HTML/JS for the UI**: Single HTML file, zero framework deps. The share card is one visual component — no routing, no complex state. CSS handles all visual polish. Migrate to Preact later if we build 3+ MCP Apps.
- **Import canonical share card into MCP server**: The MCP server should call `generateShareCard()` from `src/tools/content/share-card.ts` rather than maintaining its own SVG generation. This requires making the tool importable from the MCP server package.
- **Shared tool code via TypeScript path**: The MCP server's tsconfig will reference the root `src/tools/` directory. Alternatively, the share card can be called via the MCP tool itself from the iframe (`app.callServerTool`).
- **UI calls server tools for interactivity**: When the user picks a different sign in the UI, the iframe calls `app.callServerTool({ name: 'zodiac_sign_profile' })` and `app.callServerTool({ name: 'content_share_card' })` to get fresh data and re-render. This is the agent-native pattern — the UI composes atomic tools.
- **Vite + vite-plugin-singlefile for build**: Bundles the HTML/CSS/JS into a single self-contained HTML file that the MCP resource serves. This is the pattern from the ext-apps examples.

## Open Questions

### Resolved During Planning

- **How does the UI get initial data?**: `app.ontoolresult` receives the tool's return value when first rendered. The share card tool returns the SVG + structured data. The UI renders immediately from this.
- **How does graceful degradation work?**: The tool still returns text/structured content in `CallToolResult`. Clients without MCP Apps support just see the text. Clients with MCP Apps render the HTML UI instead.
- **Where does the HTML live?**: Built from `packages/mcp-server/src/app/share-card/` into `packages/mcp-server/dist/share-card-app.html` via Vite singlefile plugin.

### Deferred to Implementation

- Exact CSS for matching the dark cosmic palette to host theme variables — needs visual iteration
- Whether `vite-plugin-singlefile` output needs any post-processing for the MCP resource MIME type
- Optimal constellation SVG rendering approach inside the iframe (inline SVG vs canvas)

## Output Structure

```
packages/mcp-server/
├── src/
│   ├── index.ts                    # Updated: registerTool API, import canonical tools
│   ├── app/
│   │   └── share-card/
│   │       ├── index.html          # Entry point for Vite
│   │       ├── app.js              # App class setup, tool calls, DOM updates
│   │       └── styles.css          # Dark cosmic theme + host CSS variable integration
│   └── tools/
│       └── share-card-bridge.ts    # Thin bridge: calls canonical share card, returns MCP result
├── vite.config.ts                  # Singlefile build config
├── dist/
│   └── share-card-app.html         # Built artifact served by registerAppResource
└── package.json                    # Updated: ext-apps dep, vite deps, build script
```

## High-Level Technical Design

> *This illustrates the intended approach and is directional guidance for review, not implementation specification. The implementing agent should treat it as context, not code to reproduce.*

```
User asks for share card → LLM calls content_share_card tool
                                    ↓
                    MCP server executes tool handler
                    → Calls canonical generateShareCard() from src/tools/
                    → Returns { content: [text result], structuredContent: { svg, sign, quote, author } }
                                    ↓
                    MCP Apps client detects _meta.ui.resourceUri
                    → Fetches ui://share-card/app.html resource
                    → Renders sandboxed iframe
                                    ↓
                    Iframe receives tool result via app.ontoolresult
                    → Renders live card preview (SVG inline or canvas)
                    → Shows sign picker, quote display, author
                                    ↓
                    User picks different sign in UI
                    → iframe calls app.callServerTool('zodiac_sign_profile', { sign })
                    → iframe calls app.callServerTool('content_share_card', { sign, quote, author })
                    → Re-renders card with new constellation + sign name
                                    ↓
                    User satisfied → card visible in chat, can screenshot/share
```

## Implementation Units

- [ ] **Unit 1: Fix share card divergence + migrate to registerTool**

  **Goal:** Eliminate the duplicated inline SVG generator in the MCP server. Import the canonical `generateShareCard` from `src/tools/content/share-card.ts`. Migrate all 12 tools from deprecated `server.tool()` to `server.registerTool()`.

  **Requirements:** R5, R6

  **Dependencies:** None

  **Files:**
  - Modify: `packages/mcp-server/src/index.ts`
  - Modify: `packages/mcp-server/tsconfig.json` (add path to root src/tools/)
  - Modify: `packages/mcp-server/package.json` (if deps needed)
  - Test: `packages/mcp-server/src/__tests__/share-card-bridge.test.ts`

  **Approach:**
  - Add TypeScript path alias or relative import to access `src/tools/content/share-card.ts` from the MCP server
  - Replace the inline SVG generation (~18 lines) with a call to the canonical `generateShareCard()`
  - Migrate all `server.tool()` calls to `server.registerTool()` with proper `inputSchema`, `title`, and `annotations`
  - Keep the `textResult`/`jsonResult`/`errorResult` helpers — they still work with the new API
  - The `content_share_card` tool should now return the full constellation SVG with XML escaping

  **Patterns to follow:**
  - The ext-apps examples use `registerAppTool` which wraps `registerTool`
  - Existing tool definitions already have Zod schemas — convert to `inputSchema` format

  **Test scenarios:**
  - Happy path: `content_share_card` with valid sign/quote/author returns SVG containing constellation paths and escaped XML entities
  - Happy path: All 12 tools register successfully with `registerTool` (server starts without errors)
  - Edge case: Quote with special characters (`<`, `>`, `&`, `"`) is properly XML-escaped in output
  - Error path: Invalid sign returns `isError: true` result

  **Verification:**
  - MCP server starts and lists all 12 tools
  - Share card output contains constellation art and glow filters (not the bare-bones version)
  - `npx @modelcontextprotocol/inspector` shows tools registered with new API format

- [ ] **Unit 2: Install ext-apps SDK and register share card as MCP App**

  **Goal:** Add `@modelcontextprotocol/ext-apps` dependency. Update `content_share_card` tool definition to include `_meta.ui.resourceUri`. Register the corresponding `ui://` resource that serves the HTML.

  **Requirements:** R1, R4

  **Dependencies:** Unit 1

  **Files:**
  - Modify: `packages/mcp-server/src/index.ts` (tool registration + resource)
  - Modify: `packages/mcp-server/package.json` (add ext-apps dep)
  - Create: `packages/mcp-server/src/tools/share-card-bridge.ts`

  **Approach:**
  - Install `@modelcontextprotocol/ext-apps`
  - Use `registerAppTool()` for `content_share_card` with `_meta.ui.resourceUri: "ui://share-card/app.html"`
  - Use `registerAppResource()` to serve the built HTML file from `dist/share-card-app.html`
  - The tool handler still returns structured content (SVG data) for non-MCP-Apps clients
  - Add `outputSchema` with sign, quote, quoteAuthor, svg fields so the UI gets typed data

  **Patterns to follow:**
  - `registerAppTool` / `registerAppResource` from ext-apps examples (get-time example)
  - The `mimeType: "text/html;profile=mcp-app"` convention

  **Test scenarios:**
  - Happy path: Tool listed in `tools/list` includes `_meta.ui.resourceUri` field
  - Happy path: Resource at `ui://share-card/app.html` returns valid HTML with correct MIME type
  - Integration: Non-MCP-Apps client calling the tool still receives text content (graceful degradation)

  **Verification:**
  - `tools/list` response shows `_meta.ui` on `content_share_card`
  - `resources/read` for `ui://share-card/app.html` returns HTML content

- [ ] **Unit 3: Build the interactive share card HTML app**

  **Goal:** Create the single-file HTML application that renders inside the MCP Apps iframe. Shows a live share card preview with sign customization.

  **Requirements:** R1, R2, R3, R7

  **Dependencies:** Unit 2

  **Files:**
  - Create: `packages/mcp-server/src/app/share-card/index.html`
  - Create: `packages/mcp-server/src/app/share-card/app.js`
  - Create: `packages/mcp-server/src/app/share-card/styles.css`
  - Create: `packages/mcp-server/vite.config.ts`
  - Modify: `packages/mcp-server/package.json` (add vite, build script)

  **Approach:**
  - HTML entry point loads the ext-apps `App` class via inline script (bundled by Vite singlefile)
  - On `app.ontoolresult`: render the initial card using the SVG data from the tool result
  - Show a sign picker (12 zodiac buttons with emoji symbols) below the card
  - When user clicks a sign: call `app.callServerTool('content_share_card', { sign, quote, quote_author })` and re-render
  - Use inline SVG rendering (paste the SVG directly into the DOM) for the card preview
  - Style with CSS custom properties from host (`var(--color-background-primary)`, etc.) with dark cosmic fallbacks
  - Brand elements: constellation art visible in the card, golden `#fbbf24` accents, `Playfair Display` font via `@import`
  - Font loading: declare fonts in CSP `style-src` or use system font fallbacks. External font URLs need `_meta.ui.csp.resourceDomains`
  - `app.requestDisplayMode({ mode: 'inline' })` for default sizing; card renders at aspect ratio within container

  **Patterns to follow:**
  - Ext-apps examples: `App` class initialization, `ontoolresult`, `callServerTool`
  - Host theme CSS variables documented in MCP Apps spec (50+ properties)
  - Existing constellation data in `src/tools/content/share-card.ts` (CONSTELLATION_PATHS)

  **Test scenarios:**
  - Happy path: HTML file loads, `App` initializes, `ontoolresult` callback fires and renders card
  - Happy path: Clicking a sign button triggers `callServerTool` and updates the card preview
  - Edge case: Long quote text wraps correctly within the card (visual verification)
  - Edge case: Host provides light theme — card adapts via CSS custom properties
  - Error path: `callServerTool` fails — UI shows error state, doesn't crash

  **Verification:**
  - Built HTML file is self-contained (single file, no external deps except declared CSP domains)
  - Card renders with constellation art, golden accents, sign emoji, quote, and author
  - Sign picker updates the card live without page reload
  - File size under 100KB (constellation data is the largest piece)

- [ ] **Unit 4: Vite build pipeline + integration test**

  **Goal:** Wire up the Vite singlefile build so `npm run build` in the MCP server package produces both the TypeScript output and the bundled HTML app. Verify end-to-end with MCP Inspector.

  **Requirements:** R1

  **Dependencies:** Unit 3

  **Files:**
  - Modify: `packages/mcp-server/vite.config.ts` (finalize)
  - Modify: `packages/mcp-server/package.json` (build script chains tsc + vite)
  - Modify: `packages/mcp-server/tsconfig.json` (exclude app/ from tsc)

  **Approach:**
  - `npm run build` = `tsc && vite build` — TypeScript compiles server code, Vite bundles the HTML app
  - Vite config: `vite-plugin-singlefile` to inline all JS/CSS into one HTML file
  - Output: `dist/index.js` (server) + `dist/share-card-app.html` (app)
  - The `registerAppResource` handler reads from `dist/share-card-app.html` at runtime
  - Add `"build:app": "vite build"` and update main `"build"` to chain both

  **Patterns to follow:**
  - Ext-apps repo build scripts
  - Existing `tsc` build in `packages/mcp-server/package.json`

  **Test scenarios:**
  - Happy path: `npm run build` succeeds, produces both `dist/index.js` and `dist/share-card-app.html`
  - Happy path: Built HTML file is valid, self-contained, under 100KB
  - Integration: Start server, connect with MCP Inspector, call `content_share_card`, verify UI resource is served
  - Integration: Connect with Claude Desktop, call share card, see interactive UI render

  **Verification:**
  - `npm run build` exits cleanly
  - `dist/share-card-app.html` exists and contains inlined JS/CSS
  - MCP Inspector shows the tool with `_meta.ui` and renders the HTML

## System-Wide Impact

- **Interaction graph:** The share card tool now has two consumers — text-based clients (existing) and MCP Apps clients (new). Both receive data from the same tool handler. The HTML UI additionally calls `zodiac_sign_profile` and `content_share_card` tools from the iframe.
- **Error propagation:** Tool errors flow through `isError: true` in CallToolResult. The HTML UI should handle `callServerTool` failures gracefully (show error state, don't crash).
- **State lifecycle risks:** No server-side state. The iframe is ephemeral — destroyed when the user scrolls away or closes chat. `viewUUID`-keyed localStorage for any needed persistence.
- **API surface parity:** The tool's text-based output is unchanged — non-MCP-Apps clients see identical behavior (R4 graceful degradation).
- **Unchanged invariants:** All 11 other MCP tools are unaffected. The `generateShareCard` function in `src/tools/content/share-card.ts` is unchanged — we're importing it, not modifying it.

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| Font loading in sandboxed iframe (Google Fonts blocked by CSP) | Declare `fonts.googleapis.com` in `_meta.ui.csp.resourceDomains`, or use system font fallback (`Georgia, serif`) |
| Constellation data size inflates HTML file | Constellation paths are ~15KB for all 12 signs — well within 100KB budget |
| `registerTool` API differences from deprecated `tool()` | The SDK ships TypeScript types — compiler catches mismatches |
| MCP Apps client support varies | Graceful degradation (R4) — text fallback always works |
| Importing from root `src/tools/` into MCP server package | Use TypeScript project references or relative `../../src/tools/` paths. If problematic, copy the share card module into the MCP server package |

## Sources & References

- MCP Apps specification: https://github.com/modelcontextprotocol/ext-apps/blob/main/specification/2026-01-26/apps.mdx
- MCP Apps build guide: https://modelcontextprotocol.io/extensions/apps/build
- Ext-apps repo examples: https://github.com/modelcontextprotocol/ext-apps/tree/main/examples
- MCP Apps API docs: https://apps.extensions.modelcontextprotocol.io/api/
- Current MCP server: `packages/mcp-server/src/index.ts`
- Canonical share card: `src/tools/content/share-card.ts`
- Brand decisions: `.claude/brand-decisions.md`
- Handoff doc: `docs/HANDOFF.md`
