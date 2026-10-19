# Reference UI Pipeline

Dagger-backed delivery graph for the monorepo: build, test, and release run here. The CLI entry point is `pnpm pipeline` (the `cli` command tree); shared constants live in the pipeline config (`MATRIX_CONFIG`) and dependency pins.

## Setup

One-time macOS bootstrap from the repo root:

```sh
pnpm setup:local          # Xcode CLT, Dagger, Colima, Docker CLI; starts Colima
pnpm setup:local -- --dry-run   # print without executing
```

## Commands

```sh
pnpm pipeline build            # build public packages, pack, load into local Verdaccio
pnpm pipeline test             # matrix fanout across React × bundler (see matrix README)
pnpm pipeline test --packages=@matrix/chain-t8 --react=react19
pnpm pipeline setup --sync     # regenerate pipeline-managed matrix fixture files
pnpm pipeline registry start   # run the managed Verdaccio registry (inspection/debugging)
pnpm pipeline release          # publish staged release tarballs to npm (root alias: pnpm release)
pnpm pipeline release plan     # show what the next release would publish
pnpm pipeline dev docs|lib     # registry-backed dev workspace under .pipeline/dev
pnpm pipeline clean            # delete managed registry state, build cache, Dagger engine cache
```

Inside the pipeline package, `test:pipeline` runs the Node test runner over pipeline unit tests and `typecheck` runs `tsc --noEmit`.

## Managed registry

- Verdaccio at `http://127.0.0.1:4873`; the managed registry module owns its Verdaccio config and on-disk storage.
- Unmatched packages proxy to the npmjs uplink with `maxage: 30d` and no tarball caching.
- Matrix containers reach it as the service `registry` (`http://registry:4873`).
- The build flow writes tarballs plus `.pipeline/registry/manifest.json`, then loads only versions missing from the registry.

## Matrix test modes

Each matrix contract declares `react` (react17/18/19, single or array with the first entry as default) and `bundlers` (vite7, webpack5).

- Default run: each package's first declared React runtime with its latest declared Vite bundler, else its first declared bundler.
- `--react` pins one declared runtime; `--full` expands every declared React × bundler.
- Packages with Playwright tests run in the Playwright image matching their `@playwright/test` pin (else the managed default); others run in `node:24-bookworm`.
- Matrix runs fail fast when Docker/Colima is short on CPU, memory, or disk; Dagger-backed commands start Colima automatically when the active Docker context is `colima`.

## Staging excludes

Registry staging omits `.git` and `node_modules` at any depth, and `target`, `dist/cargo`, `.turbo`, `coverage` at the package root. Excludes match paths relative to the package root, never bare basenames: publishable `dist/` trees must survive the copy.

Subsystem details live in the [pipeline source overview](./src/README.md).
