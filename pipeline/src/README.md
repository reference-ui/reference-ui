# Pipeline Source Layout

This folder is the high-level source layout for the Dagger pipeline.

The rough category split is:

- `build/` — build packages and produce the artifacts we want to test or release
- `release/` — release and publish workflows for the packages we ship
- `registry/` — private pipeline registry infrastructure for packaged artifacts
- `testing/` — containerized testing flows, including matrix, distribution, and unit testing

These categories are meant to absorb the responsibilities that are currently spread across:

- `.github/workflows/test.yml`
- `.github/workflows/release.yml`
- `.github/workflows/rust-compile.yml`
- `.github/workflows/docs.yml`
- `scripts/release/*`
- selected helper scripts such as `scripts/fixture-build-cache.mjs`

## Why This Exists

The goal of the pipeline is to reduce reliance on one-off scripts and the current GitHub Actions wiring.

Dagger is intended to become the place where we define:

- how packages are built
- how pipeline-local package artifacts are stored and consumed
- how releases are verified and published
- how tests run inside reproducible containerized environments

That should give us a delivery path that is easier to reason about locally, more reliable in CI, and closer to the real environments our users depend on.

The rough direction is:

- GitHub Actions becomes a thin trigger layer, if it remains at all
- Dagger becomes the actual execution graph
- local execution is the primary release path for now
- CI, if retained, should call or observe the same pipeline definition rather than re-implementing it

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
	- native compilation now handled in `.github/workflows/rust-compile.yml`
	- package build/setup steps now repeated in `.github/workflows/test.yml` and `.github/workflows/docs.yml`
	- fixture/package build caching concerns now handled by `scripts/fixture-build-cache.mjs`
- `release/`
	- release target detection now handled by `scripts/release/detect.mjs`
	- publish ordering and npm publish behavior now handled by `scripts/release/publish.mjs`
	- release orchestration now wired through `.github/workflows/release.yml`
- `registry/`
	- the repo does not yet have a dedicated pipeline-local registry layer
	- downstream/distribution validation currently has to work around that absence with direct local tarballs
	- this is the missing shared layer between build, testing, and release
- `testing/`
	- unit and e2e execution now triggered by `.github/workflows/test.yml`
	- environment/matrix orchestration currently lives in `packages/reference-e2e`
	- downstream/distribution install validation is beginning under `pipeline/src/downstream-smoke.ts`

The intent is to move the execution logic into `pipeline/src`, not to keep duplicating it across scripts and workflow YAML.