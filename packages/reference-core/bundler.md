# Bundler Decision Notes (CLI + Thread Pools)

## Context

`@reference-ui/core` is not just a library bundle. It ships a CLI (`ref`) that:

- must execute reliably from `dist/cli/index.mjs`
- launches Piscina workers from concrete runtime files (`dist/cli/virtual/worker.mjs`)
- is consumed by another package (`reference-docs`) during dev, where timing/race issues matter
- needs predictable file paths more than aggressive code-splitting

Current friction:

- hashed chunk files (`init-*.mjs`, `init-*.cjs`) make outputs noisy
- historical use of non-clean builds (`clean: false`) created artifact accumulation
- CLI + worker runtime cares about deterministic output paths

---

## What we actually need

1. Deterministic output paths for CLI and worker entries
2. Stable ESM output for Node runtime (`index.mjs`, `virtual/worker.mjs`)
3. Optional CJS output (nice to have, not always required)
4. Good watch/dev cycle without deleting running artifacts at the wrong time
5. Minimal bundler magic around worker entry resolution
6. Clear control over external dependencies

---

## Option A: Keep `tsdown` (current)

### Pros

- Already integrated
- TS + d.ts workflow is straightforward
- Supports multi-entry out of the box
- External dependency config already in place

### Cons

- Produces hashed chunk artifacts by default in this setup
- Output shape is less obvious for CLI + worker runtime expectations
- Easy to end up with stale chunks if clean behavior is tuned for runtime safety

### Fit for this repo

- Works, but requires discipline around entry strategy and cleanup policy

---

## Option B: Move CLI build to raw `esbuild`

### Pros

- Very explicit control over output files and structure
- Easy to produce deterministic entry outputs (`dist/cli/index.mjs`, `dist/cli/virtual/worker.mjs`)
- Fast builds and simple mental model for Node CLI bundles
- Great fit when runtime paths matter (Piscina worker files)

### Cons

- You must own the build script logic (watch mode, clean strategy, externals, formats)
- d.ts generation is separate (usually `tsc --emitDeclarationOnly`)
- Slightly more maintenance than “zero-config” tooling

### Fit for this repo

- Strong fit for the CLI/thread-pool part of the project

---

## Option C: `tsup`

### Pros

- Simpler than raw esbuild scripting
- Good defaults for TS projects
- Multiple entries + format support

### Cons

- Still abstraction over esbuild; may require digging into behavior for worker edge-cases
- Can still produce output behavior you need to constrain carefully

### Fit for this repo

- Good middle ground if we want less manual scripting than raw esbuild

---

## Option D: `unbuild`

### Pros

- Good package-oriented DX
- Works well for libraries with mixed output targets

### Cons

- More opinionated around package build workflows
- Less direct than raw esbuild for CLI/worker runtime exactness

### Fit for this repo

- Better for package libraries than for this CLI + worker runtime sensitivity

---

## Recommendation

Short term:

- Keep current tool temporarily (stable now), but harden output policy:
  - only keep required entries (`index`, `virtual/worker`)
  - keep deterministic worker registry paths
  - use explicit fresh-clean command when needed

Medium term (recommended):

- Migrate CLI build pipeline to **raw esbuild** via a dedicated build script just for `dist/cli`.
- Keep type generation via `tsc --emitDeclarationOnly` (or retain current d.ts flow if preferred).

Why this recommendation:

- This project’s pain is mostly runtime determinism, not TypeScript transpilation.
- Thread-pool/Piscina worker loading benefits from predictable, explicit output layout.
- esbuild gives the least-surprising behavior for Node CLI + worker files.

---

## Suggested migration shape (incremental)

### Phase 1: Parallel esbuild CLI path (no breaking changes)

1. Add `scripts/build-cli.mjs` in `reference-core` using esbuild multi-entry:

- `src/cli/index.ts`
- `src/cli/virtual/worker.mjs`

2. Emit deterministic files to `dist/cli`:

- `dist/cli/index.mjs`
- `dist/cli/virtual/worker.mjs`

3. Keep the current toolchain in place as fallback while validating parity.

### Phase 2: Thread-pool integration hardening

1. Keep `thread-pool/workers.ts` registry path contract pinned to deterministic outputs.
2. Add a preflight check in thread-pool startup:

- verify resolved worker file exists
- fail with a clear actionable error if missing

3. Add one integration test path for worker startup:

- `runWorker('virtual', payload)` resolves and executes in built output mode.

### Phase 3: Script flip + cleanup policy

1. Flip `package.json` `build` to the esbuild CLI script (plus type generation command if needed).
2. Remove dependency on non-deterministic chunk cleanup strategy (`clean: false` workaround pressure).
3. Keep `build:fresh` as an explicit manual maintenance command, not a required stability fix.

### Phase 4: Optional consolidation

1. Decide whether to keep a hybrid build (CLI via esbuild, other outputs via current tooling) or fully migrate.
2. Remove obsolete config/entries once parity is stable for 1-2 dev cycles.

---

## Expected thread-pool benefits

- Worker registry targets are simpler and always predictable.
- Fewer startup races around missing/rotating output files.
- Better error messages when a worker artifact is missing.
- Less operational weirdness around chunk accumulation and cleanup timing.

---

## Decision criteria checklist

Use this checklist before switching:

- [ ] `ref sync` works from `reference-docs`
- [ ] `ref sync --watch` worker logs/events are visible and stable
- [ ] `dist/cli/virtual/worker.mjs` always exists after build
- [ ] no runtime `MODULE_NOT_FOUND` when root `pnpm dev` starts both projects
- [ ] build times are acceptable
- [ ] type outputs still satisfy consumers
