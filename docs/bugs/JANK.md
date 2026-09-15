# Reference Core – Architectural Jank & Technical Debt Audit

This document tracks technical debt, brittle patterns, verified bugs, and pragmatic battle-tested architectural trade-offs identified in `@reference-ui/core`.

---

## 1. Verified Bugs & Immediate Fixes

### 1.1 Synchronous Disk IPC on Every `log.debug`
- **Location:** [`packages/reference-core/src/config/store.ts`](file:///Users/ryn/Developer/reference-ui/packages/reference-core/src/config/store.ts#L55-L60) & [`packages/reference-core/src/lib/log/index.ts`](file:///Users/ryn/Developer/reference-ui/packages/reference-core/src/lib/log/index.ts#L33-L36)
- **Problem:** In worker threads, `getConfig()` reads `.reference-ui/tmp/config.snapshot.json` from disk using synchronous `readFileSync` and `JSON.parse` on every single invocation:
  ```ts
  export function getConfig(): ReferenceUIConfig | undefined {
    const workerContext = workerData as { config?: ReferenceUIConfig; cwd?: string } | undefined
    const snapshotConfig = workerContext?.cwd ? readConfigSnapshot(workerContext.cwd) : undefined
    return snapshotConfig ?? workerContext?.config ?? mainConfig
  }
  ```
  `log.debug` starts with:
  ```ts
  log.debug = (module: string, ...args: unknown[]) => {
    if (!getConfig()?.debug) return
    ...
  }
  ```
  Every debug log call across every worker thread hits the disk synchronously just to check if debug logging is enabled. In tight loops (file scanning, AST traversal, watch bursts), this creates a massive synchronous I/O tax.
- **Remedy:** Cache the parsed snapshot in a worker-scoped module variable; invalidate/reload it only upon receiving an explicit config change event over the event bus.

---

### 1.2 Machine-Local Hardcoded Paths Committed to Git
- **Location:**
  - [`packages/reference-core/src/system/styled/panda.config.ts#L56`](file:///Users/ryn/Developer/reference-ui/packages/reference-core/src/system/styled/panda.config.ts#L56):
    ```ts
    ;globalThis['__refCurrentFragmentSource'] = "/Users/ryn/Developer/reference-ui/packages/reference-core/src/reference/browser-component/theme/tokens.ts"
    ```
  - [`packages/reference-core/src/system/styled/metadata.json#L3`](file:///Users/ryn/Developer/reference-ui/packages/reference-core/src/system/styled/metadata.json#L3):
    ```json
    "outputPath": "/Users/ryn/Developer/reference-ui/packages/reference-core/src/system/styled"
    ```
- **Problem:** Running the `prebuild` script (`tsx src/system/build/styled/index.ts`) locally embeds absolute host machine paths into generated artifacts that are checked into git.
- **Remedy:** Normalize paths to package-relative or repository-relative paths before writing out generated files, or sanitize machine prefixes during code generation.

---

### 1.3 Mutating Package Source Inside `node_modules` During Consumer Builds
- **Location:** [`packages/reference-core/src/system/panda/config/run.ts#L95`](file:///Users/ryn/Developer/reference-ui/packages/reference-core/src/system/panda/config/run.ts#L95) & [`packages/reference-core/src/system/panda/config/extensions/api/bundle.ts#L16-L28`](file:///Users/ryn/Developer/reference-ui/packages/reference-core/src/system/panda/config/extensions/api/bundle.ts#L16-L28)
- **Problem:** `runConfig` executes:
  ```ts
  const cliDir = resolveCorePackageDir(cwd)
  const cliStyledDir = join(cliDir, 'src/system/styled')
  await writePandaExtensionsBundle(cliDir, cliStyledDir)
  mirrorPandaExtensionsBundle(cliStyledDir, outDir)
  ```
  `writePandaExtensionsBundle` writes `index.mjs` directly into `@reference-ui/core`'s installed source tree (`cliDir/src/system/styled/extensions/index.mjs`).
  If `@reference-ui/core` is installed in a read-only filesystem (Docker container, Nix store, pnpm content-addressable store, or strict CI), this fails with `EACCES` or `EROFS`.
- **Remedy:** Bundle extensions directly into the consumer's output directory (`.reference-ui/styled/extensions/index.mjs`) instead of writing to the core package directory first.

---

### 1.4 Monorepo-Biased Directory Walking for `@pandacss` Symlinking
- **Location:** [`packages/reference-core/src/system/panda/gen/codegen.ts#L14-L45`](file:///Users/ryn/Developer/reference-ui/packages/reference-core/src/system/panda/gen/codegen.ts#L14-L45)
- **Problem:** To allow Panda's node loader to resolve `@pandacss/dev` from `.reference-ui/`, `ensurePandaResolvableFromOutDir` walks up the directory tree looking for `pnpm-workspace.yaml` or `nx.json` and attempts to resolve `packages/reference-core/node_modules/@pandacss`.
- **Remedy:** Fall back reliably to Node package resolution (`createRequire(import.meta.url).resolve('@pandacss/dev/package.json')`) and avoid hardcoded monorepo folder layout assumptions.

---

### 1.5 Whitespace-Brittle String Matching in DTS Patching
- **Location:** [`packages/reference-core/src/types/generators/fonts.ts#L29-L32`](file:///Users/ryn/Developer/reference-ui/packages/reference-core/src/types/generators/fonts.ts#L29-L32), [`#L136-L138`](file:///Users/ryn/Developer/reference-ui/packages/reference-core/src/types/generators/fonts.ts#L136-L138)
- **Problem:** Declaration file patching relies on an exact multi-line string with 4-space indentation:
  ```ts
  const EMITTED_FONT_PROPS_SHAPE = `{
      font?: ConditionalValue<string>;
      weight?: ConditionalValue<string>;
  }`
  ...
  .split(EMITTED_FONT_PROPS_SHAPE).join(EMITTED_FONT_PROPS_ALIAS)
  ```
  If `@typescript/native-preview` (`tsgo`) updates its indentation or formatting (e.g. 2 spaces, trailing commas, reordered properties), `.split()` fails to match silently, leaving the declaration unpatched without throwing an error.
- **Remedy:** Use a regex with flexible whitespace (`/\{\s*font\?:\s*ConditionalValue<string>;\s*weight\?:\s*ConditionalValue<string>;\s*\}/`) or an AST-based type visitor.

---

### 1.6 Hardcoded `process.exit(0)` in Reusable Library Function
- **Location:** [`packages/reference-core/src/clean/command.ts#L24`](file:///Users/ryn/Developer/reference-ui/packages/reference-core/src/clean/command.ts#L24), [`#L36`](file:///Users/ryn/Developer/reference-ui/packages/reference-core/src/clean/command.ts#L36)
- **Problem:** `cleanCommand(cwd)` calls `process.exit(0)` directly inside the function body. Any programmatic consumer, test suite, or tool importing `cleanCommand` has its process abruptly killed.
- **Remedy:** Return `void` from `cleanCommand`; let the CLI action runner (`runCommand`) manage `process.exit`.

---

### 1.7 Global `console` Hijacking During Panda Codegen
- **Location:** [`packages/reference-core/src/system/panda/gen/codegen.ts#L117-L144`](file:///Users/ryn/Developer/reference-ui/packages/reference-core/src/system/panda/gen/codegen.ts#L117-L144)
- **Problem:** `runWithSuppressedPandaLogs` globally reassigns `console.log`, `console.info`, and `console.warn` to capture Panda output. If any concurrent async tasks or timers log during Panda generation, their log entries are hijacked and swallowed into `captured`.
- **Remedy:** Route logging through scoped logger instances or intercept stdout/stderr at the stream level if necessary, restoring originals in a scoped context.

---

## 2. Architectural Trade-offs & Battle Scars

These patterns represent deliberate, battle-tested platform compromises made to ship high-performance tooling without reinventing complex third-party subsystems from scratch.

### 2.1 Piscina Worker Persistence via `KEEP_ALIVE`
- **Location:** [`packages/reference-core/src/lib/thread-pool/run.ts#L74-L87`](file:///Users/ryn/Developer/reference-ui/packages/reference-core/src/lib/thread-pool/run.ts#L74-L87)
- **Pattern:** `export const KEEP_ALIVE = new Promise<never>(() => {})` turns Piscina task-queue workers into permanent background actors.
- **Rationale:** Piscina handles thread lifecycle, workerData passing, and resource cleanup efficiently. Holding worker tasks open with `KEEP_ALIVE` avoids hand-rolling a custom worker supervisor on bare `node:worker_threads`.

### 2.2 macOS FSEvents Dropped Event Circuit Breaker
- **Location:** [`packages/reference-core/src/watch/worker.ts#L12-L55`](file:///Users/ryn/Developer/reference-ui/packages/reference-core/src/watch/worker.ts#L12-L55)
- **Pattern:** Detecting `isFSEventsDroppedError` and breaking after 3 consecutive resyncs.
- **Rationale:** High-volume writes to `.reference-ui/virtual` under heavy build activity can overflow macOS kernel event buffers. Suppressing resync on dropped events prevents infinite build-trigger cascades.

### 2.3 Double Component Mirroring
- **Location:** [`packages/reference-core/tools/copy-reference-api-component.mjs`](file:///Users/ryn/Developer/reference-ui/packages/reference-core/tools/copy-reference-api-component.mjs) & [`packages/reference-core/src/reference/bridge/copy-browser-virtual.ts`](file:///Users/ryn/Developer/reference-ui/packages/reference-core/src/reference/bridge/copy-browser-virtual.ts)
- **Pattern:** Copying the Reference component from `reference-lib` into `reference-core`, then copying it again into the consumer's `.reference-ui/virtual/_reference-component`.
- **Rationale:** Ensures Panda CSS can scan styled primitives from the reference component in both in-repo development and published NPM package contexts without requiring consumers to configure custom include paths.

### 2.4 PostCSS Layer Demotion AST Manipulation
- **Location:** [`packages/reference-core/src/system/stylesheet/transform/demotePandaGlobalCssLayer.ts`](file:///Users/ryn/Developer/reference-ui/packages/reference-core/src/system/stylesheet/transform/demotePandaGlobalCssLayer.ts)
- **Pattern:** Parsing Panda's emitted CSS AST and renaming `@layer base` to `@layer global`, splicing layer order rules.
- **Rationale:** Aligns Panda's default layer architecture with Reference UI's portable cascading layer model.

### 2.5 Dynamic Fragment Loading & Memory Profiler
- **Location:** [`packages/reference-core/src/lib/fragments/runner.ts`](file:///Users/ryn/Developer/reference-ui/packages/reference-core/src/lib/fragments/runner.ts) & [`packages/reference-core/src/lib/profiler/memory.ts`](file:///Users/ryn/Developer/reference-ui/packages/reference-core/src/lib/profiler/memory.ts)
- **Pattern:** Evaluating transpiled fragments via dynamic `import()` and monitoring isolate memory with a custom profiler.
- **Rationale:** The memory profiler was hand-tuned to measure and optimize compilation memory characteristics under TypeScript compiler tooling workloads, keeping overhead visible during development.
