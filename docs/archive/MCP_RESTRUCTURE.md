# Reference UI MCP Restructuring Plan: Extracting `@reference-ui/mcp`

> **Document Version:** 1.0.0  
> **Status:** Draft / Proposal (Towards MCP v3)  
> **Target Package:** `packages/reference-mcp` (`@reference-ui/mcp`)  
> **Target Monorepo:** `reference-ui`

---

## 1. Executive Summary & Goals

Today, the Reference UI MCP (Model Context Protocol) server is nested inside `packages/reference-core/src/mcp`. 

While this was convenient for early prototyping, it creates two major architectural bottlenecks:

1. **The Dependency Inversion Trap**: `@reference-ui/core` sits at the very bottom of the monorepo dependency hierarchy. Because the MCP server is located inside `core`, it **cannot import `@reference-ui/lib` or `@reference-ui/icons`** without creating cyclic dependencies. Consequently, in Universal Mode (or before a user project has used a component), the MCP server only knows about low-level HTML primitives (`<Div>`, `<Section>`, `<Span>`), and is completely blind to high-level components (`<Splitter>`, `<Dialog>`, `<Menu>`, `<Tabs>`) and icons.
2. **Vestigial Core Coupling**: `ref sync` in `reference-core` still retains thread-pool worker entries (`workers.json`), event handlers, and `@modelcontextprotocol/sdk` dependencies, even though `ref sync` no longer builds MCP models during standard dev/sync cycles (MCP builds are strictly on-demand when the agent server starts).

### Primary Goals:
- **Extract MCP into a dedicated package**: Create `packages/reference-mcp` publishing as `@reference-ui/mcp`.
- **Expose the Full Scope of Reference UI**: Allow MCP to import `@reference-ui/lib` and `@reference-ui/icons` to serve a self-documenting catalog of every primitive, component, icon, prop, and Book example.
- **Uncouple `@reference-ui/core`**: Clean up unused worker threads, events, and MCP dependencies from `core`.
- **Preserve Atlas & Tasty Integration**: Keep the memory-efficient short-lived child process model (`mcp-child.mjs`) for project AST and type analysis.
- **Seamless npm & Agent Ergonomics**: Support `npx @reference-ui/mcp` out of the box, with optional backwards-compatible forwarding from `ref mcp`.

---

## 2. Monorepo Dependency Hierarchy: Before vs. After

### Current Hierarchy (Trapped in Core)
```
         ┌─────────────────────────┐
         │    @reference-ui/lib    │ (Splitter, Dialog, Menu...)
         └────────────┬────────────┘
                      │ depends on
         ┌────────────▼────────────┐
         │   @reference-ui/icons   │ (Material Symbols icons)
         └────────────┬────────────┘
                      │ depends on
         ┌────────────▼────────────┐
         │   @reference-ui/core    │ <── MCP Server trapped here!
         │  (src/mcp, workers.json)│     CANNOT see lib or icons.
         └────────────┬────────────┘
                      │
         ┌────────────▼────────────┐
         │   @reference-ui/rust    │ (Leaf package: ./atlas, ./tasty)
         └─────────────────────────┘
```

### Proposed Hierarchy (MCP at the Top)
```
                 ┌──────────────────────────────────────┐
                 │          @reference-ui/mcp           │ (packages/reference-mcp)
                 │   Standalone Agent Server & Tools    │
                 └──────┬──────────┬──────────┬─────────┘
                        │          │          │
        ┌───────────────┘          │          └────────────────┐
        ▼                          ▼                           ▼
┌───────────────────┐    ┌────────────────────┐     ┌───────────────────┐
│ @reference-ui/lib │    │@reference-ui/icons │     │@reference-ui/core │
│ - Full components │    │- Icon catalog      │     │- Config loader    │
│ - Book stories    │    │- Search & imports  │     │- Path & registry  │
│ - a11y contracts  │    └─────────┬──────────┘     │- Tasty manifest   │
└─────────┬─────────┘              │                └─────────┬─────────┘
          │                        │                          │
          └────────────────────────┼──────────────────────────┘
                                   │
                         ┌─────────▼──────────┐
                         │ @reference-ui/rust │ (Atlas AST & Tasty N-API engine)
                         └────────────────────┘
```

---

## 3. Audit of Dependencies: MCP ↔ Core

To safely move MCP into its own package, we audited every single import between `packages/reference-core/src/mcp/` and `packages/reference-core/`:

### 3.1 What MCP Imports from `@reference-ui/core` (Internal Coupling)

| Import Path in Core | Symbols Used by MCP | Purpose & Migration Strategy |
|---|---|---|
| `src/config` | `loadUserConfig`, `setConfig`, `setCwd`, `getConfig`, `ReferenceUIConfig` | Loads `ui.config.ts`. `@reference-ui/core` already exports `./config`, but needs to expose `loadUserConfig` on the public export. |
| `src/config/errors` | `ConfigNotFoundError`, `ConfigValidationError` | Structured error categorization. Export from `@reference-ui/core/config` or `@reference-ui/core/errors`. |
| `src/lib/paths/global-registry` | `GlobalProjectRegistry` | Reads & sanitizes `~/.reference-ui/registry.json`. Export via `@reference-ui/core/paths`. |
| `src/lib/paths/workspace-discovery` | `findMonorepoRoot`, `discoverWorkspaceProjects`, `resolveProjects` | Scans workspace for `ui.config.ts`. Export via `@reference-ui/core/paths`. |
| `src/lib/paths/ref-config` | `resolveRefConfigFile` | Checks candidate config filenames. Export via `@reference-ui/core/paths`. |
| `src/lib/paths/out-dir` | `getOutDirPath` | Resolves `<project>/.reference-ui`. Export via `@reference-ui/core/paths`. |
| `src/reference/tasty/api` | `createReferenceUiTastyApi` | Instantiates Tasty API with Reference UI library scoping. Export via `@reference-ui/core/reference` or move to MCP. |
| `src/reference/browser-model` | `createReferenceDocument` | Transforms Tasty symbols into documentation trees. Export via `@reference-ui/core/reference`. |
| `src/reference/browser-model/type` | `formatReferenceType` | Pretty-prints TypeScript Tasty types into strings. Export via `@reference-ui/core/reference`. |
| `src/reference/browser/types` | `ReferenceDocument`, `ReferenceMemberDocument` | Type definitions for Tasty documentation nodes. Export via `@reference-ui/core/reference`. |
| `src/system/base/fragments` & `src/system/api/tokens` | `bundleFragments`, `createTokensCollector`, `scanBaseFragmentFiles` | Extracts token catalog from Panda config. Export a dedicated `extractTokensFromConfig` helper from `@reference-ui/core/tokens`. |
| `src/system/primitives/tags` | `TAGS` | Static array of HTML primitive tag names. Export or vendor statically in `@reference-ui/mcp`. |
| `src/types/public/colors` | `COLOR_PROP_KEYS` | Array of style props accepting color tokens. Export or vendor statically in `@reference-ui/mcp`. |
| `src/lib/child-process` | `spawnMonitoredAsync`, `formatSpawnMonitoredFailure` | Standard child process runner with log capture. Export or vendor in MCP. |
| `src/lib/log` | `log` | Logger instance. MCP should use its own scoped logger (writing to stderr / file, keeping stdio clean). |

### 3.2 What `@reference-ui/core` References in MCP (To Be Cleaned Up)

1. **`workers.json`**:
   - Contains `"mcp": "src/mcp/worker/worker.ts"`.
   - **Action:** Delete this worker entry. `ref sync` does not run MCP builds.
2. **`src/events.ts` & `src/sync/complete.ts`**:
   - Contains `import type { McpEvents } from './mcp/events'` and `once('mcp:failed', handleFailure)`.
   - **Action:** Remove `McpEvents` and MCP failure listeners from sync lifecycle.
3. **`tsup.config.ts` in core**:
   - Contains `'mcp-child': 'src/mcp/worker/child-process/entry.ts'`.
   - **Action:** Remove `mcp-child` entry from core build; it will now be built by `packages/reference-mcp`.
4. **`packages/reference-core/package.json`**:
   - Has `"@modelcontextprotocol/sdk": "^1.29.0"` in `dependencies`.
   - Has `"mcp": "./bin/mcp.mjs"` in `bin`.
   - **Action:** Remove `@modelcontextprotocol/sdk` dependency from core. Core CLI can retain a lightweight forwarding command for `ref mcp` or delegate to `npx @reference-ui/mcp`.

---

## 4. Atlas & Tasty Access Strategy

A key question is: **How does `@reference-ui/mcp` access Atlas and Tasty?**

### 4.1 Leaf Package Independence
Both Atlas and Tasty are implemented in Rust inside `packages/reference-rs`.
[`packages/reference-rs`](./packages/reference-rs/package.json) compiles to native N-API binaries and already provides clean ESM/DTS exports:
- `@reference-ui/rust/atlas` (`analyzeDetailed`, `type Component`, `type AtlasConfig`, etc.)
- `@reference-ui/rust/tasty` (`createTastyApi`, `type TastyApi`, etc.)

`@reference-ui/rust` has **zero dependencies on `@reference-ui/core` or `@reference-ui/lib`**.
Therefore, `@reference-ui/mcp` can directly import `@reference-ui/rust/atlas` and `@reference-ui/rust/tasty` with zero risk of circular dependencies.

### 4.2 Preserving the Child Process Architecture
The execution model that separates the long-lived MCP server from heavy AST analysis must be preserved:

```
┌────────────────────────────────────────────────────────┐
│           Persistent Agent Process (`ref-mcp`)         │
│  - Stdio / HTTP server                                 │
│  - Memory footprint: ~30-50MB                          │
│  - Resilient boot, instantly registers tools           │
└───────────────────────────┬────────────────────────────┘
                            │ On project analysis request
                            ▼
┌────────────────────────────────────────────────────────┐
│       Short-Lived Child Process (`mcp-child.mjs`)      │
│  - Spawns in target project directory                  │
│  - Calls `analyzeDetailed(cwd)` from rust/atlas        │
│  - Reads `.reference-ui/types/tasty/manifest.js`       │
│  - Writes `.reference-ui/mcp/model.json`               │
│  - EXITS IMMEDIATELY → 100% memory reclaimed by OS!    │
└────────────────────────────────────────────────────────┘
```

By moving this child process entry (`mcp-child.mjs`) into `packages/reference-mcp`, the entire MCP lifecycle is self-contained.

---

## 5. Setting Up `@reference-ui/mcp` on npm

Publishing `@reference-ui/mcp` to npm is straightforward within our monorepo setup:

### 5.1 Package Configuration (`packages/reference-mcp/package.json`)
```json
{
  "name": "@reference-ui/mcp",
  "version": "0.0.1",
  "private": false,
  "description": "Project-aware and library-grounded MCP server for Reference UI",
  "type": "module",
  "main": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "bin": {
    "mcp": "./bin/mcp.mjs",
    "reference-mcp": "./bin/mcp.mjs",
    "ref-mcp": "./bin/mcp.mjs"
  },
  "files": [
    "bin",
    "dist",
    "README.md",
    "instructions.md"
  ],
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs"
    },
    "./cli": {
      "types": "./dist/cli.d.ts",
      "import": "./dist/cli.mjs"
    }
  },
  "publishConfig": {
    "access": "public"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.29.0",
    "@reference-ui/core": "workspace:*",
    "@reference-ui/icons": "workspace:*",
    "@reference-ui/lib": "workspace:*",
    "@reference-ui/rust": "workspace:*",
    "commander": "^14.0.3",
    "fast-glob": "^3.3.2",
    "picocolors": "^1.1.0",
    "zod": "^4.3.6"
  }
}
```

### 5.2 Why `npx @reference-ui/mcp` Works Automatically
When npm runs `npx @reference-ui/mcp`, it looks for an executable matching:
1. The package name's unscoped part (`mcp`).
2. Keys in the `"bin"` dictionary.

By providing `"mcp": "./bin/mcp.mjs"`, developers and AI agent configurations can simply write:
```json
{
  "mcpServers": {
    "reference-ui": {
      "command": "npx",
      "args": ["-y", "@reference-ui/mcp@latest"]
    }
  }
}
```

### 5.3 Monorepo & Changeset Integration
- `pnpm-workspace.yaml` already has `packages/*`, so `packages/reference-mcp` is immediately integrated.
- `.changeset/config.json` tracks non-ignored packages under `packages/*`. Because `packages/reference-mcp` is public, changeset will handle versioning and npm releases automatically alongside `@reference-ui/core` and `@reference-ui/lib`.

---

## 6. Expanding the MCP Feature Surface: Full UI Breadth

Once freed from `@reference-ui/core`, `@reference-ui/mcp` can ingest high-level components and icons:

### 6.1 Built-in Library Catalog (Universal Mode & Beyond)
Instead of only serving raw HTML tags (`Div`, `Section`, `Span`) when no project is loaded, Universal Mode will serve the full catalog of `@reference-ui/lib`:
- **Primitives**: `<Div>`, `<Section>`, `<Text>`, `<Button>`, etc.
- **Components**: `<Accordion>`, `<Calendar>`, `<Combobox>`, `<DateField>`, `<Dialog>`, `<Field>`, `<Menu>`, `<NumberField>`, `<Popover>`, `<Slider>`, `<Splitter>`, `<Switch>`, `<Tabs>`, `<Toast>`, `<Tooltip>`, `<Tree>`.
- **Subcomponent Signatures**: Document `<Splitter.Panel>`, `<Menu.Item>`, `<Dialog.Content>` with compound relationship requirements.
- **Accessibility & Keyboard Contracts**: Expose focus management rules and required ARIA props.

### 6.2 Icon Library Integration (`@reference-ui/icons`)
Reference UI has a dedicated package containing thousands of Material Symbols React icons.
- Add an `icons` query tool or incorporate icons into `get_component`:
  - `list_icons({ category?: string, query?: string, limit?: number })`
  - Returns icon names, import paths (`import { MagnifyingGlassIcon } from '@reference-ui/icons'`), and style prop compatibility.

### 6.3 Book Stories as Real-World Examples
In `@reference-ui/lib/src/components/`, components have rich `.book.tsx` stories (e.g. `Button.book.tsx`, `Splitter.book.tsx`, `Showcase.book.tsx`).
- The MCP server can ingest these story fixtures at build time to provide realistic, battle-tested code examples for `get_component_examples` instead of naive synthetic snippets.

---

## 7. Migration & Execution Plan

The restructuring should proceed in four sequential phases:

```
Phase 1: Public Core Exports
  └─ Expose ./paths, ./config (loadUserConfig), and ./reference from @reference-ui/core

Phase 2: Scaffold @reference-ui/mcp
  └─ Create packages/reference-mcp, configure tsup, package.json, and bin entries

Phase 3: Move MCP Source & Pipeline
  └─ Relocate server, pipeline, child-process, and universal primitives into packages/reference-mcp

Phase 4: Clean up @reference-ui/core
  └─ Remove workers.json entry, sync complete listener, events union, and MCP SDK dependency

Phase 5: Update Tests & Matrix
  └─ Rewire matrix/mcp to depend on @reference-ui/mcp and verify via pnpm pipeline test
```

### Phase 1: Expose Clean Internal Surfaces from `@reference-ui/core`
Update `packages/reference-core/package.json` exports to expose:
1. `./paths`: `GlobalProjectRegistry`, `resolveRefConfigFile`, `getOutDirPath`, `discoverWorkspaceProjects`.
2. `./config`: `loadUserConfig`, `ConfigNotFoundError`, `ConfigValidationError`.
3. `./reference`: `createReferenceUiTastyApi`, `createReferenceDocument`, `formatReferenceType`.
4. `./tokens`: `loadMcpTokens` helper or token extraction logic.

### Phase 2: Create `packages/reference-mcp`
1. Initialize folder `packages/reference-mcp/`.
2. Configure `package.json` with dependencies on `@reference-ui/core`, `@reference-ui/rust`, `@reference-ui/lib`, and `@reference-ui/icons`.
3. Create `tsup.config.ts` producing `dist/index.mjs`, `dist/cli.mjs`, and `dist/mcp-child.mjs`.
4. Add executable binary shim `bin/mcp.mjs`.

### Phase 3: Migrate MCP Source Code
1. Move `packages/reference-core/src/mcp/` into `packages/reference-mcp/src/`.
2. Update imports to use `@reference-ui/core/*`, `@reference-ui/rust/*`, `@reference-ui/lib`, and `@reference-ui/icons`.
3. Expand `universal-primitives.ts` to include library components from `@reference-ui/lib` and icon discovery from `@reference-ui/icons`.

### Phase 4: Clean Up `@reference-ui/core`
1. Remove `"mcp": "src/mcp/worker/worker.ts"` from `packages/reference-core/workers.json`.
2. Remove `McpEvents` from `src/events.ts`.
3. Remove `mcp:failed` from `src/sync/complete.ts`.
4. Remove `'mcp-child'` entry from `tsup.config.ts`.
5. Remove `@modelcontextprotocol/sdk` from `packages/reference-core/package.json`.
6. Make `ref mcp` in `src/index.ts` forward to `@reference-ui/mcp` (or print clear guidance).

### Phase 5: Verification & Matrix Testing
1. Update `matrix/mcp/package.json` to add `@reference-ui/mcp: workspace:*`.
2. Update `matrix/mcp/tests/unit/helpers/server.ts` to execute the `@reference-ui/mcp` binary.
3. Run unit tests and hermetic container matrix tests:
   ```bash
   pnpm --filter @reference-ui/mcp test
   pnpm pipeline test --packages=@matrix/mcp
   ```

---

## 8. Summary Checklist of Next Actions

- [ ] Review and approve the proposed package split and dependency exports.
- [ ] Implement Phase 1 (Core exports for paths, config loader, and reference Tasty bridge).
- [ ] Scaffold Phase 2 (`packages/reference-mcp`).
- [ ] Migrate source and wire `@reference-ui/lib` + `@reference-ui/icons` metadata (Phase 3).
- [ ] Clean up legacy MCP worker and SDK references from `reference-core` (Phase 4).
- [ ] Validate across all matrix tests (`pnpm pipeline test --packages=@matrix/mcp`).
