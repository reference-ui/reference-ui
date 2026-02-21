# Thread Pool

This folder owns worker execution through Piscina.

## What this does

- [index.ts](index.ts) creates a shared Piscina pool and runs jobs.
- [workers.ts](workers.ts) is the worker registry (`name -> worker file path`).

## Why the path logic looked complex

Worker resolution crosses multiple runtime contexts:

- **Source layout** (`src/cli/...`) while developing in the monorepo.
- **Built layout** (`dist/cli/...`) when running the packaged CLI.
- **Piscina requirement**: worker targets must be concrete module files with a default export.
- **ESM/CJS output differences** can change emitted file names/extensions.

Those constraints made “simple relative paths” fragile in different execution modes.

## Current decision (deterministic)

`workers.ts` now resolves workers to the **dist runtime** path only:

- `dist/cli/virtual/worker.mjs`

This is intentional:

- Removes branching/fallback behavior.
- Keeps one canonical runtime contract.
- Matches how the CLI binary is executed in practice.

## Invariant for new workers

For each worker module:

1. Add a worker entry file under `src/cli/<module>/worker.ts` with a default export.
2. Ensure build emits `dist/cli/<module>/worker.mjs`.
3. Register it in [workers.ts](workers.ts) using the dist path.

## Troubleshooting

If workers fail with `ERR_MODULE_NOT_FOUND`:

- Confirm `pnpm --filter @reference-ui/core build` succeeded.
- Verify the emitted file exists at `packages/reference-core/dist/cli/<module>/worker.mjs`.
- Check the registry path in [workers.ts](workers.ts).

## Why many `init-*.cjs` / `init-*.mjs` files appear

This comes from chunk hashing + non-clean builds:

- `tsdown` emits hashed chunk names (for example `init-ABCD1234.cjs`).
- [tsdown.config.ts](../../../tsdown.config.ts) uses `clean: false`.
- Old hashed chunks are retained across builds, so `dist/cli` can accumulate many `init-*` files.

Use a fresh build when needed:

- `pnpm --filter @reference-ui/core --dir packages/reference-core run build:fresh`

## Worker URL utility

`workers.ts` stays intentionally simple by delegating path resolution to [utils.ts](utils.ts):

- `resolveWorkerUrl('virtual/worker.mjs')`
- Internally resolves `@reference-ui/core` dir via `resolveCorePackageDir(...)`
- Produces an absolute path under `dist/cli/...`

This keeps worker registration declarative while centralizing runtime path logic in one place.

## Dependency chain

- [index.ts](index.ts)
  - `piscina`
  - `os` (`cpus`)
  - [workers.ts](workers.ts)
- [workers.ts](workers.ts)
  - [utils.ts](utils.ts)
- [utils.ts](utils.ts)
  - `node:path`
  - `node:url`
  - [../utils/resolve-core.ts](../utils/resolve-core.ts)
- Worker module (virtual)
  - `dist/cli/virtual/worker.mjs` (built from `src/cli/virtual/worker.ts`)
