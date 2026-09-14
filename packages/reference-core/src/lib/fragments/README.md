# Fragments

General-purpose fragment collection for build-time code execution. Users call functions like `tokens()` and `recipe()` in their code; the CLI scans, bundles, executes, and collects the data they pass.

Performance benchmarks & historical extractor comparison: [BENCHMARK.md](./BENCHMARK.md).

---

## High-Level API (The Magic)

### 1. Define a Fragment Collector

Create a callable function that users will import and call. The collector is a **function with properties** (callable + metadata).

```ts
import { createFragmentCollector } from '@reference-ui/core/lib/fragments'

// Create collectors – they ARE the functions users call
export const tokens = createFragmentCollector({
  name: 'tokens',
  targetFunction: 'tokens',
})

export const recipe = createFragmentCollector({
  name: 'recipe',
  targetFunction: 'recipe',
})
```

**Config:**

- `name` – Unique identifier (used in result object)
- `targetFunction` – Function name to scan for in user code (e.g. `'tokens'`, `'recipe'`)

**Returns:** A callable function with attached `config`, `init()`, `getFragments()`, and `cleanup()`.

---

### 2. How Users Use Them

Users import the collector functions (e.g. from a library) and call them with plain data. **Fragments are plain JavaScript objects.**

```ts
// User code – e.g. src/components/Button.tsx
import { tokens, recipe } from '@reference-ui/system'

tokens({
  colors: {
    primary: { value: '#3B82F6' },
  },
})

recipe({
  className: 'button',
  base: { padding: '8px' },
})
```

The library (`@reference-ui/system`) just re-exports the collectors:

```ts
export { tokens, recipe } from '@reference-ui/core/collectors'
```

---

### 3. Collect All Fragments

CLI calls `collectFragments` with glob patterns (e.g. from `ui.config.ts` `include`). You get back a keyed object of arrays.

```ts
import { collectFragments } from '@reference-ui/core/lib/fragments'
import { tokens, recipe } from './collectors'

const config = loadUserConfig() // ui.config.ts

const allFragments = await collectFragments({
  collectors: [tokens, recipe],
  include: config.include, // ['src/**/*.{ts,tsx}', 'app/**/*.{ts,tsx}']
  tempDir: join(outDir, 'tmp'), // e.g. .reference-ui/tmp – required; bundled .mjs files go here
})

// allFragments === { tokens: [...], recipe: [...] }
```

---

## The Flow

```
User code:
  import { tokens } from '@reference-ui/system'
  tokens({ colors: { primary: '#000' } })
                    ↓
CLI scans for files calling tokens()
                    ↓
For each file:
  CLI sets globalThis[collectorKey] = []
  CLI bundles file (microBundle) → temp .mjs
  CLI imports temp file (executes user code)
  User's tokens({ ... }) pushes object to globalThis
  CLI reads fragments, cleans up globalThis
                    ↓
Collector holds [{ colors: { primary: '#000' } }, ...]
                    ↓
CLI merges/processes all fragments
```

**Fragments** = the plain data objects.  
**Bundling** = how we execute user code so those objects get passed into the collector.

---

## How It Works (Implementation)

### Microbundle Per File

For each file that calls a fragment function:

1. **Init** – `collector.init()` sets `globalThis[globalKey] = []`
2. **Bundle** – `microBundle(filePath)` bundles the file and its dependencies (resolves imports, compiles TS)
3. **Write** – Bundled code is written to a temp `.mjs` file (Node `import()` needs a path)
4. **Execute** – `import(tempPath)` runs the bundle; user's `tokens({ ... })` runs and pushes to globalThis
5. **Collect** – `collector.getFragments()` returns a copy of the array
6. **Cleanup** – `collector.cleanup()` deletes the key from globalThis; temp file is removed

So the fragments module **creates one microbundle per fragment file**, runs it, and captures the objects passed to the collector.

### GlobalThis Pattern

The collector function (what users call) does:

```ts
function collect(fragment: T) {
  const arr = (globalThis as any)[globalKey]
  if (Array.isArray(arr)) arr.push(fragment)
}
```

The CLI sets that array before importing the bundle and reads it after. No direct reference to globalThis in user code—it’s all behind the callable collector.

### Fragments Are Just Data

A **fragment** is a plain JavaScript object:

```ts
{ colors: { primary: { value: '#3B82F6' } } }
{ className: 'button', base: { padding: '8px' } }
```

Bundling is only the mechanism to run user code and capture these objects.

---

## API Reference

### `createFragmentCollector<T>(config): FragmentCollector<T>`

Returns a callable function with properties:

- **Call:** `collector(fragment)` – same as `collector.collect(fragment)`
- **config** – `{ name, targetFunction? }`
- **init()** – Set up globalThis (call before running user code)
- **getFragments()** – Return collected fragments
- **cleanup()** – Remove collector from globalThis

### `scanForFragments(options): string[]`

Find files that call any of the given function names.

- **directories** – Paths to scan
- **functionNames** – e.g. `['tokens', 'recipe']`
- **include** – (optional) globs, default `['**/*.{ts,tsx}']`
- **exclude** – (optional) default `['**/node_modules/**', '**/*.d.ts']`

Returns absolute file paths.

### `collectFragments(options): Promise<T[] | Record<string, T[]>>`

**Planner API (multiple collectors):**

- **collectors** – Array of `FragmentCollector`s
- **include** – Glob patterns (e.g. from `config.include`)
- **tempDir** – **Required.** Outdir for temp bundled files, usually `<project-outdir>/tmp` (e.g. `.reference-ui/tmp`). Bundled `.mjs` files are written here and cleaned up after each run.

Returns `Record<collectorName, T[]>`.

**Single-collector API:**

- **files** – Paths (e.g. from `scanForFragments`)
- **collector** – One `FragmentCollector`
- **tempDir** – Same as planner API; usually `<outdir>/tmp`.

Returns `T[]`.

---

## Why This Exists

**Before:** Panda (and others) had custom eval runners, hardcoded `COLLECTOR_KEY`s, and per-use-case init/collect boilerplate.

**After:** One generic fragments API. System packages (panda, fonts, box, etc.) create collectors and call `collectFragments`; no duplicated globalThis logic or scanner code.

### Old (reference-core) vs New

| Old system                                                                                                                                        | New fragments API                                                                                 |
| ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Single hardcoded `COLLECTOR_KEY` on globalThis, tied to `extendPandaConfig`                                                                       | Per-collector named keys (`__refTokensCollector`, etc.) — no collisions                           |
| Static `REGISTERED_FUNCTIONS` registry — adding a new function means editing the registry                                                         | Dynamic: each `createFragmentCollector` declares its own `targetFunction`                         |
| `scanDirectories(dirs: string[])` — takes directory paths                                                                                         | `scanForFragments({ include: glob[] })` — takes glob patterns, matching `config.include` directly |
| Two separate mechanisms: `runFiles()` (globalThis, in-process) for panda config AND `runCollectScript()` (child process + JSON file) for box/font | One unified in-process mechanism for all collectors                                               |
| Typed to `Partial<Config>` from `@pandacss/dev` throughout                                                                                        | Generic `FragmentCollector<T>` — no panda dependency in the core mechanism                        |
| `runEval()` always runs all registered functions at once                                                                                          | `collectFragments()` is explicit — you pass only the collectors you want                          |

---

## Notes & Gotchas

- **tempDir placement affects module resolution** – When the runner does `import(tempPath)`, Node resolves bare imports (e.g. `@reference-ui/system`) by walking up from `tempDir`. So `tempDir` must be inside the project (or at worst the monorepo root) where those packages are reachable via `node_modules`. Putting it somewhere arbitrary (e.g. `/tmp/`) will cause import failures at runtime. The old system hardcoded `.ref/eval/` inside `coreDir` for exactly this reason. Use something like `join(outDir, 'tmp')` inside the project.

- **In-process vs child process** – The old system had two runners: `runFiles()` ran user code in-process (globalThis), and `runCollectScript()` spawned a child process (`spawnSync`) for box/font collectors that needed clean module state and wrote results to a JSON file. The new fragments API is always in-process. This is simpler and faster, but means you cannot isolate a collector that crashes or has side effects. If isolation becomes necessary, the child-process pattern can be layered on top.

- **Glob resolution** – `collectFragments({ include })` uses `fast-glob` with `cwd`; handle relative vs absolute as needed.

- **Collector names** – Result object is keyed by `config.name`; duplicate names overwrite.

- **Temp files** – Created under `tempDir`, deleted after each run.

- **reference-core migration** – This replaces the `extendPandaConfig`/`COLLECTOR_KEY`/`runEval` pattern. New system packages should use `createFragmentCollector` + `collectFragments` instead.

- **Future incremental caching** – Feature request for file-level bundle and data caching to drive repeat runs down to ~0ms: [cache.md](./cache.md).

---

## Architectural Deep Dive: The Barrel Leak & Zero-Runtime Boundary

### How Rhythm Leaked into Fragment Collectors (The PostCSS Barrel Trap)

During benchmark profiling on 500 fragment files, we discovered that simple token files (which only contained `tokens({ colors: { ... } })`) were generating **53 KB IIFEs per file** (totalling **26.4 MB of JS** for 500 files).

#### The Root Cause Chain:
1. **The Public Surface**: `@reference-ui/system` exports both declarative fragment collectors (`tokens`, `keyframes`, `font`, `globalCss`) and helper utilities for writing theme definitions (`getRhythm(1)`).
2. **The Bootstrap Alias**: During build-time sync/bootstrap, generated packages don't exist yet, so `microbundle` aliases `@reference-ui/system` to `packages/reference-core/src/entry/system.ts`.
3. **The Barrel Re-Export**: In `src/entry/system.ts`, `getRhythm` was originally re-exported from the rhythm extension barrel:
   ```ts
   // BEFORE:
   export { getRhythm } from '../system/panda/config/extensions/rhythm' // points to rhythm/index.ts
   ```
4. **The Transitive Domino Effect**:
   - `rhythm/index.ts` imported `border.ts`, `utilities.ts`, `globals.ts`, `tokens.ts`, and `helpers.ts`.
   - `helpers.ts` imported `postcss-value-parser`.
   - `utilities.ts` imported `color/utilities.ts` and `shorthands/factory.ts`.
   - Because these modules contain top-level object initializations and regex definitions, esbuild's tree-shaker could not prove they were side-effect-free.
   - **Result**: Every fragment file (even pure token dumps) had the entire PostCSS value parser and rhythm CSS utility suite bundled into its IIFE. 500 files $\times$ 53 KB = 26.4 MB of redundant JS.

#### The Architectural Fix:
- `getRhythm` is fundamentally a pure 10-line calculation (`calc(n * var(--spacing-root))`) with **zero external dependencies**.
- We extracted `getRhythm` into an isolated, standalone module: [`get-rhythm.ts`](../../system/panda/config/extensions/rhythm/get-rhythm.ts).
- `src/entry/system.ts` now re-exports directly from `get-rhythm.ts`:
   ```ts
   // AFTER:
   export { getRhythm } from '../system/panda/config/extensions/rhythm/get-rhythm'
   ```
- **Outcome**: Bundled fragment IIFEs dropped from **53 KB down to 4 KB** per file (**92% reduction in emitted code**), shrinking 500 files from 26.4 MB down to 2.6 MB and speeding up V8 eval by 12.8x.

---

### Zero-Runtime React Boundary (`reactStubPlugin`)

In zero-runtime design systems, developers occasionally colocate token or recipe fragments inside component files (e.g. `Button.tsx`).

1. **The Problem**: In `format: 'iife'`, esbuild cannot emit ESM `import` statements. If React is marked external, esbuild emits `__require("react")`, which crashes in Node ESM (`Dynamic require of "react" is not supported`). If React is NOT marked external, esbuild inlines 118–435 KB of React runtime per file into the fragment bundle!
2. **The Fix**: `microbundle` includes [`reactStubPlugin`](../microbundle/plugins/react-stub.ts), which intercepts `react`, `react-dom`, and `react/jsx-runtime`, replacing them with an in-memory ~200-byte proxy stub covering `createElement`, `jsx`, `Fragment`, and hooks.
3. **The Guarantee**: Component JSX and React hooks can coexist with fragment calls without loading or parsing a single byte of React runtime during build-time fragment collection.

---

### User Dependencies: What the Framework Guarantees vs User Code Costs

It is important to understand the boundary between **framework overhead** and **user dependency costs**:

1. **The Framework Guarantee (Zero Tax)**:
   - The framework guarantees that `@reference-ui/system` imports contribute almost **zero framework bloat** (~4 KB total, zero React runtime, zero PostCSS parser).
   - The framework guarantees concurrent multi-core bundling via `Promise.all`.

2. **The User Responsibility (Heavy Dependencies)**:
   - Because `microbundle` compiles each fragment file into an independent IIFE, **any third-party module imported by user code will be bundled into that file's IIFE**.
   - If a user imports a heavy 150 KB color manipulation or math library (e.g. `chroma-js`, `d3`, `lodash`) inside 500 fragment files, esbuild must bundle that 150 KB library 500 times ($500 \times 150\text{ KB} = 75\text{ MB}$ of JS!).
   - **Best Practice for Consumers**: Keep fragment files as **declarative data dumps** (`tokens()`, `recipe()`). If complex palette generation or math is needed, calculate it once in a shared theme module or precompute it, rather than importing heavy algorithmic packages across hundreds of component files.


