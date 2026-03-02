# Isolation — Phased Approach

**Strategy: System-only first.** Isolate the core build so `src/system/` is ephemeral (generated, not source-of-truth). Defer per-consumer isolation until that's stable.

---

## Phase 1: System-Only (Current Focus)

**Goal:** Make `reference-core/src/system/` generated, not committed. Fix the chicken-egg where config loading needs system before Panda creates it.

### In scope

- Bootstrap stubs + Panda generate during core build (see §4)
- `src/system/` symlinked to `.reference-ui/internal/system` inside core
- `src/system/` in `.gitignore`
- Sync flow unchanged: Panda still runs `cwd: coreDir`, output goes to core's system (shared by all consumers — we accept this for Phase 1)

### Out of scope (deferred to Phase 2)

- Per-consumer output dirs (`consumer/.reference-ui/internal/system`)
- Packager preferring consumer system over core
- Any gate on `packager:consumer-ready` or spawning gen from system

### Why this first

We tried full per-consumer isolation and hit race conditions (config:ready before gen runs, BroadcastChannel to idle workers, etc.). Narrowing to system-only reduces variables and gets the ephemeral core build right before tackling consumer isolation.

---

## Phase 2: Per-Consumer Outputs (Deferred)

Multiple consumers run `ref sync` in the same monorepo. Without isolation, they overwrite each other's outputs because they share physical paths through symlinked `@reference-ui/core`. Tasks A–H below apply when we resume Phase 2.

---

## 1. Problem: Shared State (Phase 2)

### What Gets Shared When Core Is Symlinked

| Artefact | Shared Location | Problem |
| -------- | -------------- | ------- |
| **src/system/** | `reference-core/src/system/` | Panda writes styles, jsx, patterns, recipes, types. Last writer wins. |
| **panda.config.ts** | `reference-core/panda.config.ts` | Per-consumer config overwritten. |
| **.ref/** | `reference-core/.ref/` | Eval fragments, panda-entry, collected JSON. |

### Why Symlinks Cause It

- Consumers depend on `@reference-ui/core` (workspace)
- pnpm symlinks `node_modules/@reference-ui/core` → `packages/reference-core`
- `resolveCorePackageDir(cwd)` returns the same core path for all consumers
- Any output under `reference-core/` is shared

### Symptoms

- `Could not resolve "../../../system/css/index.js"` — system missing or wrong consumer's output
- Token bleed — one package's tokens appear in another
- Styled/factory import errors — jsx/factory.js overwritten for different consumer
- Flaky tests — order of sync/test changes which output "wins"

---

## 2. Solution: Per-Consumer Layout

Move mutable outputs into the consumer project:

```
consumer/.reference-ui/
├── panda.config.ts        # Per-consumer Panda config (createPandaConfig)
├── virtual/               # Virtual file copies for Panda scanning
└── internal/              # Internal outputs (not user-editable)
    ├── system/            # Panda outdir (styles.css, jsx, patterns, recipes, tokens)
    └── .ref/              # Eval temp (panda-entry, collected JSON)
```

**Core still needs its own `src/system/`** — generated during core build for bootstrap (see §4).

---

## 3. Implementation Tasks (Migration Order)

Use this list when breaking work into PRs. Order matters.

### Task A: Path Helpers

- [ ] `getRefDir(consumerDir)` → `consumer/.reference-ui/internal/.ref`
- [ ] `getSystemDir(consumerDir)` → `consumer/.reference-ui/internal/system`
- [ ] `getConsumerSlug(consumerDir)` → deterministic hash for per-consumer subdirs under core
- [ ] `getPandaConfigPath(consumerDir)` → `consumer/.reference-ui/panda.config.ts`

**Files:** `lib/path.ts`

---

### Task B: createPandaConfig

- [ ] Write config to `coreDir/.ref/panda-<consumerSlug>.config.ts` (config must live under core so Panda's loader resolves `@pandacss/dev`)
- [ ] When `userProjectDir` set: replace `outdir: 'src/system'` with `outdir: '.reference-ui/internal/system'` in bundled output
- [ ] Replace `src/**` include with absolute core src path when cwd=consumer
- [ ] Replace `.virtual/**` with `consumer/.reference-ui/virtual/**`
- [ ] Use `getRefDir(userProjectDir)` for panda-entry temp (or `coreDir/.ref` when no consumer)

**Files:** `createPandaConfig.ts`

---

### Task C: Panda Execution (gen/code, gen/css)

- [ ] Run Panda with `cwd: consumer`, `outdir: '.reference-ui/internal/system'`
- [ ] Prefer `coreDir/.ref/panda-<slug>.config.ts` over `coreDir/panda.config.ts`
- [ ] Config path must be under core (Panda resolves `@pandacss/dev` from core's node_modules)

**Files:** `gen/code.ts`, `gen/css.ts`

---

### Task D: createBaseSystem

- [ ] When `systemDir` provided: read `systemDir/styles.css` instead of `coreDir/src/system/styles.css`
- [ ] Use `coreDir/.ref/<consumerSlug>/` for collect script (Node needs core for `@pandacss/dev`)

**Files:** `createBaseSystem.ts`

---

### Task E: Packager

- [ ] `copyStylesToReactPackage`: prefer `getSystemDir(consumer)/styles.css`, fallback to `coreDir/src/system/styles.css`
- [ ] Bundler: when `systemDir` exists, use esbuild plugin to redirect `../system/*` imports to consumer system dir
- [ ] Install: pass `systemDir` into `installPackage` so copy/bundle use consumer output

**Files:** `packager/install/packages.ts`, `packager/bundler/esbuild.ts`, `packager/install/package.ts`

---

### Task F: Eval / runCollectScript

- [ ] Eval temp: `coreDir/.ref/eval/<consumerSlug>/` (must stay under core for module resolution)
- [ ] `runCollectScript` refDir: `getRefDir(consumer)` when consumer given, else `coreDir/.ref`

**Files:** `eval/runner.ts`, `eval/index.ts`, `collectors/runCollectScript.ts`

---

### Task G: Core Build Bootstrap (Chicken-Egg Fix)

- [ ] Add `build:system` script that generates `coreDir/src/system/` before tsup
- [ ] Implement bootstrap stubs + Panda generate (see §4)
- [ ] Add `src/system/` to core `.gitignore` (generated artifact)
- [ ] Build order: `build:native` → `build:system` → `tsup`

**Files:** `scripts/build-system.ts`, `scripts/bootstrap-system-stubs.ts`, `package.json`, `.gitignore`

---

### Task H: Verification

- [ ] `pnpm dev` with lib + docs: both sync, neither corrupts the other
- [ ] Delete `core/src/system`, run `pnpm build` from root: succeeds
- [ ] Delete `consumer/.reference-ui`, run `ref sync`: recreates consumer output
- [ ] Each consumer's tokens appear only in its own build

---

## 4. Chicken-Egg: Core Needs system Before system Exists

### The Cycle

1. **Panda generates `src/system/`** from config
2. **Config loading** (`panda.base.ts`) imports `styled/index` → `primitives/recipes` → `styled/api` → **`styled/api/runtime`** (css.ts, recipe.ts)
3. **css.ts and recipe.ts** import from `../../../system/css/index.js`
4. **system doesn't exist yet** → resolution fails

So: system is produced by Panda, but loading the config that Panda needs pulls in code that imports system.

### Fix: Bootstrap Stubs

1. **Before Panda runs:** write minimal stub files to `src/system/` so imports resolve.
2. **Panda runs:** `generate()` overwrites stubs with real output.

Stub coverage must match every path imported during config load:

- `css/index.js` — `css`, `css.raw`, `cva`, `cx`, `sva` (Panda-generated exports)
- `types/index.js`, `types/recipe.js`, `types/*.d.ts` — `SystemStyleObject`, `RecipeVariantRecord`, etc.
- `helpers.js`, `patterns/box.js`, `jsx/index.js`, `recipes/index.js`, `tokens/index.js` — used by primitives, entry/react, etc.

**Files:** `scripts/bootstrap-system-stubs.ts`, `scripts/build-system.ts`

### Why Not createPandaConfig for Core Build?

`createPandaConfig` bundles the config with esbuild. The bundle includes `styled/api` which imports `css.ts`/`recipe.ts` → system. Esbuild fails before Panda can run.

### Why Not panda.base.ts Only?

Panda's config loader (esbuild) also resolves imports when loading `panda.base.ts`. Same failure. Stubs are required either way.

---

## 5. Failure Modes & Debugging

| Failure | Cause | Fix |
| ------- | ----- | --- |
| `Could not resolve "../../../system/css/index.js"` | system missing or packager using wrong path | Ensure `build:system` ran; check packager uses `getSystemDir(consumer)` when present |
| Token bleed (docs tokens in lib) | Shared system or shared config | Verify Panda outdir is `consumer/.reference-ui/internal/system`; config under `core/.ref/panda-<slug>.config.ts` |
| `panda.config.ts not found` | createPandaConfig didn't run or wrong path | initSystem runs before gen; config path from `core/.ref/panda-<slug>.config.ts` or `core/panda.config.ts` |
| Build hangs after Panda | Event loop kept alive (event bus, etc.) | Call `process.exit(0)` after build script completes |
| Stale system after isolation | Old core `src/system` committed | Add `src/system/` to `.gitignore`; rely on `build:system` |
| Packager bundles wrong system | systemDir not passed or doesn't exist | Packager falls back to core `src/system`; consumer system must exist after first Panda run |

---

## 6. Key Files Reference

| Area | Files |
| ---- | ----- |
| Paths | `lib/path.ts` |
| Config | `createPandaConfig.ts`, `panda.base.ts` |
| Panda run | `gen/code.ts`, `gen/css.ts` |
| Base system | `createBaseSystem.ts` |
| Packager | `packager/install/packages.ts`, `packager/bundler/esbuild.ts` |
| Bootstrap | `scripts/build-system.ts`, `scripts/bootstrap-system-stubs.ts` |
| Eval | `eval/runner.ts`, `eval/index.ts`, `collectors/runCollectScript.ts` |

---

## 7. What We Did / Tried / Went Wrong

### Phase 1 (System-Only) — Current State

**To implement:** Bootstrap stubs + `build-panda-system.ts` script that:
1. Writes minimal stubs so config loading can resolve `../../../system/*`
2. Symlinks `src/system` → `coreDir/.reference-ui/internal/system`
3. Runs Panda generate (writes to that dir via symlink)
4. `process.exit(0)` so script doesn't hang
5. Add `src/system/` to core `.gitignore`
6. Add `build:system` before tsup in build pipeline

**Sync flow stays simple:** Panda runs `cwd: coreDir`, output goes to `coreDir/src/system` (symlink target). Packager copies from core. No consumer-specific paths, no extra gates.

### Phase 2 (Per-Consumer) — What We Tried & Reverted

We attempted full per-consumer isolation and reverted due to complexity:

1. **Path helpers** — Added `getSystemDir`, `getRefDir`, `INTERNAL_SYSTEM_OUTDIR`. Reverted.
2. **createPandaConfig** — When `userProjectDir` set: outdir override, `src/**` replacement. Reverted.
3. **gen/code** — `cwd: consumer` so output in consumer dir. Reverted.
4. **copyStylesToReactPackage** — Prefer consumer system, return `{ fromConsumer }`. Reverted.
5. **packager:consumer-ready gate** — Wait for consumer styles before exit. Reverted.
6. **System spawns gen** — Guarantee config before gen. Still hung (BroadcastChannel to idle workers?).

### Why Phase 2 Hung

- **Gen worker misses config:ready** — Piscina race: config:ready can fire before gen registers.
- **Packager in cold mode** — Packager returns after initial bundle; when gen emits `system:compiled`, does the idle worker receive it via BroadcastChannel?
- **Gates** — `packager:complete` fires from first run; we exited before gen finished.

### Open Questions (for Phase 2)

- Does BroadcastChannel deliver to idle Piscina workers?
- Alternative: cold sync in main thread (no workers)?
- Or: packager blocks on a promise until system:compiled processed?

---

## 8. Sync Flow (Phase 1 — System-Only)

1. **initPackager** — initial bundle (core's `src/system` must exist from core build)
2. **initSystem** — createPandaConfig → `core/panda.config.ts`; emits config:ready
3. **initGen** — runs Panda `cwd: coreDir`, output → `coreDir/src/system`
4. **createBaseSystem** — reads `coreDir/src/system/styles.css`
5. **Packager** — copies from `coreDir/src/system` (cold: initial run; watch: system:compiled)
6. **ref sync complete** — gates: packager:complete [, packager-ts:complete]; process.exit(0)
