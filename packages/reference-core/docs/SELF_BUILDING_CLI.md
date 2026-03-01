# Self-Building CLI

> **The CLI builds itself.** Generated files stay out of git. Build the CLI, then run its own build command to generate system.

---

## Two Different Contexts

### 1. CLI runs on the user's project (`src/cli`)

When a user runs `ref sync` from their app (e.g. reference-docs), the **built CLI** (`dist/cli/index.mjs`) runs. Its code lives in `src/cli/`. The CLI:

- Runs in the user's project `cwd`
- Does eval, virtual copy, createPandaConfig, Panda codegen, packager
- Writes generated output into reference-core (system, panda.config.ts, .virtual, codegen)

This is the normal flow: user has an app → runs ref sync → CLI generates everything.

### 2. Building reference-core itself

When we **build** the reference-core package (e.g. after a fresh clone), we run `pnpm build`. The key insight:

- **Tsup only bundles `src/cli/`** — and the CLI has no imports from `src/system/`. It uses createPandaConfig, runPandaCodegen, workers, etc. (build-time tooling).
- So we can **build the CLI first**, then **run the CLI's own build command** to generate system.

```
build:native  →  tsup (CLI)  →  ref build  (CLI bootstraps itself)
```

---

## Generated Content (Not Committed)

| Output | Source | Purpose |
|--------|--------|---------|
| `src/system/` | Panda codegen | CSS runtime, patterns, recipes, types (css, cva, cx, box, etc.) |
| `panda.config.ts` | createPandaConfig (eval + bundle) | Merged Panda config from extendPandaConfig() calls |
| `styled-system/` | Panda (legacy path) | Same as system, alternate output |
| `src/styled/props/box.ts` | createBoxPattern | Merged box pattern extensions |
| `src/styled/font/font.ts` | createFontSystem | Font tokens, @font-face, recipe, pattern |
| `codegen/` | User MDX/components | Generated from virtual copy |
| `.ref/` | CLI cache | Temp files for config bundling |

These belong in `.gitignore`. The build pipeline must produce them before they're needed.

---

## Approach: Build Module in CLI

Instead of a standalone `scripts/generate-system.ts` that uses tsx to import from cli, we:

1. **Create `src/cli/build/`** — a module containing the bootstrap logic (createBoxPattern → createFontSystem → createPandaConfig → panda).
2. **Add `ref build` command** — the CLI registers a `build` subcommand that invokes this module.
3. **Build order in package.json:**
   ```
   build: build:native && tsup && ref build
   ```

**Why this works:**
- Tsup bundles only `src/cli/` — no system imports in the CLI.
- After tsup, the CLI binary exists. We run it in-place (reference-core package dir).
- `ref build` runs the same logic sync uses (createPandaConfig, etc.) — one code path.
- No tsx, no separate scripts to keep in sync with CLI imports.

---

## Bootstrap Order

**Building reference-core (fresh clone):**

```
pnpm install
    ↓
pnpm build  (in reference-core)
    ↓
  build:native     → native addon
  tsup             → dist/cli/*  (CLI bundle, no system deps)
  ref build        → createBoxPattern → createFontSystem → createPandaConfig → panda
                     (generates box.ts, font.ts, panda.config.ts, src/system/)
```

**User runs ref sync (from their app, e.g. reference-docs):**

```
ref sync   (or ref sync --watch)
    ↓
  CLI (dist/cli) runs in user's cwd
  eval → createPandaConfig → Panda → packager
  writes into reference-core: system, panda.config.ts, .virtual, codegen
```

---

## Chicken–Egg (Why Order Matters)

Source files (primitives, styled/api/runtime) import from `src/system/`. So system must exist for the package to be usable. But system is produced by Panda → needs `panda.config.ts` → produced by createPandaConfig → bundles `styled/*` which can pull in runtime code that imports system.

**Why CLI-first works:** The CLI bundle (`src/cli/`) does **not** import from `src/system/`. It only uses build-time helpers. So we bundle the CLI first, then run `ref build`, which generates everything.

**If createPandaConfig's bundle hits system imports** before system exists, we either:
- **A)** Esbuild plugin in microbundle: stub `**/system/**` and `@reference-ui/system` with empty modules when bundling for config.
- **B)** Restructure: config-only files (e.g. `font.ts`) import from `../api/internal` instead of `../api`, so they never pull in `api/runtime` (which needs system).

---

## Implementation Plan

### Step 1: Create `src/cli/build/` module

- New module: `src/cli/build/index.ts` (or `runBuild.ts`)
- Export `runBuild(coreDir: string): Promise<void>` that runs in order:
  1. `createBoxPattern(coreDir)` → `styled/props/box.ts`
  2. `createFontSystem(coreDir)` → `styled/font/font.ts`
  3. `createPandaConfig(coreDir)` → `panda.config.ts`
  4. Run Panda CLI directly (`execSync` / `spawnSync` with `node_modules/.bin/panda`, `cwd: coreDir`)
- Resolve `coreDir` via `resolveCorePackageDir()` from `../lib/resolve-core` when run from ref build (cwd = reference-core).

### Step 2: Add `ref build` command

- In `src/cli/index.ts`, register `build` command.
- Action: resolve core dir (e.g. `resolveCorePackageDir(process.cwd())` or walk up from script location), call `runBuild(coreDir)`.

### Step 3: Update package.json build

```json
"build": "pnpm run build:native && tsup && ref build"
```

### Step 4: Add generated files to .gitignore

- `panda.config.ts`
- `src/styled/props/box.ts`
- `src/styled/font/font.ts`
- `src/system/` (and `styled-system/` if used)
- `codegen/`
- `.ref/`

### Step 5: Chicken-egg mitigation (if needed)

If `createPandaConfig` fails on fresh clone due to styled files importing system:
- **A)** Add esbuild plugin in `microbundle` (or a config-specific bundle path) to stub system imports.
- **B)** Change `font.ts` (and similar) to import from `../api/internal` instead of `../api` so they don't pull in `api/runtime`.

---

## What Lives Where

| Concern | Location |
|---------|----------|
| CLI for user's `ref sync` | `src/cli/` → built to `dist/cli/` |
| Bootstrap logic | `src/cli/build/` |
| createPandaConfig, createBoxPattern, createFontSystem | `src/cli/system/config/` |
| Panda invocation | In `src/cli/build/` — direct exec, same as `runPandaCodegen` |
| Ignore generated output | `.gitignore` |

---

## Related Files

- `src/cli/` – CLI (sync, build commands)
- `src/cli/build/` – Bootstrap module (to be created)
- `tsup.config.ts` – Bundles src/cli → dist/cli
- `package.json` – build scripts
- `src/cli/system/config/panda/createPandaConfig.ts` – Eval + bundle → panda.config.ts
- `src/cli/system/gen/runner.ts` – Panda codegen (or inline equivalent in build module)
- `.gitignore` – system, panda.config.ts, box.ts, font.ts, styled-system, codegen, .ref
