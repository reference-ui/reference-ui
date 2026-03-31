# tsdown programmatic API — sourced from `research/tsdown-main`

This file documents the **Node/programmatic surface** of [tsdown](https://github.com/rolldown/tsdown) as implemented in this repo’s vendored copy: **`research/tsdown-main`**. Paths below are relative to that directory unless stated otherwise.

**Package version in tree:** `0.21.4` (`research/tsdown-main/package.json`).

---

## 1. How you invoke the same code as the CLI

- **CLI binary** (`package.json` `"bin": { "tsdown": "./dist/run.mjs" }`) runs `src/run.ts`, which calls `runCLI()` from `src/cli.ts`.
- The default command parses flags into a **`UserConfig`-shaped object** and does:

```ts
const { build } = await import('./build.ts')
if (input.length > 0) flags.entry = input
await build(flags)
```

So **`build(inlineConfig)` is the single integration point** the CLI uses. Anything you can pass from the command line maps onto the same object you pass to `build()` (plus `InlineConfig`-only fields like `config`, `configLoader`, `filter`).

---

## 2. `package.json` exports (what to import)

| Subpath | Resolves to | Purpose |
| ------- | ----------- | ------- |
| `tsdown` | `src/index.ts` (dev) / `dist/index.mjs` | **Main programmatic API** |
| `tsdown/config` | `src/config.ts` | `defineConfig`, `mergeConfig`, `UserConfig` types (re-exports from `./config/index.ts`) |
| `tsdown/internal` | `src/internal.ts` | FS helpers, small utils — **not** the build API |
| `tsdown/plugins` | `src/plugins.ts` | Rolldown plugins re-exported for advanced use |
| `tsdown/run` | `src/run.ts` | CLI entry (same as bin) |

**Main entry (`src/index.ts`) exports:**

```ts
export { build, buildWithConfigs } from './build.ts'
export { defineConfig, mergeConfig } from './config.ts'
export { resolveUserConfig } from './config/options.ts'
export * from './config/types.ts'
export { enableDebug } from './features/debug.ts'
export { globalLogger, type Logger } from './utils/logger.ts'
export * as Rolldown from 'rolldown' // @ignore in docs
```

---

## 3. `build(inlineConfig?: InlineConfig): Promise<TsdownBundle[]>`

**File:** `src/build.ts`

### 3.1 Signature and logging

- Default argument: `{}`.
- Sets **`globalLogger.level`** from `inlineConfig.logLevel || 'info'` **before** resolving config.
- Calls **`resolveConfig(inlineConfig)`** from `src/config/index.ts`, which returns `{ configs: ResolvedConfig[], files: string[] }` (list of loaded config file paths for watch/reload).
- Returns **`buildWithConfigs(configs, configFiles, () => build(inlineConfig))`** — the third argument is a **restart** callback used when watch mode reloads config or entries.

### 3.2 Config resolution pipeline (exact comment from `src/config/index.ts`)

```
// InlineConfig (CLI)
//  -> loadConfigFile: InlineConfig + UserConfig[]
//  -> resolveWorkspace: InlineConfig (applied) + UserConfig[]
//  -> resolveUserConfig: ResolvedConfig[]
//  -> build

// resolved configs count = 1 (inline config) * root config count * workspace count * sub config count
```

- **`cwd`:** If present on `inlineConfig`, it is **`path.resolve`’d** before loading.
- **Failure:** If no resolved configs, **`throw new Error('No valid configuration found.')`**.

### 3.3 `buildWithConfigs` (exported but not for apps)

- Marked **“Internal API, not for public use”** / `@private`.
- Runs **`Promise.all(configs.map(... buildSingle ...))`** — one Rolldown build (or watch) per resolved config.
- Implements **clean** (`cleanOutDir`), **restart** (disposes callbacks, `clearRequireCache` from `import-without-cache`, then calls the injected `_restart` which re-invokes `build(inlineConfig)`).
- **Watch:** If any config has `watch`, registers **keyboard shortcuts** (`shortcuts(restart)`) and registers each bundle’s **`[Symbol.asyncDispose]`** with the dispose list.
- **Non-watch:** If `devtools.ui` is set on a config, starts **Vite DevTools UI** after build (`startDevtoolsUI`).

**Recommendation:** Use only **`build()`** from application/monorepo scripts; treat **`buildWithConfigs`** as internal.

---

## 4. `buildSingle` behavior (per `ResolvedConfig`)

**File:** `src/build.ts` (private function, drives each bundle)

- Runs hooks: **`build:prepare`**, then **`clean()`** (debounced single clean for the run).
- **Rolldown:** Either **`rolldownWatch(configs)`** or **`rolldownBuild(configs)`** depending on `config.watch`.
- **`initBuildOptions`:** Builds one or more **`BuildOptions[]`** via `getBuildOptions` — if **`format === 'cjs' && dts`**, a **second** `getBuildOptions(..., true, ...)` is pushed (CJS + DTS split build).
- **`postBuild`:** `copy(config)`, `buildExe(config, chunks)`, first time calls **`done(bundle)`** (package completion / `bundleDone`), then **`build:done`** hook with `{ ...context, chunks }`. **`executeOnSuccess`** for `--on-success` style behavior uses an `AbortController`.
- **Watch watcher:** On file change, can **`restart()`** if the changed path is in **`configFiles`** or matches **`endsWithConfig`** regex (config reload). Glob entry changes (create/delete) can also restart when `rawEntry` is glob-based.

---

## 5. Types: `UserConfig`, `InlineConfig`, `ResolvedConfig`

**File:** `src/config/types.ts` (re-exported from main entry).

### 5.1 `InlineConfig extends UserConfig`

Extra fields **only for CLI or programmatic “driver”**:

| Field | Purpose |
| ----- | ------- |
| `config?: boolean \| string` | `false` = skip config file; string = explicit file or directory for discovery |
| `configLoader?: 'auto' \| 'native' \| 'unrun'` | How `tsdown.config.*` is loaded (**default `'auto'`**) |
| `filter?: RegExp \| Arrayable<string>` | Narrow workspace / multi-config builds |

### 5.2 `UserConfigFn` / `UserConfigExport`

Config files can export a function:

```ts
(inlineConfig: InlineConfig, context: { ci: boolean }) => Awaitable<Arrayable<UserConfig>>
```

### 5.3 `ResolvedConfig`

Fully normalized options: includes **`entry: Record<string, string>`** (post-glob), optional **`rawEntry`**, **`nameLabel`**, **`format: NormalizedFormat`**, **`clean: string[]`**, **`pkg`**, **`logger`**, **`deps: ResolvedDepsConfig`**, **`root`**, etc. Many `UserConfig` fields are merged or stripped during resolution (see type: deprecated fields omitted).

### 5.4 `TsdownBundle` (`src/utils/chunks.ts`)

```ts
interface TsdownBundle extends AsyncDisposable {
  chunks: RolldownChunk[]
  config: ResolvedConfig
  inlinedDeps: Map<string, Set<string>>
}
```

Use **`await using`** / **`Symbol.asyncDispose`** in watch mode to tear down watchers cleanly.

---

## 6. `defineConfig` and `mergeConfig`

**File:** `src/config.ts`

- **`defineConfig`** is a **no-op** helper for typing and ergonomics; it returns the argument unchanged (supports `UserConfig`, `UserConfig[]`, or `UserConfigFn`).

**File:** `src/config/options.ts`

- **`mergeConfig(defaults, overrides)`** uses **`defu(overrides, defaults)`** from `defu` — **overrides win**, nested objects merge.

---

## 7. `resolveUserConfig`

**File:** `src/config/options.ts` (exported from main index)

- **`resolveUserConfig(userConfig, inlineConfig): Promise<ResolvedConfig[]>`** is marked **internal / `@private`** in JSDoc but **is public on the package export**.
- It is the step that turns a single **`UserConfig`** (+ inline overrides) into one or more **`ResolvedConfig`** objects (after workspace expansion, package.json discovery, etc.).

Use when building **custom tooling** that needs resolved options without running the full `build()`; for normal builds, **`build()`** is enough.

---

## 8. Subpath `tsdown/plugins`

**File:** `src/plugins.ts` re-exports:

- `DepPlugin`, `NodeProtocolPlugin`, `ReportPlugin`, `ShebangPlugin`, `WatchPlugin`

These are **Rolldown**-oriented plugins used inside tsdown; you add them via **`UserConfig.plugins`** (Rolldown plugin model), not esbuild.

---

## 9. Debugging and logging

- **`enableDebug`** — from `src/features/debug.ts`, used by CLI when `--debug` is passed.
- **`globalLogger`** — `Logger` type from `src/utils/logger.ts`; `build()` sets level from `logLevel`.

---

## 10. Node.js version

**File:** `src/run.ts`

- If Node **&lt; 22.18.0**, prints a **deprecation warning** (support removal planned).
- **`package.json` `engines.node`:** `>=20.19.0` — CLI warning is stricter than `engines`.

---

## 11. Parity checklist (programmatic vs CLI)

| Concern | Notes |
| ------- | ----- |
| Entry | CLI positional `files` → `flags.entry`; API set `entry` explicitly |
| Config file | Default: load `tsdown.config.*`; **`config: false`** matches `--no-config` |
| Workspace / filter | Same `workspace`, `filter` as CLI `-W`, `-F` |
| Watch | `watch: true` or watch path; bundles need async disposal |

---

## 12. Full `UserConfig` field list

The authoritative shape is **`src/config/types.ts`** (`export interface UserConfig`). It includes (non-exhaustive): `entry`, `format`, `outDir`, `clean`, `dts`, `tsconfig`, `platform`, `target`, `sourcemap`, `treeshake`, `minify`, `shims`, `watch`, `ignoreWatch`, `plugins`, `deps` (replaces deprecated `external` / `noExternal`), `workspace`, `exports`, `publint`, `attw`, `unused`, `hooks`, `copy`, `css`, `exe`, `devtools`, `report`, `alias`, `define`, `fromVite`, `unbundle`, `root`, `nodeProtocol`, `cjsDefault`, legacy aliases (`bundle`, `publicDir`, …), etc.

For generated HTML reference, upstream runs TypeDoc into `docs/reference/api/` (see `docs/.vitepress/scripts/generate-reference.ts`).

---

## 13. Related paths in this repo

| Path | Role |
| ---- | ---- |
| `research/tsdown-main/src/build.ts` | `build` / `buildWithConfigs` / watch / hooks |
| `research/tsdown-main/src/config/index.ts` | `resolveConfig` |
| `research/tsdown-main/src/config/file.ts` | `loadConfigFile`, `tsdown.config` discovery |
| `research/tsdown-main/src/cli.ts` | `runCLI`, passes flags to `build` |
| `research/tsdown-main/docs/advanced/programmatic-usage.md` | Upstream short doc |

---

## 14. How this helps **Reference UI** replace **tsup** (this monorepo)

This section ties **`research/tsdown-main`** to **where we actually use tsup today** in `reference-ui`, so you can plan a real migration instead of hand-waving “use tsdown.”

### 14.1 Where tsup shows up today (inventory)

| Location | What it does | Typical pain |
| -------- | ------------- | ------------ |
| **`packages/reference-core/src/packager/ts/compile/index.ts`** | **`compileDeclarations`** spawns **`npx tsup`** with `--dts-only`, temp `tsconfig`, single entry → copy one `.d.ts` / `.d.mts` into the consumer tree | **Highest leverage:** `PERFORMANCE.md` attributes multi-second startup to **repeated** `tsup` **process** spawns; this is the hot path. |
| **`packages/reference-core/tsup.config.ts`** | Bundles CLI entries + **worker entries** from `workerEntries` → `dist/cli/*.mjs` | Every `ref` build; uses `onSuccess` for Liquid templates. |
| **`packages/reference-rs/tsup.config.ts`** | Multi-entry **`js/`** → `dist/` with **`dts: true`** | `build:js`; native addon + TS wrappers. |
| **`packages/reference-lib/tsup.config.ts`** | `src/` entries → `dist/` + DTS | Consumer library package. |
| **Fixtures / e2e** | `pnpm exec tsup` in extend fixture (`reference-e2e`, fixtures) | CI / fixture builds. |

Everything above is either **CLI `tsup`** or **`spawn('npx', ['tsup', ...])`**. None of it uses **in-process** bundling today — so you pay **Node boot + tsup boot + esbuild** (tsup) **per invocation**.

### 14.2 What programmatic **tsdown** changes for us

1. **Same API the CLI uses** — `build(inlineConfig)` (`§3`). You can **`import { build } from 'tsdown'`** inside `compileDeclarations` (or a small worker dedicated to DTS) and pass options **inline** with **`config: false`** so nothing is read from disk except what you pass (`§5.1`). That removes **`npx`** and the **extra child** indirection for that step.

2. **One warm runtime** — After the first `import`, V8 keeps the module graph warm. Repeated `compileDeclarations` calls can reuse the same process (they already run inside the long-lived `ref sync` process). You still pay **Rolldown + rolldown-plugin-dts** work per package, but you **drop the fixed cost of spawning a new Node + tsup** each time — which is exactly what **`PERFORMANCE.md`** calls out.

3. **Option mapping from our current tsup CLI** — Today `compileDeclarations` effectively passes:

   - single file entry  
   - `--dts-only`  
   - `--tsconfig <temp>`  
   - `--format esm`, `--out-dir <tmp>`, `--target es2020`  
   - `--external react` / `react-dom`  

   In tsdown terms you want the same **semantics**: **`entry`**, **`tsconfig`**, **`format: ['esm']`**, **`target`**, **`dts: true`**, and externals via **`deps.neverBundle`** (or the deprecated `external` compat layer — prefer **`deps`** for new code). See upstream **Migrate from tsup** in `research/tsdown-main/docs/guide/migrate-from-tsup.md`.

4. **`defineConfig` / `tsdown.config.ts`** — Package-level builds (`reference-core`, `reference-rs`, `reference-lib`) can move from **`tsup.config.ts`** to **`tsdown.config.ts`** the same way upstream does: **`import { defineConfig } from 'tsdown'`**, `build` script calls **`tsdown`** instead of **`tsup`**. Hooks like **`onSuccess`** have a parallel in **hooks** (`build:done`, etc.) — map case-by-case.

5. **Workers** — `workerEntries` are still separate bundle outputs; tsdown supports **multi-entry** `entry: { ... }` like tsup. You keep one config file that lists `public`, `index`, `config`, and each worker path.

### 14.3 Concrete migration order (pragmatic)

1. **`compileDeclarations` → in-process `build()`**  
   - Add **`tsdown`** as a dependency of **`@reference-ui/core`** (version aligned with what you trust from **`research/tsdown-main`** or npm).  
   - Replace **`spawnMonitoredAsync('npx', ['tsup', ...])`** with **`await build({ config: false, cwd: cliDir, ... })`** mirroring options.  
   - Keep **`findDtsFile(tmpOut)`** + atomic copy until you trust output layout (tsdown’s layout is different from tsup’s — our comment in **`find-dts.ts`** already says tsup’s output was unpredictable; **verify** `.d.mts` path once).  

2. **DTS-only semantics** — Today we rely on **`--dts-only`** (no JS emit). tsdown’s model is **`dts: true`** alongside normal bundling; confirm whether you can **omit** JS output for a single-entry tool run or need to emit and delete. If tsdown always emits JS for that graph, acceptable short-term: emit to **`tmpOut`** and **only copy** the declaration (same as now: temp dir is deleted in `finally`). Validate bundle size/time.

3. **Flip package `tsup.config.ts` files** — **`reference-core`**, **`reference-rs`**, **`reference-lib`**: migrate config shape and **`package.json`** scripts from **`tsup`** / **`tsup --watch`** to **`tsdown`**. Run parity tests (`test:ci:unit`, e2e).

4. **Fixtures / e2e** — Swap **`pnpm exec tsup`** for **`pnpm exec tsdown`** once configs exist.

### 14.4 What programmatic API does **not** solve by itself

- **Algorithmic cost** of generating declarations for huge graphs — you still need **`isolatedDeclarations`** / good **`tsconfig`** (tsdown docs **`docs/options/dts.md`** in the vendored tree) if you want **oxc**-fast DTS.  
- **Worker bundling** still needs a **correct `tsdown.config`** — migrating off tsup for workers does not require programmatic API; it’s a **config + CLI** swap unless you inline **`build()`** in a custom script.  
- **Breaking differences** — tsdown defaults differ from tsup (e.g. **`format`**, **`clean`**) — read **Migrate from tsup** before flipping production builds.

### 14.5 Files to read in Reference UI when implementing

| File | Why |
| ---- | --- |
| `PERFORMANCE.md` | Motivation and current DTS phase timings |
| `packages/reference-core/src/packager/ts/compile/index.ts` | Exact tsup argv to replicate |
| `packages/reference-core/src/packager/ts/compile/find-dts.ts` | Where emitted `.d.ts` / `.d.mts` is picked up |
| `packages/reference-core/tsup.config.ts` | CLI + worker entry map to port |
| `research/tsdown-main/docs/guide/migrate-from-tsup.md` | Option renames and defaults |

---

*Scan of `research/tsdown-main` as of the tree in this workspace; if you upgrade the vendored copy, re-read `src/index.ts` and `src/build.ts` for drift. Reference UI migration notes in §14 are specific to this repo’s tsup call sites.*
