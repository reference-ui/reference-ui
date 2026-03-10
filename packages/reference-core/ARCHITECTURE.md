# @reference-ui/core — Architecture

`@reference-ui/core` is now the active design-system platform for Reference UI. This document describes the current system: workers, event bus, fragments, config generation, virtual FS, composition artifacts, and packaging.

`reference-cli` should be treated as historical context only. Future architecture and API work should be documented here and in `ROADMAP.md`.

---

## Status

- `defineConfig` is the current public authoring API.
- `baseSystem` is the portable composition artifact emitted by `ref sync`.
- `extends` merges upstream fragment bundles into config generation.
- `layers` appends upstream layer-ready CSS without merging upstream tokens into the consumer's Panda config.
- generated primitives support `layer="<name>"` and emit `data-layer="<name>"` at runtime.
- the old `extendSystem(baseSystem)` idea is still interesting, but it is not a shipped public API yet.

See `ROADMAP.md` for future API work and remaining naming cleanup.

---

## Composition Model

The current composition model has three pieces:

- `defineConfig({ extends: [...] })` for adopting upstream tokens and config fragments
- `defineConfig({ layers: [...] })` for consuming upstream component CSS without adopting upstream token space
- `layer="<name>"` on primitives for subtree token scoping at runtime

The portable `BaseSystem` artifact currently carries:

```ts
interface BaseSystem {
  name: string
  fragment: string
  css?: string
}
```

This is the current chain shape:

```ts
import { defineConfig } from '@reference-ui/core'
import { baseSystem } from '@reference-ui/lib'

export default defineConfig({
  name: 'reference-app',
  include: ['src/**/*.{ts,tsx}'],
  extends: [baseSystem],
})
```

And this is the current layers shape:

```ts
import { defineConfig } from '@reference-ui/core'
import { baseSystem } from '@reference-ui/lib'

export default defineConfig({
  name: 'my-layered-app',
  include: ['src/**/*.{ts,tsx}'],
  layers: [baseSystem],
})
```

`extendSystem(baseSystem)` is a future idea, not a current contract. If we add it, it should be introduced as a deliberate authoring API on top of this composition model, not as an accidental compatibility shim.

---

## Commands

| Command | Description |
|--------|--------------|
| **ref sync** (default) | Build and sync the design system. Uses workers + event bus. |
| **ref clean** | Removes output directory (`.reference-ui` or `config.outDir`). Main thread only. Use before tests for fresh state. |

---

## High-Level Flow

1. **Main thread** bootstraps (config, event bus, thread pool), wires flow in events modules.
2. **Workers** are spawned via `workers.runWorker(name, payload)` from init modules.
3. Workers subscribe with `on(event, handler)` and return `KEEP_ALIVE` to stay alive.
4. **Events** flow via **BroadcastChannel**; all threads (main + workers) react.
5. **Sync** runs: virtual copy → config (panda.config + baseSystem fragment) → Panda → packager → type packager → ready.

---

## Event Bus & Thread Pool

### Event bus (`src/lib/event-bus/`)

- **BroadcastChannel** for cross-thread messaging.
- Typed `emit`, `on`, `off`, `once`, `onceAll`; types come from `src/events.ts`.
- `initEventBus()` must run in main thread before any worker uses emit/on.

### Event registry (`src/events.ts`)

Central union of all event maps; each domain exports its slice:

```ts
export type Events = SyncEvents & VirtualEvents & WatchEvents & SystemEvents & PackagerEvents
```

Domains: `sync/events.ts`, `virtual/events.ts`, `watch/events.ts`, `system/events.ts`, `packager/events.ts`.

### Thread pool (Piscina)

- **Manifest**: `workers.json` — keys are worker names, values are source paths (e.g. `src/virtual/worker.ts`).
- **Registry**: `src/lib/thread-pool/registry.ts` builds pool from manifest; `workerEntries` feeds tsup for bundling workers to `dist/cli/${name}/worker.mjs`.
- **API**: `initPool({ config, cwd })`, `runWorker(name, payload)`, `KEEP_ALIVE`, `shutdown`.

**Principle:** Logic lives in handler functions; worker files are wiring only (flat `on` list).

---

## Module Pattern

- **Worker** = single file, flat `on(event, handler)` list; no branching. Returns `KEEP_ALIVE`.
- **Logic** = separate modules with pure handlers (receive payloads, emit events; no `on`).
- **Orchestration** = events modules that route (e.g. `on('virtual:ready', () => emit('run:virtual:copy:all'))`).

**Layout per domain:** `init.ts` (spawns worker), `worker.ts` (wiring), `events.ts` (event types), plus logic files (e.g. `copy-all.ts`).

---

## Code highlights

Real snippets that define the style of the codebase: orchestration as pure event wiring, typed bus, flat workers, and declarative event maps.

### Sync command — single entry point

The sync command is the main hub: bootstrap once, wire events, register completion, then spawn all workers in order. No branching; each init is one line.

```ts
// src/sync/command.ts
import { bootstrap } from './bootstrap'
import { initComplete } from './complete'
import { initEvents } from './events'
import { initVirtual } from '../virtual/init'
import { initConfig } from '../system/config/init'
import { initWatch } from '../watch/init'
import { initPackager } from '../packager/init'
import { initPanda } from '../system/panda/init'

export async function syncCommand(cwd: string, options?: SyncOptions): Promise<void> {
  const payload = await bootstrap(cwd, options)
  initEvents()
  initComplete(payload)
  initWatch(payload)
  initVirtual(payload)
  initConfig()
  initPanda()
  await initPackager({ cwd, watchMode: options?.watch })
}
```

### Sync events — orchestration only

All pipeline flow lives in one place: `on` / `emit` only. Payloads are passed through (e.g. `watch:change` → `run:virtual:sync:file`). Readiness gating is event-driven rather than hidden inside worker logic.

```ts
// src/sync/events.ts
import { emit, on, onceAll } from '../lib/event-bus'

export function initEvents(): void {
  let packagerReady = false
  let pendingPackagerBundle = false

  on('virtual:ready', () => {
    emit('run:virtual:copy:all')
  })

  on('watch:change', (payload) => {
    emit('run:virtual:sync:file', payload)
  })

  on('virtual:complete', () => {
    emit('run:system:config')
  })

  onceAll(['system:config:complete', 'system:panda:ready'], () => {
    emit('run:panda:codegen')
  })

  on('packager:ready', () => {
    packagerReady = true
    if (pendingPackagerBundle) {
      pendingPackagerBundle = false
      emit('run:packager:bundle')
    }
  })

  on('system:panda:codegen', () => {
    if (packagerReady) {
      emit('run:packager:bundle')
    } else {
      pendingPackagerBundle = true
    }
  })

  on('packager-ts:complete', () => {
    emit('sync:complete')
  })
}
```

### Sync complete — cold vs watch

Completion is handled with `once`: exit in cold mode, write a ready message in watch mode so tests can detect "sync ready". The completion event comes from `packager-ts:complete`, so ready means bundles and declaration generation are finished.

```ts
// src/sync/complete.ts
import { once } from '../lib/event-bus'
import type { SyncPayload } from './types'

export const REF_SYNC_READY_MESSAGE = '[ref sync] ready\n'

export function initComplete(payload: SyncPayload): void {
  once('packager-ts:complete', () => {
    if (!payload.options.watch) {
      process.exit(0)
    } else {
      process.stdout.write(REF_SYNC_READY_MESSAGE)
    }
  })
}
```

### Virtual worker — flat subscription list

Worker file: subscribe to triggers, delegate to logic, emit ready, return `KEEP_ALIVE`. Two handlers (full copy vs single-file sync from watch); both are simple wrappers around `copyAll` / `copyToVirtual` + `emit`.

```ts
// src/virtual/worker.ts (excerpt)
export default async function runVirtual(payload: VirtualWorkerPayload): Promise<never> {
  const { sourceDir, config } = payload
  const root = resolve(sourceDir)
  const virtualDir = getVirtualDirPath(root)
  const debug = config.debug ?? false

  const onCopyAll = () => {
    copyAll(payload).catch((err) => {
      console.error('[virtual] Copy failed:', err)
    })
  }

  const onWatchChange = async (ev: { event: 'add' | 'change' | 'unlink'; path: string }) => {
    // ... copy or remove one file, then emit('virtual:fs:change', { event, path })
  }

  on('run:virtual:copy:all', onCopyAll)
  on('run:virtual:sync:file', onWatchChange)
  emit('virtual:ready')

  return KEEP_ALIVE
}
```

### Config worker — one trigger, one side effect

Config worker subscribes to a single trigger, gets `cwd` from shared state, runs `runConfig(cwd)`, then always emits `system:config:complete` (success or failure) so the pipeline never stalls.

```ts
// src/system/config/worker.ts
export default async function runConfigWorker(): Promise<never> {
  on('run:system:config', () => {
    const cwd = getCwd()
    if (!cwd) {
      log.error('[config] run:system:config: getCwd() is undefined')
      emit('system:config:complete')
      return
    }
    runConfig(cwd)
      .then(() => emit('system:config:complete'))
      .catch((err) => {
        log.error('[config] runConfig failed', ...)
        emit('system:config:complete')
      })
  })
  emit('system:config:ready')
  return KEEP_ALIVE
}
```

### Event bus — typed emit

`emit` is generic: for events whose payload is `Record<string, never>`, no second argument is required; otherwise payload is required. BroadcastChannel carries `{ type: 'bus:event', event, payload }`.

```ts
// src/lib/event-bus/channel/emit.ts
export function emit<K extends keyof Events>(
  event: K,
  ...args: Events[K] extends Record<string, never> ? [] : [payload: Events[K]]
): void
export function emit(event: string, payload?: unknown): void
export function emit(event: string, payload?: unknown) {
  broadcastChannel.postMessage({
    type: 'bus:event',
    event,
    payload: payload ?? {},
  })
}
```

### Event bus — typed on

Handlers receive the correct payload type for the event key; listeners are stored per event for cleanup (`off`).

```ts
// src/lib/event-bus/channel/on.ts
export function on<K extends keyof Events>(
  event: K,
  handler: (payload: Events[K]) => void | Promise<void>
): void
export function on(event: string, handler: (payload: unknown) => void | Promise<void>) {
  const listener = (msg: Event) => {
    if ((msg as MessageEvent).data?.type === 'bus:event' && (msg as MessageEvent).data?.event === event) {
      handler((msg as MessageEvent).data.payload)
    }
  }
  broadcastChannel.addEventListener('message', listener as EventListener)
  // ... channelListeners.set(event, ...).add(listener)
}
```

### Event type maps — domain slices

Each domain exports a single type map: event name → payload type. Triggers vs notifications are documented in comments. Empty payloads use `Record<string, never>`.

```ts
// src/system/events.ts
export type SystemEvents = {
  'run:system:config': Record<string, never>
  'run:panda:css': Record<string, never>
  'run:panda:codegen': Record<string, never>
  'system:ready': Record<string, never>
  'system:config:ready': Record<string, never>
  'system:config:complete': Record<string, never>
  'system:panda:ready': Record<string, never>
  'system:panda:css': Record<string, never>
  'system:panda:codegen': Record<string, never>
  'system:complete': Record<string, never>
}
```

```ts
// src/virtual/events.ts
export type VirtualEvents = {
  'virtual:ready': Record<string, never>
  'run:virtual:copy:all': Record<string, never>
  'run:virtual:sync:file': { event: 'add' | 'change' | 'unlink'; path: string }
  'virtual:fs:change': { event: 'add' | 'change' | 'unlink'; path: string }
  'virtual:complete': Record<string, never>
}
```

### Fragment collector — globalThis bridge

Collectors give a single function users call (e.g. `tokens({ ... })`) that pushes into a globalThis array. Generated configs get `toScript()` (init the array) and `toGetter()` (IIFE that returns collected fragments). Same pattern for any config slice (tokens, recipes, etc.).

```ts
// src/lib/fragments/collector.ts (concept)
function collect(fragment: TInput): void {
  const collector = (globalThis as Record<string, unknown>)[globalKey]
  if (Array.isArray(collector)) {
    collector.push(fragment)
  }
}

function toScript(): string {
  return `globalThis['${globalKey}'] = []`
}

function toGetter(): string {
  const transformCode = transform
    ? `fragments.map(${transform.toString()})`
    : 'fragments'
  return `(function() { const fragments = globalThis['${globalKey}'] ?? []; return ${transformCode}; })()`
}
```

### Config generation — fragments + Liquid

Internal and user fragment bundles are concatenated; collector setup scripts and getters are injected into the Liquid template. One function owns the whole panda.config write.

```ts
// src/system/config/createPandaConfig.ts (excerpt)
const userFragments = (await bundleFragments({ files: fragmentFiles }))
  .map(({ bundle }) => `;${bundle}`)
  .join('\n')
const bundles = [internalFragments, userFragments].filter(Boolean).join('\n')

const collectorGetters = collectors.map(c => c.toGetter()).join(', ')

const rendered = await engine.parseAndRender(templates.panda, {
  baseConfig: JSON.stringify(base),
  collectorSetups: collectors.map(c => c.toScript()).join('\n'),
  bundles,
  deepMergePartial: templates.deepMerge,
  collectorGetters,
})

mkdirSync(dirname(outputPath), { recursive: true })
writeFileSync(outputPath, rendered, 'utf-8')
```

---

For minimal versions of the same patterns (worker, logic, event wiring), see **README.md** in this package.

---

## Workers (workers.json) and thread pool

`workers.json` is the **manifest for the thread pool** ([Piscina](https://github.com/piscinajs/piscina)). Each key is a worker name; each value is the source path to that worker’s entry file. The pool is created from this manifest in `src/lib/thread-pool/registry.ts`: `workers` is the pool instance, and `workerEntries` (derived from the same keys) feeds tsup so each worker is built to `dist/cli/${name}/worker.mjs`. Sync calls `initPool({ config, cwd })` during bootstrap, then each init calls `workers.runWorker(name, payload)` to spawn a worker in a separate thread. Workers subscribe to events and return `KEEP_ALIVE` so the process stays running.

| Worker | Path | Role |
|--------|------|------|
| watch | `src/watch/worker.ts` | File watcher; emits watch events |
| virtual | `src/virtual/worker.ts` | Copies project files into virtual dir, applies transforms |
| config | `src/system/config/worker.ts` | Eval fragments, generate panda.config.ts |
| panda | `src/system/panda/worker.ts` | Panda codegen / CSS (when wired) |
| packager | `src/packager/worker.ts` | Bundle packages, write package.json, install/symlink |
| packager-ts | `src/packager/ts/worker.ts` | Generate .d.ts from TS source (tsdown), write to outDir |

---

## Sync Pipeline

1. **Bootstrap** (`sync/bootstrap.ts`): load user config, setCwd/setConfig, initPool, initEventBus → SyncPayload.
2. **Inits** run: virtual, watch, system config, (panda), packager — each spawns its worker.
3. **Virtual**: on `run:virtual:copy:all` copies files from `config.include` into `.reference-ui` (or outDir), applies transforms, emits `virtual:complete` / `virtual:fs:change`.
4. **Config**: on `run:system:config` runs fragment collection + Liquid template, writes `panda.config.ts`, and emits the portable `baseSystem` artifact.
5. **Panda**: on `run:panda:codegen` / `run:panda:css` runs Panda; after cssgen, layer post-processing updates the current `baseSystem.css` and appends any configured upstream `layers[].css`.
6. **Packager**: bundles `@reference-ui/system`, `@reference-ui/react`, and `@reference-ui/styled`, writes package metadata, and installs/symlinks them into the consumer project.
7. **Type packager**: emits `.d.mts` files into the same generated package tree, then emits the final ready signal.

---

## Fragments System

### Purpose

Fragments configure the **styled system** (Panda). They define tokens, recipes, utilities, etc. They are **config-only**; no runtime code. They are bundled as IIFEs and injected into generated `panda.config.ts` so Panda can run without the styled package existing first.

### Fragment collector (`src/lib/fragments/`)

- **createFragmentCollector(config)** → collector with: `collect`, `init`, `getFragments`, `cleanup`, `toScript`, `toGetter`.
- **globalThis** slot holds an array; user code calls e.g. `tokens({ ... })` which pushes to that array.
- **toScript()**: JS string to init the slot in generated config (e.g. `globalThis['__refTokensCollector'] = []`).
- **toGetter()**: IIFE string that reads and optionally transforms fragments for the template.

### Scanning & bundling

- **scanForFragments({ include, functionNames, exclude, cwd })**: glob for files that call given function names.
- **bundleFragments({ files })**: bundle each file to a self-contained IIFE string (no `@reference-ui/styled` in fragments).
- **collectFragments({ files, collector, tempDir })**: run bundles in a temp context, call collector.getFragments() → array of collected values.

### Config generation (`src/system/config/`)

- **createPandaConfig(options)**:
  - Takes `outputPath`, `fragmentFiles`, `collectors`, optional `baseConfig`, optional `internalFragments` (pre-bundled CLI internal fragments).
  - Bundles user fragment files, concatenates `internalFragments` + user bundles.
  - Renders Liquid template (`panda.liquid`) with baseConfig, collector setup scripts, bundle code, collector getters.
  - Writes `panda.config.ts`.

Internal fragments are injected **before** user fragments so CLI’s tokens/recipes are always present.

---

## Dual Styled Systems (Internal vs User)

- **Internal**: CLI build uses fragments to generate `src/system/styled/` (panda.config + Panda codegen). Used for CLI development; tsconfig paths alias `@reference-ui/styled` to that output.
- **User**: `ref sync` generates `.reference-ui/` (config + styled output). User app resolves `@reference-ui/styled` to `.reference-ui/styled` (symlink or bundler alias).

Same fragments pipeline; two contexts (internal build vs ref sync). Primitives and APIs always import from `@reference-ui/styled`; bundler/tsconfig resolve it per context.

---

## Build / Styled Package (`src/system/build/styled/index.ts`)

1. **Scan** for token fragments (`tokens(...)`), collect fragment file paths.
2. **Separate** internal fragment files (e.g. `system/internal/`) from rest.
3. **Bundle** internal fragments → write `src/system/config/internal-fragments.mjs`.
4. **createPandaConfig** with those fragment files, `internalFragments` from the bundle, baseConfig for internal (outdir `'.'`, etc.).
5. **Run Panda codegen** from `src/system/styled` (e.g. `panda codegen --silent`).
6. **Write metadata.json** (fragment count, output path, timestamp).

Prebuild script: `pnpm prebuild` → `tsx src/system/build/primitives/index.ts && tsx src/system/build/styled/index.ts`.

---

## Virtual Layer (`src/virtual/`)

- **Purpose**: Copy project files (by `config.include`) into a virtual directory (e.g. `.reference-ui/virtual` or similar), apply transforms so files work with Panda (e.g. rewrite `@reference-ui/styled` imports, MDX→JSX).
- **copy-all.ts**: fast-glob with config.include, for each file calls **copyToVirtual** (copy + transform), emits `virtual:fs:change` and finally `virtual:complete`.
- **transform.ts**: delegates to **transforms** (e.g. rewrite-css-imports, rewrite-cva-imports, mdx-to-jsx).
- Worker subscribes to `run:virtual:copy:all`, runs copyAll(payload), emits when done.

---

## Packager (`src/packager/`)

- **Packages** (from `packages.ts`): **@reference-ui/system**, **@reference-ui/react**, **@reference-ui/styled** — each has PackageDefinition (name, entry, bundle, exports, copyDirs, etc.).
- **Bundler** (`bundler/`): esbuild for bundling; copyDirectories; writePackageJson; optional transform for TS files.
- **run.ts**: orchestrates bundling each package into target dir (e.g. `.reference-ui/`).
- **install.ts**: can run symlink-dir or package manager so `node_modules/@reference-ui/*` point to `.reference-ui/*`.
- Worker listens for completion events, runs packager when system is ready.

### TypeScript packager (`packager/ts/`)

- **Separate worker** (`ts/worker.ts`) for perf: listens for `packager:complete`, runs `.d.ts` generation, emits `packager-ts:complete`.
- **compile/**: spawns `tsdown` (via `lib/child-process`) to emit `.d.mts` from source entries; writes into outDir (same tree as bundles so symlinks expose types).
- **install/**: `installPackagesTs(cwd, packages)` — uses `resolveCorePackageDir` / `resolveCorePackageDirForBuild` (workspace CLI when in node_modules for correct tsconfig).
- **Sync flow**: `sync:complete` fires on `packager-ts:complete`; when `config.skipTypescript` the packager worker emits `packager-ts:complete` after `packager:complete` so sync still completes.

---

## Config Layer (`src/config/`)

- **loadUserConfig(cwd)**: resolve and load user config (e.g. ref.config or from package).
- **setConfig / setCwd**: store in module state for workers (and getCwd() in workers).
- **validate**: schema/validation for ReferenceUIConfig.
- **constants**: outDir name (`.reference-ui`), config file names.

### Compatibility note

There are still a few legacy `@reference-ui/cli` compatibility paths in config loading and bundling. They exist only to ease the package rename; they are not part of the intended long-term `@reference-ui/core` architecture.

---

## Paths & Entries

- **lib/paths**: getVirtualDirPath, getCwd, ref-config resolution, core-dist paths.
- **entry/system.ts** and **entry/react.ts**: public entry points for @reference-ui/system and @reference-ui/react bundles.

---

## Watch

- **@parcel/watcher** (or similar) on project files.
- Emits **watch:change** (or similar); orchestration can re-emit `run:virtual:copy:all` or `run:system:config` for incremental sync.

---

## Clean

- **ref clean**: deletes output directory (config.outDir). Main thread only; no workers. Used for fresh state before tests or full sync.

---

## Legacy Cli Transition

The rename has effectively flipped: `reference-core` is the primary platform, and `reference-cli` is now the legacy package name.

What still remains to finish:

- remove `@reference-ui/cli` compatibility handling from config load/eval paths once downstream configs have moved
- sweep comments, docs, and examples that still present `reference-cli` as active
- keep only the historical notes that still contain useful product ideas, such as the `extendSystem(baseSystem)` concept

Those removal tasks are tracked in `ROADMAP.md`.

---

## Codebase Layout (Summary)

```
src/
├── events.ts                 # Event type union (Events)
├── index.ts                  # CLI entry (commander)
├── build/
│   └── styled.ts             # Internal styled build (prebuild)
├── clean/                    # ref clean command
├── config/                   # User config load, validate, constants
├── entry/                    # system.ts, react.ts (packager entries)
├── lib/
│   ├── event-bus/            # BroadcastChannel, emit, on, init
│   ├── fragments/             # Collector, scan, bundle, collect
│   ├── log/
│   ├── paths/
│   ├── run/
│   ├── thread-pool/           # Piscina pool, workers, registry, KEEP_ALIVE
│   └── microbundle/
├── packager/                 # packages, bundler, run, worker, install, ts/ (dts worker + compile, install)
├── sync/                     # bootstrap, command, complete, events
├── system/
│   ├── api/                  # tokens collector, etc.
│   ├── config/               # createPandaConfig, Liquid, base, runConfig, worker, init
│   ├── events.ts
│   ├── internal/             # Internal token fragments
│   ├── panda/                # codegen, worker, init
│   └── styled/               # Generated internal styled output (gitignored)
├── virtual/                  # copy, copy-all, transform, worker, init, events
├── watch/                    # worker, init, events
└── workers.json              # Worker manifest for pool + tsup entries
```

---

## Adding a New Module

1. Add entry to **workers.json** (name → source path).
2. Create **worker.ts**: flat `on(event, handler)` list; emit ready; return KEEP_ALIVE.
3. Create **logic** modules: pure handlers (receive payload, emit events).
4. Create **init.ts**: call `workers.runWorker(name, payload)`.
5. Add **event types** to a domain `events.ts` and to `src/events.ts`.
6. Wire in **orchestration**: in a central flow module, `on('x:ready', () => emit('run:x:...'))` and `on('x:complete', () => emit('next:step'))`.
7. Call init from sync command (or bootstrap) so worker spawns when sync runs.

See **src/virtual/** for a full example (worker, copy-all, init, events).

---

## Dependencies (Notable)

- **piscina**: worker threads pool.
- **BroadcastChannel**: event bus (built-in).
- **liquidjs**: panda.config template.
- **esbuild**: fragment bundling, packager bundles.
- **fast-glob**: virtual file discovery.
- **@parcel/watcher**: file watching.
- **symlink-dir**: packager install step.

---

This document expands the README with full pipeline, events, fragments, dual-system, build, virtual, and packager details in one place.
