# Reference UI Dagger Pipeline

This directory holds the first Dagger-based pipeline entry points for Reference UI.

The current pipeline can now do two separate things:

- drive the workspace build through a pipeline CLI entry point
- stage package artifacts into a local npm-compatible registry

Workspace package roots are configured centrally in `pipeline/config.ts`.

## Structure

The main pipeline areas are:

- `src/build/`: workspace package discovery, hashing, and build orchestration
- `src/registry/`: local Verdaccio lifecycle plus publish-style tarball staging
- `src/clean/`: cleanup of pipeline-managed local state
- `src/lib/`: small shared support modules such as terminal logging

The registry subsystem is split into focused modules because it now owns a real publish-style staging boundary instead of a single monolithic helper file.

Matrix test modes and the managed registry are described below.

## Prerequisites

- local setup completed via `pnpm setup:local` on macOS

## Local setup

For macOS development, run this once from the repository root:

```sh
pnpm setup:local
```

That bootstrap step lives under `pipeline/setup/` and currently handles:

- checking for Xcode Command Line Tools
- installing `dagger`
- installing `colima`
- installing the Docker CLI
- starting `colima` if it is not already running

To inspect the commands without executing them:

```sh
pnpm setup:local -- --dry-run
```

## Usage

From the repository root, the main entry point is now:

```sh
pnpm pipeline build
```

`pnpm build` remains as a short alias, but the intended primary interface is `pnpm pipeline <args>`.

That routes through `pipeline/src/cli.ts`, builds the configured registry packages, reuses the managed local Verdaccio registry, and loads those package artifacts into that registry automatically.

For local testing cleanup:

```sh
pnpm pipeline clean
```

Right now that removes the managed local registry state, the cached build fingerprints, and any long-lived local Dagger engine cache container plus its attached volume.

For the registry slice:

```sh
pnpm pipeline registry start
```

`pnpm pipeline registry start` is now mainly for inspection and debugging. The normal artifact path is `pnpm pipeline build`.

That build flow:

- builds the configured registry-target packages directly from the pipeline instead of recursively invoking the workspace root
- uses the built outputs from that package build step
- packs the public workspace packages into tarballs without re-running `prepack`
- writes a manifest to `.pipeline/registry/manifest.json`
- ensures the managed local Verdaccio registry is running at `http://127.0.0.1:4873`
- loads only the package versions that are missing from that local registry

The registry target set is configured explicitly in `pipeline/config.ts`. That includes the main `@reference-ui/*` packages and any fixture libraries we want available from the virtual registry.

## Pipeline tests

Focused unit tests for extracted pure helpers can be run with:

```sh
pnpm pipeline:test:pipeline
```

Inside the pipeline package, that routes to Node's built-in test runner through `tsx` and is reserved for pipeline code tests.

Matrix bootstrap checks can be run with:

```sh
pnpm pipeline:test:matrix
```

Add `--trace` when you want the raw Dagger execution trace:

```sh
pnpm pipeline test --trace
```

That is the separate entrypoint for the pipeline-owned matrix flow. Right now it validates discovery of real matrix-enabled fixture packages, and later it can grow into the real matrix runner.
It already executes through Dagger, reuses the single pipeline-managed Verdaccio registry by binding that shared host registry into the container graph, and runs the first `matrix/install` smoke scenario in a clean container rather than against host `node_modules`.
On macOS, Dagger-backed entrypoints now check Docker reachability first and automatically start Colima when the active Docker context is `colima` but the VM is not running.
Matrix runs also fail fast when Colima does not have enough free Docker disk left for the containerized install fanout, with remediation that points at `pnpm pipeline clean` or a larger Colima disk.

Testing and release can then consume the same registry-hosted artifacts instead of rebuilding ad hoc.

## Matrix test modes

A matrix package's `matrix.json` declares `react` (`react17`, `react18`, `react19`, or a non-empty array of them; the first unique entry is the default) and `bundlers` (`vite7`, `webpack5`).

- `pnpm pipeline test` runs the whole matrix fanout. `--packages <names>` limits the run to the named packages.
- The default run uses each package's first declared React runtime and its latest declared Vite bundler, or its first declared bundler when none is Vite.
- `--react <runtime>` pins one declared React runtime.
- `--full` expands every declared React runtime and bundler.
- A package with Playwright tests runs in the Playwright image for its `@playwright/test` version, or for the managed default when it declares none. Other packages run in `node:24-bookworm`.

## Managed Verdaccio registry

- The managed registry listens on `http://127.0.0.1:4873`. Its config is `pipeline/src/registry/verdaccio/config.yaml`.
- Its storage is `pipeline/src/registry/.store/storage`. `pnpm pipeline clean` deletes it, and the store is emptied when a package keeps its version but its artifact changes.
- Packages without a more specific rule are proxied to the `npmjs` uplink (`https://registry.npmjs.org/`). That uplink sets `maxage: 30d` and `cache: false`, so Verdaccio does not store the tarballs it fetches from npm.
- Matrix containers bind the host registry as the service `registry`, and `npm_config_registry` is `http://registry:4873`.

## Staging copy excludes

Staging omits `.git` and `node_modules` at any depth, and `target`, `dist/cargo`, `.turbo` and `coverage` at the package root. Excludes match paths relative to the package root, never bare basenames: core, lib, mcp and icons ship their whole `dist/` through `files`, so a bare `dist` match would drop it.

## Current scope

This first pass assumes the repo already has current build outputs for the packed packages. The registry staging command intentionally reuses those outputs by packing with `--ignore-scripts` instead of rebuilding during the packaging step.

The next step after this registry slice is to move the upstream package builds themselves fully inside the Dagger pipeline and bind the local registry into testing and release flows.