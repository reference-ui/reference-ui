# Build Pipeline

This folder is reserved for build-focused pipeline logic.

Its job is to define how Reference UI packages are built in containerized, reproducible environments.

That includes work such as:

- building internal packages in a known environment
- producing artifacts that can be handed to testing and release stages
- standardizing the build graph so local and CI execution behave the same way

This area should become the source of truth for package builds instead of relying on scattered scripts and CI-only setup.

## Current Inputs To Replace Or Absorb

Today, build responsibilities are spread across several places:

- `.github/workflows/test.yml`
	- installs dependencies
	- compiles the rust native binary before tests
- `.github/workflows/rust-compile.yml`
	- runs cross-target native compilation for release artifacts
- `.github/workflows/docs.yml`
	- compiles rust artifacts needed by docs builds
	- stages native artifacts before building the docs site
- `scripts/fixture-build-cache.mjs`
	- caches and short-circuits fixture package builds based on file hashes

## Intended Dagger Responsibility

The `build/` area should become the place where we define:

- standard package build environments
- native artifact compilation
- build caching and reuse across stages
- handoff artifacts for testing and release

The important shift is that build behavior should be described once in the pipeline and then reused everywhere else.

That means:

- tests consume build outputs from the pipeline
- release consumes build outputs from the pipeline
- docs can consume build outputs from the pipeline

instead of each workflow rebuilding slightly differently.