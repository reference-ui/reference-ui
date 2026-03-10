# Fragments

General-purpose fragment collection for build-time code execution. Users call functions like `tokens()` and `recipe()` in their code; the CLI scans, bundles, executes, and collects the data they pass.

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
