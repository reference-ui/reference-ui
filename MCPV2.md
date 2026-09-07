# Reference UI MCP v2 Architecture Specification

> **Workspace-Aware, Multi-Project Component Intelligence for Coding Agents**
> Resilient Boot • Path-Keyed Global Registry • Self-Healing Sanitization • Dynamic Project Switching • Atlas AST Grounding • Universal Primitives Fallback

---

## 1. Problem Statement & Motivation

### The Modern Agent Setup
When an AI coding assistant (Cursor, Antigravity, Claude Desktop, VS Code Copilot, Claude Code) registers an MCP server:
1. **Global or Workspace-Level Registration**: The host spawns `ref mcp` once per session.
2. **Fixed Working Directory**: The host sets the process `cwd` to the repository/workspace root (e.g. `/Users/ryn/Developer/reference-ui`) or `$HOME` if registered globally.
3. **Monorepo Structure**: `ui.config.ts` does **not** live at the monorepo root. It lives in subpackages (e.g. `packages/reference-lib`, `packages/reference-docs`, `apps/web`).

### Current Failure Mode (MCP v1)
In MCP v1:
- `ref mcp` immediately calls `loadUserConfig(process.cwd())` synchronously at process launch.
- If no `ui.config.ts` exists in `cwd`, it throws `ConfigNotFoundError` and exits with code 1.
- Because this occurs during initial process spawning, the MCP client's handshake fails:
  ```text
  Command failed: ref → reference-ui: No ui.config.ts or ui.config.js found in /Users/ryn/Developer/reference-ui.
  : connection closed: calling "initialize": client is closing: EOF
  ```
- The client disables the MCP server entirely for the session.
- Even if it did not crash, MCP v1 has a rigid **1 process = 1 cwd** lifecycle. A developer or agent working in `packages/reference-lib` cannot query that package's components if the MCP daemon was booted from the root.

---

## 2. Core Architectural Principles of MCP v2

```
                                  ┌──────────────────────────────┐
                                  │      AI Agent / Client       │
                                  └──────────────┬───────────────┘
                                                 │ MCP Stdio / HTTP
                                  ┌──────────────▼───────────────┐
                                  │       Reference MCP v2       │
                                  │    (Never crashes at boot)   │
                                  └──────────────┬───────────────┘
                                                 │
      ┌─────────────────────────┬────────────────┼─────────────────────────┬─────────────────────────┐
      │                         │                │                         │                         │
┌─────▼──────────────┐   ┌──────▼──────────┐ ┌───▼───────────────┐   ┌─────▼──────────────┐   ┌──────▼──────────┐
│ Global Registry    │   │ Universal Mode  │ │ Project Discovery │   │ MCP Client Roots   │   │ Project Cache   │
│ ~/.reference-ui/   │   │ Static Prims    │ │ Here → Up → Down  │   │ roots/list         │   │ Map<Path, Model>│
│ registry.json      │   │ Shared Styles   │ │ pnpm / npm glob   │   │ Editor Workspaces  │   │ Atlas + Tasty   │
│ (Keyed by Path)    │   │ Zero config     │ │ Bounded depth     │   │ Real-time roots    │   │ Multi-project   │
└────────────────────┘   └─────────────────┘ └───────────────────┘   └────────────────────┘   └────────┬────────┘
                                                                                                        │
                                                                                            ┌───────────┴───────────┐
                                                                                            │ packages/reference-lib│
                                                                                            │ packages/reference-docs│
                                                                                            └───────────────────────┘
```

1. **Rule #1: Resilient Boot (Never Crash the Handshake)**
   The MCP server must always complete `initialize` and register its tools and resources cleanly, regardless of whether `cwd` contains a `ui.config.ts`.
2. **Projects Are Identified Strictly by Path**
   No arbitrary names, aliases, or descriptions. A project's canonical filesystem path (where its `ui.config.*` lives) is its sole identifier across tools, registries, and caches.
3. **Global Project Registry (`~/.reference-ui/registry.json`)**
   Every time Reference UI runs (`ref sync`, `ref dev`, `ref build`, `ref init`), it records the project path in a machine-wide registry. The MCP server reads this in < 1ms to instantly know every Reference UI project on the machine.
4. **Self-Healing Sanitization**
   If a user moves, renames, or deletes a project folder, the registry automatically detects the stale path, prunes it, and writes back the clean registry dictionary without error.
5. **Interactive Agent Dialogue ("Point to this path!")**
   If multiple projects exist or no project has been selected yet, the server communicates discovered project paths to the agent. The agent can instruct the server: *"Use `packages/reference-lib`!"*
6. **Atlas AST Project Grounding**
   When pointed to a project path, the server binds to that path's `ui.config.ts`, triggers Atlas AST analysis on that project's JSX code, reads the project's generated Tasty types manifest, and extracts project-specific tokens.
7. **Universal Primitives & StyleProps Fallback**
   If no project path is targeted or if the workspace has no `ui.config.ts` anywhere, the server operates in **Universal Reference Mode**, serving documentation and prop definitions for all standard Reference UI primitives (`<Div>`, `<Section>`, `<Text>`, `<Button>`, etc.), container query responsive syntax (`r={{ ... }}`), and rhythm spacing units (`1r`, `2r`).
8. **Multi-Project Cache Keyed by Path**
   The server maintains a lazy cache of `McpModelState` instances (`Map<projectPath, McpModelState>`) so an agent can query multiple packages within the same session without restarting the server.

---

## 3. V1 Architecture Audit (What Exists Today)

> **This section documents the current MCP v1 implementation that V2 must modify. Every file path, function, and behavior listed here has been verified against the source.**

### 3.1 Server Entry Point (`packages/reference-core/src/mcp/server/index.ts`)

**Key exports:**
- `createReferenceMcpServer(options: CreateReferenceMcpServerOptions): McpServer`
- `createReferenceMcpHttpServer(options: CreateReferenceMcpServerOptions): HttpServer`
- `runReferenceMcpServer(options: { cwd: string }): Promise<void>`
- `runReferenceMcpHttpServer(options: RunReferenceMcpHttpServerOptions): Promise<void>`
- `createMcpModelState(options: { cwd: string }): McpModelState`

**Boot flow (stdio):**
1. Instantiates `modelState = createMcpModelState({ cwd })`.
2. Awaits `modelState.warmStart()` — **blocking**. No transport connected until warmup finishes.
3. Calls `createReferenceMcpServer({ cwd, modelState })`.
4. Attaches `new StdioServerTransport()` via `await server.connect(transport)`.

**Boot flow (HTTP):**
Same as stdio for warmup, then creates `node:http` server. On each request to `/mcp`:
- Creates a **new** `createReferenceMcpServer(options)` instance per request.
- Connects a per-request `StreamableHTTPServerTransport`.
- Cleans up on `res.close`.

**Critical V2 implication:** The HTTP handler creates a fresh server per request. In V2, the `ProjectManager` must be **shared** across all requests — passed via the options object, not recreated.

### 3.2 `McpModelState` Interface & Implementation

```ts
export interface McpModelState {
  warmStart(): Promise<void>
  load(): Promise<McpBuildArtifact>
}
```

- Internal state: `let artifact: McpBuildArtifact | null = null`
- `warmStart()`: If cached `model.json` exists → read immediately, schedule background refresh. If not → build synchronously via child process.
- `load()`: Returns artifact or throws `Error('[mcp] Model is not ready')`.
- Background refresh: `spawnMcpBuildChild(cwd)` in a short-lived Node child, swaps artifact atomically when done.

**Critical V2 implication:** `load()` throws if called before warmup. V2's resilient boot connects transport BEFORE warmup, creating a window where tools get called with no artifact. Need a `waitForReady(timeout)` pattern (see §10.2).

### 3.3 CLI Command (`packages/reference-core/src/mcp/cli/command.ts`)

```ts
export async function mcpCommand(cwd: string, options?: McpCommandOptions): Promise<void> {
  const config = await loadUserConfig(cwd)  // ← THROWS ConfigNotFoundError
  setConfig(config)                         // ← PROCESS GLOBAL
  setCwd(cwd)                               // ← PROCESS GLOBAL
  // ... then runs server
}
```

**Critical V2 implications:**
1. `loadUserConfig(cwd)` throws `ConfigNotFoundError` if no `ui.config.*` in `cwd`. This is the root cause of the boot crash.
2. `setConfig()` / `setCwd()` are **process-wide globals**. In a multi-project world there is no single config. These must be eliminated from the MCP server path entirely.

### 3.4 Commander CLI Definition (`packages/reference-core/src/index.ts`, lines 34-44)

```ts
program
  .command('mcp')
  .option('--transport <transport>', ...)
  .option('--host <host>', ...)
  .option('--port <port>', ...)
  .action(runCommand(options => mcpCommand(process.cwd(), options as McpCommandOptions)))
```

**Critical V2 implication:** No positional `[project]` argument. No `--project` flag. No `REF_PROJECT` env var support. All three must be added.

### 3.5 Child Process Architecture

**3-tier model prevents memory leaks:**
- **Tier 1**: MCP server (main process) — long-lived, holds the transport.
- **Tier 2**: MCP worker thread (in `ref sync`) — handles event bus messages.
- **Tier 3**: Short-lived child (`dist/cli/mcp-child.mjs`) — loads config, runs Atlas + Tasty, writes `model.json`, exits. OS reclaims all memory.

**Child entry (`packages/reference-core/src/mcp/worker/child-process/entry.ts`):**
```ts
async function runMcpChildWork(msg: McpChildMessage): Promise<void> {
  const cwd = resolve(msg.cwd)
  const config = await loadUserConfig(cwd)   // ← Also calls loadUserConfig
  setConfig(config)                           // ← Globals are OK here (short-lived process)
  setCwd(cwd)
  // ... builds artifact, emits JSON on stdout
}
```

**Child spawner (`packages/reference-core/src/mcp/worker/child-process/process.ts`):**
- `spawnMcpBuildChild(projectCwd)` — spawns child, parses stdout JSON `{ ok: true, kind: 'build', modelPath, componentCount }`.
- On non-zero exit code, throws with formatted stderr.
- `parseChildJsonLine<T>(stdout)` — extracts last JSON line from stdout.

**Critical V2 implication:** The child process currently hard-crashes if `loadUserConfig` fails (e.g., no `ui.config.ts`) or if Tasty manifest is missing. The `catch` block in `main()` only `console.error`s and `process.exit(1)`. The parent (`spawnMcpBuildChild`) then throws a generic error. V2 must have the child emit **structured JSON errors** on stdout so the parent can provide actionable messages to agents.

### 3.6 Tool Registrations (All Inline in `server/index.ts`)

| Tool | Schema | Delegates To |
|------|--------|--------------|
| `getting_started` | `{}` | Static start guide string |
| `list_components` | `query?, source?, limit?` | `pipeline/queries.ts → listComponents()` |
| `get_component` | `name, source?` | `pipeline/queries.ts → findComponent() → compactComponent()` |
| `get_component_props` | `name, source?, includeUnused?, includeStyleProps?, query?, limit?` | `pipeline/queries.ts → getComponentProps()` |
| `get_component_examples` | `name, source?` | `pipeline/queries.ts → findComponent()` |
| `get_style_props` | `query?, includeProps?` | `pipeline/style-props.ts → getStylePropsReference()` |
| `get_tokens` | `category?, query?, limit?` | `pipeline/queries.ts → listTokens()` |

**Resources:** `reference-ui://component-model` (JSON), `reference-ui://getting-started` (markdown).

### 3.7 Config Resolution (`packages/reference-core/src/lib/paths/ref-config.ts`)

```ts
const CONFIG_CANDIDATES = ['ui.config.ts', 'ui.config.js', 'ui.config.mjs'] as const

export function resolveRefConfigFile(cwd: string): string | null {
  for (const candidate of CONFIG_CANDIDATES) {
    const path = resolve(cwd, candidate)
    if (existsSync(path)) return path
  }
  return null
}
```

**Only checks the exact `cwd` directory. No find-up. No parent search.** This is why booting from a monorepo root or subdirectory fails.

### 3.8 Existing Path Utilities (`packages/reference-core/src/lib/paths/`)

| File | Exports | V2 Relevance |
|------|---------|-------------|
| `ref-config.ts` | `resolveRefConfigFile(cwd)` | Reuse as-is for checking a single dir |
| `core-package-dir.ts` | `resolveCorePackageDir(cwd)`, `walkUpToPackage(startDir, name)` | Pattern for ancestor search — reuse the `walkUp` loop structure |
| `out-dir.ts` | `getOutDirPath(cwd)` → `<cwd>/.reference-ui` | Needed for checking `hasArtifacts` |
| `tmp-dir.ts` | `getOutDirTmpPath(cwd)`, `getProjectTmpDirPath(cwd)` | — |
| `virtual-dir.ts` | `getVirtualDirPath(cwd)` | — |
| `index.ts` | Barrel re-export of all above | **Must add new exports** for global-registry and workspace-discovery |

### 3.9 Existing Test Infrastructure (`matrix/mcp/`)

- **Runner**: Vitest with `globalSetup` that boots an HTTP MCP server.
- **Helpers**: `startMcpServer(cwd, port)`, `connectMcpClient(url)`, `buildMcpArtifactCache(cwd)`.
- **Existing suites**: `server.test.ts`, `list-components.test.ts`, `get-component.test.ts`, `get-component-props.test.ts`, `get-component-examples.test.ts`, `get-style-props.test.ts`, `get-tokens.test.ts`, `primitive-observation.test.ts`, `resources.test.ts`.
- **Execution**: Always via pipeline CLI: `pnpm pipeline test --packages=@matrix/mcp`.

---

## 4. The Path-Keyed Global Project Registry (`~/.reference-ui/registry.json`)

### 4.1 Overview & Data Structure
Rather than scanning entire hard drives (which causes 30–60s timeouts, `node_modules` recursion, and OS permission errors), Reference UI maintains a persistent, lightweight registry at:
```text
~/.reference-ui/registry.json
```

Projects are keyed directly by their **canonical filesystem path** where `ui.config.*` is located. No synthetic metadata, descriptions, or duplicate names:

```json
{
  "version": 1,
  "projects": {
    "/Users/ryn/Developer/reference-ui/packages/reference-lib": {
      "configPath": "/Users/ryn/Developer/reference-ui/packages/reference-lib/ui.config.ts",
      "lastActive": "2026-09-07T00:15:00.000Z"
    },
    "/Users/ryn/Developer/reference-ui/packages/reference-docs": {
      "configPath": "/Users/ryn/Developer/reference-ui/packages/reference-docs/ui.config.ts",
      "lastActive": "2026-09-07T00:14:00.000Z"
    },
    "/Users/ryn/Developer/client-app": {
      "configPath": "/Users/ryn/Developer/client-app/ui.config.ts",
      "lastActive": "2026-09-06T18:30:00.000Z"
    }
  }
}
```

### 4.2 Registration Lifecycle (Automatic Upsert)
Any Reference UI command automatically registers or updates its path:
- `ref sync`, `ref build`, `ref dev`
- `ref init`
- `ref mcp` (when targeting an explicit path)

Registration is non-blocking and fire-and-forget: it never slows down CLI commands.

**Implementation detail**: Hook `GlobalProjectRegistry.upsert(cwd)` into each command's flow AFTER successful `loadUserConfig()` returns. Use `queueMicrotask()` or a fire-and-forget promise — never await the write.

### 4.3 Resilience & Self-Healing Sanitization
Edge cases are handled with strict guarantees:

| Edge Case | Failure Mode in Naive Setup | MCP v2 Resilient Handling |
|---|---|---|
| **Deleted Project** | Stale path causes `ENOENT` / crash on query | `list_projects` checks `existsSync(entry.configPath)`. Missing paths are pruned (`delete projects[path]`) and the clean map is saved to disk. |
| **Moved Project** | Stale path points to old location | Pruned on read; automatically re-registered under its new path as soon as `ref` runs in the new location. |
| **Concurrent CLI Access** | Corrupted JSON from multiple processes | Atomic file writes: write to `~/.reference-ui/registry.json.tmp.<pid>`, then atomic `renameSync`. **Note**: Concurrent reads may cause a pruned entry to reappear once (lost update). This is benign — it will be re-pruned on the next read. A file-lock is unnecessary overhead. |
| **Corrupted Registry File** | Syntax error crashes startup | If `JSON.parse` fails, log a debug warning, back up corrupted file as `registry.json.bak`, and initialize a fresh registry map `{}`. |
| **Symlinked Paths** | Duplicate entries for the same repo | Paths are normalized to canonical realpaths (`fs.realpathSync`) before indexing in `projects`. |

---

## 5. Multi-Tier Project Discovery Engine

When resolving available projects or finding a target, MCP v2 combines five discovery vectors in order:

```
[Discovery Triggered]
         │
         ▼
0. Global Registry: Read ~/.reference-ui/registry.json (Prune stale paths)
         │
         ▼
1. Active Workspace / CWD: Is ui.config.* in current directory?
         │
         ▼
2. Ancestor Search (find-up): Walk up to Git boundary or / for nested subdirectories
         │
         ▼
3. Downward Workspace Scan: Scan pnpm-workspace.yaml / package.json workspaces (pruning node_modules)
         │
         ▼
4. MCP Client Roots: Query editor's open workspaces via MCP roots/list protocol
         │
         ▼
5. Targeted Scan: If agent passes scanPath, perform bounded search (maxDepth: 3)
```

1. **Tier 0: Global Registry (`~/.reference-ui/registry.json`)**
   Instant (< 1ms). Returns all machine-wide project paths. Self-heals on every read.
2. **Tier 1: Current Working Directory (Here)**
   Checks `[cwd]/ui.config.{ts,js,mjs}`.
3. **Tier 2: Ancestor Search (Up / `find-up`)**
   If booted or called from a subfolder like `packages/reference-lib/src/components/button`, walks up parent directories until `ui.config.*` is found or hits a `.git` directory or filesystem root. Use the same loop pattern as `walkUpToPackage()` in `core-package-dir.ts`.
4. **Tier 3: Workspace Discovery (Down)**
   If at a monorepo root, parses `pnpm-workspace.yaml` or `package.json` workspaces to find project subpackages. Automatically classifies them (libraries vs apps vs fixtures).
5. **Tier 4: MCP Client `roots/list` Integration**
   Queries the host editor (Antigravity, Cursor, Claude) for all currently open workspace folders via standard MCP roots protocol. **Note**: `roots/list` is a capability where the server requests roots FROM the client, requiring a callback after handshake. Not all clients support this. Treat as optional enhancement — skip silently if client lacks `roots` capability. Defer to Phase 5 or later; Tiers 0–3 cover common cases.
6. **Tier 5: Bounded Custom Scan (`scanPath`)**
   If the agent asks to scan a specific directory (e.g. `list_projects({ scanPath: "~/Developer" })`), it performs a guarded, bounded scan with `maxDepth` (default 3) while strictly skipping `node_modules`, `.git`, `.next`, and build caches.

### 5.1 Discovery Implementation Details

**Exclusion set** (must be hardcoded for Tier 3 and Tier 5 scans):
```ts
const SCAN_EXCLUDE_DIRS = new Set([
  'node_modules', '.git', '.next', 'dist', 'build',
  '.reference-ui', 'coverage', '.turbo', '.nx',
  '__tests__', '.cache', '.output', 'target',
])
```

**`pnpm-workspace.yaml` parsing**: Parse the `packages:` array. Format is:
```yaml
packages:
  - 'packages/*'
  - 'apps/*'
```
Check if a lightweight YAML parser is already a dependency (e.g. `yaml` package). If not, use a simple regex-based parser for this one-field format:
```ts
const match = content.match(/packages:\s*\n((?:\s+-\s+.+\n?)+)/)
// Extract each `- 'pattern'` line
```

**`package.json` workspaces**: Read `workspaces` field (string array of globs). Expand globs using `fast-glob` or `tinyglobby` (check existing deps in `package.json`).

**Deduplication**: All discovered paths normalized with `fs.realpathSync()` before insertion. Tag each result with `source: 'cwd' | 'ancestor' | 'workspace' | 'global_registry' | 'scan'`.

**Performance**: All filesystem operations should be **sync** for speed. Discovery should complete in < 50ms for typical monorepos.

**Bounded scan cap**: Tier 5 (`scanPath`) must enforce a max results cap of 50 projects. Return a notice if the cap was hit.

---

## 6. The Agent Interaction Model

### Scenario A: Agent asks about components at monorepo root
```
Agent: calls list_components()
Server responds:
{
  "activeProject": "/Users/ryn/Developer/reference-ui/packages/reference-lib",
  "availableProjects": [
    "/Users/ryn/Developer/reference-ui/packages/reference-lib",
    "/Users/ryn/Developer/reference-ui/packages/reference-docs"
  ],
  "notice": "Operating in active project '/Users/ryn/Developer/reference-ui/packages/reference-lib'. To switch projects, call select_project({ path: '...' }) or pass 'project' in your tool call.",
  "components": [ ... ]
}
```

### Scenario B: Agent explicitly instructs the server to switch
```
Agent: calls select_project({ path: "packages/reference-docs" })
Server responds:
{
  "status": "active",
  "project": "/Users/ryn/Developer/reference-ui/packages/reference-docs",
  "configPath": "/Users/ryn/Developer/reference-ui/packages/reference-docs/ui.config.ts",
  "atlasStatus": "ready",
  "componentsCount": 42
}
```

### Scenario C: Agent lists all projects on the machine
```
Agent: calls list_projects()
Server responds:
{
  "activeProject": "/Users/ryn/Developer/reference-ui/packages/reference-lib",
  "projects": [
    {
      "path": "/Users/ryn/Developer/reference-ui/packages/reference-lib",
      "configPath": "/Users/ryn/Developer/reference-ui/packages/reference-lib/ui.config.ts",
      "source": "workspace",
      "isDefault": true
    },
    {
      "path": "/Users/ryn/Developer/reference-ui/packages/reference-docs",
      "configPath": "/Users/ryn/Developer/reference-ui/packages/reference-docs/ui.config.ts",
      "source": "workspace"
    },
    {
      "path": "/Users/ryn/Developer/client-app",
      "configPath": "/Users/ryn/Developer/client-app/ui.config.ts",
      "source": "global_registry",
      "lastActive": "2026-09-06T18:30:00Z"
    }
  ],
  "sanitizedStaleCount": 1,
  "sanitizedMessage": "Pruned 1 deleted project path from global registry (/Users/ryn/Developer/old-app)."
}
```

### Scenario D: Per-query project targeting
The agent can query a specific project on the fly without changing the global default:
```
Agent: calls get_component({ name: "Header", project: "packages/reference-docs" })
Server evaluates against packages/reference-docs cache and returns Header.
```

### Scenario E: Unsynced project
If `ref sync` has not been run in the targeted project, the server does not crash:
```
Agent: calls get_component({ name: "CustomButton", project: "packages/my-app" })
Server responds (isError: true):
"Project at 'packages/my-app' has not been synced yet.
Generated type artifacts are missing at 'packages/my-app/.reference-ui/types/tasty/manifest.js'.
Run 'pnpm --filter my-app exec ref sync' (or 'pnpm dev') to generate the model artifacts."
```

### Scenario F: No project exists (Universal Primitives Mode)
If opened in a plain React app or an empty folder with no `ui.config.ts`:
```
Agent: calls list_components()
Server responds:
{
  "mode": "universal_primitives",
  "notice": "No ui.config.ts detected in this workspace. Serving Reference UI built-in primitives and StyleProps.",
  "components": [
    { "name": "Div", "kind": "primitive", "source": "@reference-ui/react", "description": "Core layout and style container primitive." },
    { "name": "Section", "kind": "primitive", "source": "@reference-ui/react" },
    { "name": "Text", "kind": "primitive", "source": "@reference-ui/react" },
    { "name": "Button", "kind": "primitive", "source": "@reference-ui/react" }
  ]
}
```

---

## 7. Tool Specifications & Schema Updates

### 7.1 Project Management Tools (New)

#### `list_projects`
Discovers and lists all Reference UI project paths across the active workspace, global registry, and optional search path. Automatically self-heals stale registry paths.
- **Input Schema**:
  ```ts
  {
    scanPath: z.string().optional().describe(
      "Optional directory to scan for Reference UI projects (e.g. '~/Developer'). Defaults to workspace and global registry."
    ),
    maxDepth: z.number().int().min(1).max(5).default(3).describe(
      "Max directory traversal depth when scanPath is provided."
    )
  }
  ```
- **Output**:
  ```ts
  interface ListProjectsResult {
    activeProject: string | null
    projects: Array<{
      path: string
      configPath: string
      source: 'workspace' | 'global_registry' | 'scan' | 'cwd' | 'ancestor'
      hasArtifacts: boolean  // Check for existsSync('<path>/.reference-ui/mcp/model.json')
      isDefault: boolean
      lastActive?: string
    }>
    sanitizedStaleCount: number
  }
  ```

#### `select_project`
Sets the active project path for the session and warms up its Atlas AST cache.
- **Input Schema**:
  ```ts
  {
    path: z.string().describe("Relative or absolute filesystem path to the project directory where ui.config.* resides.")
  }
  ```
- **Behavior**:
  1. Resolves `ui.config.ts` for the specified path.
  2. Spawns background warmup for Atlas and Tasty manifest.
  3. Updates session default active project path.

---

### 7.2 Updated Inspection Tool Schemas

Every inspection tool receives an optional `project` parameter (accepting relative or absolute filesystem path):

| Tool Name | Added Schema Field | Behavior |
|---|---|---|
| `list_components` | `project?: string` | Relative/absolute path to project root. Filters components observed in that project's graph |
| `get_component` | `project?: string` | Relative/absolute path to project root. Fetches enriched component from that project's Atlas model |
| `get_component_props` | `project?: string` | Relative/absolute path to project root. Inspects interface from that project's Tasty manifest |
| `get_component_examples`| `project?: string` | Relative/absolute path to project root. Extracts JSX usage instances captured by Atlas in that project |
| `get_tokens` | `project?: string` | Relative/absolute path to project root. Returns token hierarchy for that project |
| `get_style_props` | *(No change)* | Universal to Reference UI; shared across all projects |
| `getting_started` | *(No change)* | Core workflow guide + project switcher instructions |

### 7.3 Response Metadata Convention

Every project-scoped tool response must include metadata fields alongside the tool-specific data:
```ts
{
  activeProject: string | null,           // Current session default
  availableProjects: string[],            // All discovered project paths
  notice?: string,                        // Only when multiple projects or no project selected
  ...toolSpecificData
}
```

This gives the agent context to switch projects or understand why results may differ from expectations.

---

## 8. Internal Architecture & New Modules

### 8.1 `GlobalProjectRegistry` (Self-Healing Storage Keyed by Path)

**Target file**: `packages/reference-core/src/lib/paths/global-registry.ts` [NEW]

```ts
import { existsSync, mkdirSync, readFileSync, renameSync, realpathSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { homedir } from 'node:os'
import { resolveRefConfigFile } from '../paths'

export interface ProjectEntry {
  configPath: string
  lastActive: string
}

export interface RegistryData {
  version: 1
  projects: Record<string, ProjectEntry>
}

export class GlobalProjectRegistry {
  private static registryPath = join(homedir(), '.reference-ui', 'registry.json')

  static read(): { projects: Record<string, ProjectEntry>; sanitizedCount: number } {
    if (!existsSync(this.registryPath)) {
      return { projects: {}, sanitizedCount: 0 }
    }

    try {
      const raw = JSON.parse(readFileSync(this.registryPath, 'utf8')) as RegistryData
      const projects: Record<string, ProjectEntry> = raw.projects ?? {}
      const valid: Record<string, ProjectEntry> = {}
      let sanitizedCount = 0

      for (const [projectPath, entry] of Object.entries(projects)) {
        if (existsSync(entry.configPath)) {
          valid[projectPath] = entry
        } else {
          sanitizedCount++
        }
      }

      if (sanitizedCount > 0) {
        this.write(valid)
      }

      return { projects: valid, sanitizedCount }
    } catch {
      // Corrupted file — back up and start fresh
      try {
        const backupPath = `${this.registryPath}.bak`
        renameSync(this.registryPath, backupPath)
      } catch { /* backup is best-effort */ }
      return { projects: {}, sanitizedCount: 0 }
    }
  }

  static upsert(rawProjectPath: string): void {
    const configPath = resolveRefConfigFile(rawProjectPath)
    if (!configPath) return

    let projectPath = resolve(rawProjectPath)
    try {
      projectPath = realpathSync(projectPath)
    } catch {
      // Keep resolved path if realpathSync fails (e.g. broken symlink)
    }

    const { projects } = this.read()
    projects[projectPath] = {
      configPath,
      lastActive: new Date().toISOString(),
    }

    this.write(projects)
  }

  private static write(projects: Record<string, ProjectEntry>): void {
    try {
      mkdirSync(dirname(this.registryPath), { recursive: true })
      const tmpPath = `${this.registryPath}.tmp.${process.pid}`
      writeFileSync(tmpPath, JSON.stringify({ version: 1, projects }, null, 2), 'utf8')
      renameSync(tmpPath, this.registryPath)
    } catch (e) {
      // Non-fatal — registry writes must never break CLI commands
    }
  }
}
```

**Must also**: Add `export { GlobalProjectRegistry } from './global-registry'` to `packages/reference-core/src/lib/paths/index.ts`.

---

### 8.2 `ProjectManager` (Server-Side Coordinator)

**Target file**: `packages/reference-core/src/mcp/server/project-manager.ts` [NEW]

```ts
export class ProjectManager {
  private workspaceRoot: string
  private explicitProject: string | null       // from CLI --project or REF_PROJECT env
  private activeProjectPath: string | null = null
  private projectCache = new Map<string, McpModelState>()
  private discoveredProjects: DiscoveredProject[] = []
  private readyPromise: Promise<void>
  private readyResolve!: () => void

  constructor(workspaceRoot: string, options?: { project?: string }) {
    this.workspaceRoot = resolve(workspaceRoot)
    this.explicitProject = options?.project ?? process.env.REF_PROJECT ?? null
    this.readyPromise = new Promise(res => { this.readyResolve = res })
  }

  /** Non-blocking. Called AFTER transport is connected. */
  async initialize(): Promise<void> {
    try {
      this.discoveredProjects = await discoverProjects(this.workspaceRoot)
      const defaultPath = this.pickDefault()
      if (defaultPath) {
        this.activeProjectPath = defaultPath
        // Fire-and-forget warmup — do NOT await
        this.getOrCreateState(defaultPath).warmStart().catch(() => {})
      }
    } finally {
      this.readyResolve()  // Always resolve, even if discovery found nothing
    }
  }

  /** Tool handlers await this before accessing projects. Fast (< 50ms). */
  async waitForDiscovery(): Promise<void> {
    return this.readyPromise
  }

  resolveProject(requested?: string): string | null {
    if (requested) {
      return this.matchProjectPath(requested)
    }
    return this.activeProjectPath
  }

  getOrCreateState(projectPath: string): McpModelState {
    const canonical = this.canonicalize(projectPath)
    let state = this.projectCache.get(canonical)
    if (!state) {
      state = createMcpModelState({ cwd: canonical })
      this.projectCache.set(canonical, state)
    }
    return state
  }

  private canonicalize(rawPath: string): string {
    const resolved = resolve(this.workspaceRoot, rawPath)
    try { return realpathSync(resolved) } catch { return resolved }
  }

  private pickDefault(): string | null {
    // Priority chain — see §8.3
  }

  private matchProjectPath(raw: string): string | null {
    // Resolution chain — see §8.4
  }
}
```

### 8.3 Default Project Selection Algorithm (`pickDefault`)

When the server boots, it must auto-select a default project. Priority:

1. **CLI `--project` flag or `REF_PROJECT` env var** → resolve that path directly.
2. **`cwd` contains `ui.config.*`** → use `cwd` (server started inside a project).
3. **Ancestor search from `cwd`** → walk up to find `ui.config.*` (e.g., started from `src/components/`).
4. **Workspace scan finds exactly 1 project** → auto-select it.
5. **Workspace scan finds multiple projects** → select the one with the most recent `lastActive` in the global registry. If none are registered, select the first alphabetically and emit a `notice` listing all options.
6. **No projects found anywhere** → `null` (enter Universal Primitives mode).

**Precedence for CLI overrides:**
```
--project flag  >  REF_PROJECT env var  >  auto-discovery
```

### 8.4 Relative Path Resolution Rules (`matchProjectPath`)

When a tool call includes `project: "packages/reference-docs"` or `select_project({ path: "..." })`:

1. If path is **absolute** → use it directly.
2. If path is **relative** → resolve against `workspaceRoot` (the `cwd` the MCP server was started with).
3. After resolution, normalize with `fs.realpathSync()` to handle symlinks.
4. Validate that the resolved path exists and contains `ui.config.*`.
5. If it does NOT contain `ui.config.*`, check if it's a **subdirectory** of a project (e.g., agent passes `packages/reference-lib/src/components`) → walk up from the resolved path to find the project root.
6. If still not found, return `null` and surface an error: `"No project found at '<path>'. Run list_projects() to see available projects."`

---

## 9. Updated `McpModelState` Interface

The V1 `McpModelState` interface must be extended to support V2's deferred-ready pattern:

```ts
export interface McpModelState {
  /** Load cached artifact if present, else build; may start background refresh. */
  warmStart(): Promise<void>

  /** Current best artifact. Throws if not ready. Fast synchronous check. */
  load(): Promise<McpBuildArtifact>

  /** [NEW] Wait for warmStart to complete, with timeout. Returns null on timeout or error. */
  waitForReady(timeoutMs?: number): Promise<McpBuildArtifact | null>

  /** [NEW] If warmStart failed, contains the error. Used for structured error responses. */
  readonly error: ProjectError | null
}

/** Structured error from child process or config loading. */
export interface ProjectError {
  code: 'missing_artifacts' | 'config_not_found' | 'config_invalid' | 'build_failed'
  message: string
}
```

**Implementation detail for `waitForReady`**:
- Create an internal `Promise` that `warmStart()` resolves when complete.
- `waitForReady(timeout)` races this promise against a `setTimeout`.
- On timeout, return `null` (not an error — the project is still loading).
- On warmStart failure, populate `this.error` with a structured `ProjectError` and resolve the promise (so waiters unblock).

---

## 10. Critical V2 Design Decisions

### 10.1 Process Globals Elimination

**Problem**: V1 calls `setConfig(config)` and `setCwd(cwd)` in `mcpCommand()` — these are process-wide globals incompatible with multi-project.

**Resolution**: The MCP server path must NEVER call `setConfig()` or `setCwd()`. Instead:
- `mcpCommand()` constructs a `ProjectManager(cwd, { project })` and passes it to the server.
- Each `McpModelState` spawns its own child process via `spawnMcpBuildChild(projectCwd)`, which sets globals internally (safe — short-lived isolated process).
- `createReferenceMcpServer()` accepts `{ projectManager }` instead of `{ modelState }`.

### 10.2 Resilient Boot Sequence

V2 boot order:
```
1. Create ProjectManager(cwd, { project })
2. Create McpServer + register ALL tools
3. Connect transport (stdio/HTTP)           ← Handshake completes here
4. projectManager.initialize()              ← Non-blocking, runs in background
5. Tools become functional as discovery + warmup complete
```

The critical insight: **transport is connected BEFORE any config loading or discovery**. The MCP handshake always succeeds. Tools that need project data await `projectManager.waitForDiscovery()` (fast, < 50ms) and then `state.waitForReady(30_000)` (may take seconds if building).

### 10.3 HTTP Shared State

V1's HTTP handler creates a new `createReferenceMcpServer()` per request. V2 must share the `ProjectManager`:
- `runReferenceMcpHttpServer()` creates `ProjectManager` once at boot.
- Each per-request `createReferenceMcpServer({ projectManager })` receives the shared instance.
- `ProjectManager` is safe for concurrent access because Node.js is single-threaded (no actual concurrency in the event loop — `Map.has()` / `Map.get()` / `Map.set()` are atomic).

### 10.4 Shared Tool Handler Pattern

Extract project-resolution + error-handling into a reusable helper to avoid repeating in 7 tool handlers:

```ts
async function withProject<T>(
  projectManager: ProjectManager,
  requestedProject: string | undefined,
  handler: (artifact: McpBuildArtifact, projectPath: string) => T
): Promise<McpToolResponse> {
  await projectManager.waitForDiscovery()
  const projectPath = projectManager.resolveProject(requestedProject)

  if (!projectPath) {
    return universalPrimitivesResponse()  // Fallback mode
  }

  const state = projectManager.getOrCreateState(projectPath)
  const artifact = await state.waitForReady(30_000)

  if (!artifact) {
    if (state.error) {
      return toErrorResult(state.error.message)
    }
    return toErrorResult('Project is still loading. Please retry in a few seconds.')
  }

  return handler(artifact, projectPath)
}
```

### 10.5 Cache Staleness Strategy

**Serve stale, refresh in background** (same pattern as V1's `scheduleBackgroundRefresh`):
1. On every tool call, serve the cached artifact immediately.
2. After serving, check `model.json`'s `mtime`. If changed since last read, schedule a background child rebuild.
3. When background build completes, swap the artifact atomically.
4. No TTL eviction for MVP — keep all loaded projects in memory. With < 10 projects this is fine.

**Future stretch**: Watch `<project>/.reference-ui/mcp/model.json` via `fs.watch()` for real-time invalidation. Not needed for MVP.

---

## 11. Child Process Error Hardening

**Target file to modify**: `packages/reference-core/src/mcp/worker/child-process/entry.ts`

The child's `main()` catch block currently does:
```ts
catch (e) {
  const errMsg = e instanceof Error ? e.message : String(e)
  console.error(errMsg)
  process.exit(1)
}
```

**Must change to**: Emit a structured JSON error on **stdout** (not stderr) before exiting, so the parent can parse it:

```ts
catch (e) {
  const errMsg = e instanceof Error ? e.message : String(e)
  const isConfigNotFound = e instanceof ConfigNotFoundError
  const isMissingArtifacts = errMsg.includes('manifest.js') || errMsg.includes('ref sync')

  const errorPayload = {
    ok: false as const,
    kind: msg.kind,
    error: isConfigNotFound ? 'config_not_found'
         : isMissingArtifacts ? 'missing_artifacts'
         : 'build_failed',
    message: errMsg,
  }

  // Emit on stdout so parent can parse it (stderr is for logs)
  console.log(JSON.stringify(errorPayload))
  process.exit(1)
}
```

**Parent side** (`process.ts` — `spawnMcpBuildChild`): After a non-zero exit code, attempt to parse the last stdout line as a JSON error payload. If it has `ok: false`, propagate the structured error instead of throwing a generic message. The `McpModelState` stores this as `this.error: ProjectError`.

---

## 12. Universal Primitives Fallback

**Target file**: `packages/reference-core/src/mcp/server/universal-primitives.ts` [NEW]

When no project is resolved, serve a static catalog of Reference UI built-in primitives.

**Data source**: V1 already has the following that can be extracted and re-exported statically:
- `packages/reference-core/src/mcp/pipeline/primitives.ts` — contains `KNOWN_REFERENCE_UI_PRIMITIVES` array.
- `packages/reference-core/src/mcp/pipeline/style-props.ts` — contains static category data for 9 StyleProps categories.

**The universal catalog must include**:
- All known primitives: `Div`, `Section`, `Text`, `Button`, `Image`, `Input`, `Label`, `Heading`, `Link`, `List`, `ListItem`, `Nav`, `Header`, `Footer`, `Main`, `Aside`, `Article`, `Form`, `Dialog` — each with `name`, `kind: 'primitive'`, `source: '@reference-ui/react'`, brief `description`.
- StyleProps reference (reuse `getStylePropsReference` directly — it already works without a project).
- Token category documentation (rhythm spacing `1r`/`2r`, responsive container queries `r={{ ... }}`).

**Tool behavior in Universal mode**:

| Tool | Universal Mode Response |
|------|------------------------|
| `list_components` | Static primitive list |
| `get_component` | Primitive detail if name matches known primitive; error otherwise |
| `get_component_props` | `"Detailed prop inspection requires a synced project. Run 'ref init' to set up."` |
| `get_component_examples` | `"Examples require a synced project."` |
| `get_style_props` | Works normally (already project-independent) |
| `get_tokens` | `"Tokens require a synced project."` |
| `getting_started` | Works normally |
| `list_projects` | Returns empty projects array with notice |
| `select_project` | Error: no projects available |

---

## 13. Edge Cases & Required Handling

| # | Edge Case | What Happens | Required Handling |
|---|-----------|-------------|-------------------|
| 1 | **Server started from `$HOME`** (global MCP registration) | `cwd` is `/Users/ryn`, no `ui.config.*` anywhere nearby | Discovery Tiers 0+4 only. Enter Universal mode if no registry entries. Do NOT scan `$HOME` recursively (would be catastrophically slow). |
| 2 | **Agent calls `select_project` with a path that has no artifacts** | Project exists but `ref sync` never ran | Return Scenario E structured error. Do NOT crash. Store a `ProjectError` state so subsequent queries return the same helpful message. |
| 3 | **Agent calls tool with `project` param pointing to non-existent path** | `resolve()` produces a valid-looking path but nothing exists there | `existsSync` check → return `isError: true` with "No project found at path X. Run `list_projects()` to see available projects." |
| 4 | **Multiple `ui.config.ts` at different nesting levels** | e.g., `packages/app/ui.config.ts` AND `packages/app/packages/inner/ui.config.ts` | Each is a separate project. Discovery should find both. Don't deduplicate by containment. |
| 5 | **Workspace scan hits `node_modules` containing `ui.config.ts`** | Some published packages might ship config files | Tier 3/5 scans MUST use the `SCAN_EXCLUDE_DIRS` set. Never recurse into any excluded directory. |
| 6 | **Symlinked monorepo packages (pnpm default)** | `realpathSync` resolves through the symlink to the actual package dir | Always normalize with `realpathSync` before cache key insertion. Two paths resolving to the same realpath must share the same `McpModelState`. |
| 7 | **Agent calls `list_projects({ scanPath: '/' })` or `scanPath: '~'`** | Unbounded filesystem scan | Enforce `maxDepth` (default 3, max 5). Also enforce max results cap (50). Return notice if cap was hit. |
| 8 | **`ui.config.ts` exists but has validation errors** | `ConfigValidationError` during child build | Child emits `{"ok": false, "error": "config_invalid", "message": "..."}`. Project appears in `list_projects` with `hasArtifacts: false`. Tool queries return the validation error. |
| 9 | **Tool called during boot before discovery completes** | `ProjectManager.initialize()` hasn't resolved yet | Tool handlers call `await projectManager.waitForDiscovery()` first. This blocks until discovery (fast, < 50ms) completes. Universal mode is the fallback. |
| 10 | **Tool called after discovery but before warmup completes** | Artifact is still being built in child process | `await state.waitForReady(30_000)` blocks up to 30s. On timeout returns null → "Project is still loading. Please retry." |
| 11 | **Windows paths** | Backslashes, drive letters, case-insensitive filesystem | Normalize all paths with `path.resolve()`. Registry keys use normalized paths. Not critical for MVP (mac/linux focus) but don't write code that breaks on `\\` or `C:\`. |
| 12 | **Config file changes after server boot** | Developer edits `ui.config.ts` mid-session | Not automatically detected. Agent can call `select_project({ path })` again to force re-warmup. Background refresh on mtime change handles `model.json` updates. |

---

## 14. CLI Command Invocation & Overrides

MCP v2 maintains backwards compatibility while adding explicit project path options:

```bash
# 1. Standard stdio server (starts at root, discovers packages + registry):
ref mcp

# 2. Start pinned to a specific project path:
ref mcp packages/reference-lib
# or
ref mcp --project packages/reference-lib

# 3. HTTP inspection mode:
ref mcp --transport http --port 3697

# 4. Environment variable override:
REF_PROJECT=packages/reference-lib ref mcp
```

**Commander definition changes** (in `packages/reference-core/src/index.ts`):
```ts
program
  .command('mcp [project]')           // ← Add positional arg
  .description('Run the Reference UI MCP server')
  .option('--project <path>', 'Path to target project')  // ← Add named option
  .option('--transport <transport>', 'Transport to use (stdio or http)')
  .option('--host <host>', 'Host to bind when using HTTP transport')
  .option('--port <port>', 'Port to bind when using HTTP transport', value =>
    Number.parseInt(value, 10)
  )
  .action(
    runCommand((options, positionalProject) =>
      mcpCommand(process.cwd(), {
        ...options,
        project: options.project || positionalProject || process.env.REF_PROJECT
      } as McpCommandOptions)
    )
  )
```

**Note on `runCommand`**: Check how Commander passes positional args to the action handler. Commander passes positional args as separate parameters before the `Command` object. The `runCommand` wrapper may need to be adapted to forward the positional arg.

### Client Configuration Examples

#### Antigravity / Claude / Cursor (`mcp.json`):
```json
{
  "reference-ui": {
    "command": "pnpm",
    "args": ["exec", "ref", "mcp"],
    "cwd": "${workspaceFolder}"
  }
}
```
*Note: Because MCP v2 discovers packages inside `${workspaceFolder}` and from the global registry, users no longer need to hardcode paths to nested package folders like `packages/reference-lib`.*

---

## 15. Implementation Phases

| Phase | Scope | Target Files | Details |
|---|---|---|---|
| **Phase 1** | **Resilient Startup** | `src/mcp/cli/command.ts`, `src/mcp/server/index.ts`, `src/index.ts` | Remove `loadUserConfig`/`setConfig`/`setCwd` from `mcpCommand()`. Add `[project]` positional arg and `--project` flag to Commander definition. Change boot sequence: create `ProjectManager` → register tools → connect transport → `initialize()` in background. Update `createReferenceMcpServer` signature to accept `ProjectManager` instead of `McpModelState`. Update `McpModelState` interface with `waitForReady()` and `error`. |
| **Phase 2** | **Path-Keyed Global Registry** | `src/lib/paths/global-registry.ts` [NEW], `src/lib/paths/index.ts` | Implement `GlobalProjectRegistry` per §8.1. Add barrel export. Hook `upsert()` fire-and-forget into `ref sync`, `ref dev`, `ref build`, `ref init` — insert after successful `loadUserConfig()` in each command's flow. |
| **Phase 3** | **Workspace Discovery Engine** | `src/lib/paths/workspace-discovery.ts` [NEW], `src/lib/paths/index.ts` | Implement `discoverProjects(cwd, options?)` per §5. All tiers 0–3, 5. Sync filesystem ops. Exclusion set. Dedup by realpath. < 50ms target. Check existing deps for YAML parser and glob expander. |
| **Phase 4** | **Project Management & Multi-Cache** | `src/mcp/server/project-manager.ts` [NEW] | Implement `ProjectManager` per §8.2. Includes `pickDefault` (§8.3), `matchProjectPath` (§8.4), `waitForDiscovery`, `getOrCreateState`, `selectProject`, `listProjects`. Wire into server boot flow from Phase 1. |
| **Phase 5** | **Schema & Tool Propagation** | `src/mcp/server/index.ts` | Add `project?: string` to all tool schemas. Implement `withProject()` helper (§10.4). Register `list_projects` and `select_project` tools. Add `activeProject`/`availableProjects` metadata to responses (§7.3). |
| **Phase 6** | **Universal Primitives Fallback** | `src/mcp/server/universal-primitives.ts` [NEW] | Extract static primitive catalog from existing `pipeline/primitives.ts`. Wire into `withProject()` fallback when no project resolved. Handle all tool responses per §12 table. |
| **Phase 7** | **Child Process Hardening** | `src/mcp/worker/child-process/entry.ts`, `src/mcp/worker/child-process/process.ts` | Structured JSON error output per §11. Parent-side parsing of `ok: false` payloads. Store as `ProjectError` in `McpModelState`. |
| **Phase 8** | **Matrix & Integration Tests** | `matrix/mcp/tests/unit/` | New suites: `resilient-boot.test.ts`, `project-discovery.test.ts`, `project-switching.test.ts`, `global-registry.test.ts` (unit, no server), `universal-mode.test.ts`, `unsynced-project.test.ts`, `warmup-race.test.ts`. Update `global-setup.ts` to boot from monorepo root. Existing tests must continue passing. Run via: `pnpm pipeline test --packages=@matrix/mcp`. |

### Phase Dependencies
```
Phase 2 (Registry) ──────────┐
                              ├──→ Phase 4 (ProjectManager) ──→ Phase 5 (Tool Wiring)
Phase 3 (Discovery) ─────────┘                                        │
                                                                       ▼
Phase 1 (Resilient Boot) ─────────────────────────────────────→ Phase 5
                                                                       │
Phase 6 (Universal Primitives) ───────────────────────────────→ Phase 5
                                                                       │
Phase 7 (Child Hardening) ────────────────────────────────────→ Phase 5
                                                                       │
                                                                       ▼
                                                               Phase 8 (Tests)
```

**Phases 2, 3, 6, 7 can be built in parallel** — they are independent modules with no cross-dependencies. Phase 4 depends on 2+3. Phase 5 depends on 1+4+6+7. Phase 8 is last.

### Verification Plan

After each phase, run:
```bash
# Typecheck
pnpm --filter @reference-ui/core run typecheck

# Unit tests
pnpm --filter @reference-ui/core test

# Build (required before matrix tests)
pnpm --filter @reference-ui/core run build

# Matrix integration tests
pnpm pipeline test --packages=@matrix/mcp
```

**Final verification** (Phase 8):
1. `ref mcp` from monorepo root → handshake completes, `listTools()` returns 9 tools (7 existing + `list_projects` + `select_project`).
2. `list_projects()` → discovers workspace projects + registry entries.
3. `select_project({ path: 'packages/reference-lib' })` → switches active, warmup starts.
4. `list_components()` → returns components from active project with metadata.
5. `get_component({ name: 'Button', project: 'packages/reference-docs' })` → per-query targeting without switching default.
6. Server started from `$HOME` with no projects → Universal Primitives mode, `list_components()` returns static primitives.
7. Unsynced project → structured error with `ref sync` instructions.
8. All existing matrix tests pass unchanged.
