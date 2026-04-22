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

Right now that removes the managed local registry state and the cached build fingerprints.

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

Inside the pipeline package, that routes to Node's built-in test runner through `tsx` and currently covers the package preparation helpers used before `pnpm pack`.

Testing and release can then consume the same registry-hosted artifacts instead of rebuilding ad hoc.

## Current scope

This first pass assumes the repo already has current build outputs for the packed packages. The registry staging command intentionally reuses those outputs by packing with `--ignore-scripts` instead of rebuilding during the packaging step.

The next step after this registry slice is to move the upstream package builds themselves fully inside the Dagger pipeline and bind the local registry into testing and release flows.