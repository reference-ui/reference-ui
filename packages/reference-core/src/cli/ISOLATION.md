# Isolation — Per-Consumer Outputs

Multiple consumers (reference-lib, reference-docs, etc.) run `ref sync` in the same monorepo. Without isolation, they overwrite each other's outputs because they share physical paths through symlinked `@reference-ui/core`.

---

## 1. Problem: Shared State

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

## 7. Sync Flow (Post-Isolation)

1. **initSystem** — createPandaConfig → writes `core/.ref/panda-<slug>.config.ts`
2. **initPackager** — initial bundle; uses `core/src/system` if consumer system not yet built
3. **initGen** — Panda `generate()` with cwd=consumer, outdir=`consumer/.reference-ui/internal/system`
4. **createBaseSystem** — reads `consumer/.reference-ui/internal/system/styles.css`, writes baseSystem.mjs
5. **Packager** — copies from consumer system; esbuild alias redirects `../system/*` to consumer
6. **ref sync complete** — consumer has isolated output
