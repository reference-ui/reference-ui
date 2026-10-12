# PIPELINE.speed — matrix/pipeline runs are slow and balloon to tens of GB

## Objective

Make `pnpm agent test --packages=@matrix/*` (and the underlying `pnpm pipeline …`)
runs **fast (minutes, not ~20)** and **bounded in disk** (no multi-GB/half-million-file
staging). Diagnose the cause, apply the smallest safe fix, and **measure before/after**.

## Confirmed symptoms (measured on this machine)

- `pnpm agent test --packages=@matrix/chain-t16` ran **~20 minutes** with **no visible
  progress** (the driver sat at ~48% CPU building inside Dagger).
- `packages/reference-rs/dist/cargo/debug/deps` held **576,845 object files, 31 GB**;
  `packages/reference-rs/dist/cargo` was **49 GB**.
- `.pipeline/registry/staging` reached **77 GB**.
- Captain already reclaimed ~123 GB: deleted `packages/reference-rs/dist/cargo/debug`
  and `.pipeline/registry/staging` (both gitignored, regenerable). `dist` is now 3.2 GB.

## What we know

- `packages/reference-rs/.cargo/config.toml`:
  ```toml
  [build]
  target-dir = "dist/cargo"
  ```
  So **all** cargo output — debug included — lands **inside `dist/`**.
- `packages/reference-rs/package.json` `build:native` = `napi build --package
  reference-native --platform --release --output-dir dist/native --no-js`
  (release → `dist/cargo/release`; the napi output goes to `dist/native`).
- The pipeline stages a package tree (`.pipeline/registry/staging/reference-ui-rust-*`)
  that **appears to include the entire `dist/cargo` target dir** — the 77 GB — then
  builds/tests inside Dagger. That staging copy + cold rebuild is the 20 minutes.
- `dist` is gitignored (`.gitignore:10`).

## Hypotheses to confirm (open the pipeline source, don't guess)

1. The pipeline's **staging/packaging step copies `dist/cargo`** (the whole cargo
   target) instead of only the publishable artifacts (`dist/native`, `dist/npm`, the
   package.json/files list).
2. The **Dagger build context** (or a `.dockerignore`/context filter) fails to exclude
   `dist/cargo`, `.pipeline/registry/staging`, `node_modules`, `dist/**/cargo`.
3. A **debug** build (from `cargo test`/`cargo build` during dev or in the pipeline)
   writes tens of GB into `dist/cargo/debug`, which is then staged.

## Fix (smallest safe; propose if larger)

- **Keep build artifacts out of the staged/published tree.** Either move
  `target-dir` off `dist/` (e.g. a top-level `target/` or `.cargo-target/`, updated in
  `.cargo/config.toml`), **or** make the staging step copy only the artifact
  subdirs (`dist/native`, `dist/npm`, package files) and never `dist/cargo`.
- **Exclude the heavy paths from the Dagger context** (`dist/cargo/**`,
  `.pipeline/registry/staging/**`, `node_modules`), so a run doesn't ship GBs.
- **Bound the cache:** ensure debug artifacts aren't accumulating unbounded in a
  published tree; add/adjust a cleanup if warranted.

## Scope & guardrails

- Territory: `pipeline/**`, `packages/reference-rs/.cargo/config.toml`, and any
  staging/packaging scripts. This is **test-core** territory — follow
  `.agents/skills/test-core/SKILL.md` and AGENTS.md §3.
- **Do not break hermetic matrix correctness** — the point is speed + size, not
  skipping verification. `pnpm agent test --packages=@matrix/chain-t16` must still
  pass and still be hermetic.
- **Never commit.** Leave changes in the working tree; the captain commits.
- Runners only (`pnpm agent …`); never raw playwright/vitest.
- If the correct fix is larger than a bounded change (e.g. requires CI/publish
  redesign), STOP and report the plan + evidence rather than half-doing it.

## Deliverable (write to `.agents/missions/pipeline-speed/HANDOFF.md`)

1. `Status: DONE|PARTIAL|BLOCKED`.
2. **Root cause** with exact `file:line` (the staging copy site, the context filter,
   and the cargo config).
3. **The fix** (files + diff summary).
4. **Measurements:** before/after wall-time of a real `@matrix/chain-t16` run, and
   before/after size of `.pipeline/registry/staging` + `packages/reference-rs/dist`.
5. 10-line handoff note (what changed, what was proven, caveats, any follow-up).

Final chat message: one line — `PIPELINE.speed STATUS: DONE|PARTIAL|BLOCKED · handoff: <path> · <result + before/after>`.
