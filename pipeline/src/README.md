# Pipeline Source Layout

This folder is the high-level source layout for the Dagger pipeline.

The rough category split is:

- `build/` — build packages and produce the artifacts we want to test or release
- `release/` — release and publish workflows for the packages we ship
- `registry/` — private pipeline registry infrastructure for packaged artifacts
- `testing/` — containerized testing flows, including matrix, distribution, and unit testing

These categories are meant to absorb the responsibilities that used to be spread across GitHub Actions, ad hoc scripts, and package-local glue. In this repo, **GitHub Actions is limited to docs** (`.github/workflows/docs.yml`, which reuses `.github/workflows/rust-compile.yml` for Linux bindings used by the docs build). Everything else—build, test, release—should go through the pipeline.

Remaining helper scripts include things like `scripts/fixture-build-cache.mjs` and `scripts/pipeline/run-if-env-absent.mjs` where packages need small conditional wrappers.

## Why This Exists

The goal of the pipeline is to reduce reliance on one-off scripts and the current GitHub Actions wiring.

Dagger is intended to become the place where we define:

- how packages are built
- how pipeline-local package artifacts are stored and consumed
- how releases are verified and published
- how tests run inside reproducible containerized environments

That should give us a delivery path that is easier to reason about locally, more reliable in CI, and closer to the real environments our users depend on.

The rough direction is:

- GitHub Actions stays a thin layer for **docs publish** only
- Dagger is the actual execution graph for build, test, and release
- local execution matches the same pipeline commands your CI should run
- CI outside GitHub should call the same pipeline definition rather than re-implementing it

## Expected Shape

As the pipeline grows, this folder should become the main home for the actual delivery graph:

- build stages
- release stages
- test environments and orchestration
- shared helpers that support those flows

The intent is not to move test assertions into the pipeline.

Instead:

- the pipeline should own environment orchestration
- the existing packages should keep owning their domain logic and tests

## Mapping From Today

At a high level, the current system maps into this layout like this:

- `build/`
	- native compilation for **docs** still uses `.github/workflows/rust-compile.yml` as a callable workflow from the docs workflow; full multi-target native builds for release belong in the pipeline / your CI
	- fixture/package build caching concerns are handled by `scripts/fixture-build-cache.mjs`
- `release/`
	- release planning, tarball staging, and npm publish live in `pipeline/src/release/` and are invoked via `pnpm pipeline release`
- `registry/`
	- pipeline-local registry for packed artifacts consumed by testing and release
- `testing/`
	- unit and e2e execution is owned by package scripts and `pipeline/src/testing/`; nothing in GitHub Actions runs the matrix anymore
	- environment/matrix orchestration currently lives in `packages/reference-e2e`
	- downstream/distribution install validation is beginning under `pipeline/src/downstream-smoke.ts`

The intent is to keep execution logic in `pipeline/src` and package scripts, not in duplicated workflow YAML.