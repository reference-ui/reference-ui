# Build Pipeline

This folder is reserved for build-focused pipeline logic.

Its job is to define how Reference UI packages are built in containerized, reproducible environments.

That includes work such as:

- building internal packages in a known environment
- producing artifacts that can be handed to testing and release stages
- publishing those freshly built artifacts into the pipeline-local registry
- standardizing the build graph so local and CI execution behave the same way

This area should become the source of truth for package builds instead of relying on scattered scripts and CI-only setup.

## Current Inputs To Replace Or Absorb

Build responsibilities still touch a few surfaces outside pure Dagger:

- `.github/workflows/rust-compile.yml` (called only from `.github/workflows/docs.yml`)
	- compiles Linux native artifacts used when building the docs site on GitHub Actions
- `scripts/fixture-build-cache.mjs`
	- caches and short-circuits fixture package builds based on file hashes

Package builds, test-time native builds, and release-time multi-target native work should converge on the pipeline and your primary CI, not on per-workflow YAML copies.

## Intended Dagger Responsibility

The `build/` area should become the place where we define:

- standard package build environments
- native artifact compilation
- build caching and reuse across stages
- handoff artifacts for testing and release
- publication of build outputs into the pipeline-local registry

The important shift is that build behavior should be described once in the pipeline and then reused everywhere else.

The important ownership boundary is:

- `build/` is responsible for creating artifacts
- `build/` is responsible for pushing those artifacts into the local registry
- `release/` is not where artifacts should be built for the first time

That means:

- tests consume build outputs from the pipeline
- the registry consumes build outputs from the pipeline
- release consumes build outputs from the pipeline
- docs can consume build outputs from the pipeline

instead of each workflow rebuilding slightly differently.