# Matrix Testing

This folder is reserved for Dagger-owned matrix testing in the pipeline.

It is one part of the broader testing pipeline described in `pipeline/src/testing/README.md`.

The goal is to let Dagger manage the environment matrix while the actual browser tests continue to live in `packages/reference-e2e`.

That means this area is intended to grow into the place where we define and run isolated combinations such as:

- React version
- bundler/runtime choice
- container image and OS-level dependencies
- install strategy for internal `@reference-ui/*` packages

## What Dagger Owns

The pipeline should own the infrastructure side of matrix testing:

- building or packing the packages under test
- creating a clean containerized sandbox per matrix entry
- installing the correct dependencies for that entry
- starting the correct dev/build command for that entry
- collecting logs and test artifacts

## What `reference-e2e` Keeps Owning

The existing e2e package should remain the source of truth for:

- Playwright test files
- selectors and helpers
- routes and fixtures
- assertions and expected behavior

In other words:

- Dagger decides where and how a matrix entry runs
- `reference-e2e` decides what gets tested inside that matrix entry

## Why This Exists

Today the repo does a lot of its own sandbox and matrix orchestration. Matrix testing here is intended to move that environment logic into Dagger so the pipeline becomes easier to reason about, easier to reproduce locally, and closer to the way CI actually runs.

## Expected Direction

As this grows, this folder will likely contain:

- matrix entry definitions
- discovery of matrix-enabled fixture packages via `matrix.json`
- shared container setup for bundlers
- commands for running `reference-e2e` against each entry
- artifact and log collection helpers

This is one of the main testing directions for the pipeline.

## Current Commands

- `pnpm pipeline:test:pipeline`
	- tests pipeline code only
	- unit-level checks for helpers and workflow logic
- `pnpm pipeline:test:matrix`
	- tests matrix inputs and bootstrap wiring
	- currently reuses the single pipeline-managed Verdaccio registry, binds that shared host registry into Dagger, installs a minimal consumer from the `matrix/install` package, runs `ref sync`, and then runs that package's standard `pnpm test` command inside the clean container
	- when the required linux Rust target package is missing from local tarballs and public npm, the pipeline builds that native artifact inside Dagger, stages it into the generated npm target package, and loads that package into the local registry before the consumer install step
	- this keeps matrix/testing self-contained: internal test installs should come from the pipeline registry, not from whatever happens to be published publicly
	- pass `--trace` to stream Dagger's execution trace when you want low-level execution profiling instead of the default higher-level matrix story
	- on macOS, it will start Colima automatically when the active Docker context is `colima` and the VM is not already running
	- on low-memory Docker or Colima setups, the command now fails fast before starting Dagger; `pnpm pipeline:test:matrix` expects at least 4 GiB of Docker VM memory because the containerized consumer install can otherwise be OOM-killed with exit code `137`