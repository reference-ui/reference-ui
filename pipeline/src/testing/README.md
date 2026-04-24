# Testing Pipeline

This folder is reserved for Dagger-owned testing orchestration.

The goal is to let the pipeline manage the environment and execution model for tests while existing test packages continue to own the assertions themselves.

The main consumer of that model is `packages/reference-e2e`, which should keep its Playwright tests but stop owning most of the environment setup logic.

## Current Testing Surface

Today, testing behavior is split between:

- root and package `pnpm` scripts (for example `pnpm run test:ci:unit`, `pnpm run test:ci:e2e`) run locally or in your CI
- `packages/reference-e2e`
	- matrix definitions
	- sandbox composition and dependency installation
	- dev server startup and environment preparation
	- Playwright test execution and artifact collection

This is the area where we are currently doing the most hand-rolled environment orchestration.

## Migration Direction For `reference-e2e`

`reference-e2e` already has valuable browser tests.

The problem is that it currently owns too much infrastructure.

The direction here should be:

- keep test files, helpers, fixtures, and assertions in `reference-e2e`
- move sandbox and environment ownership into the Dagger pipeline
- expose a bridging API that gives `reference-e2e` the operations it needs without making it own the infrastructure layer

That bridge can eventually cover capabilities such as:

- editing files inside a pipeline-owned sandbox
- triggering sync/build steps
- resetting test state
- reading pipeline-owned outputs and artifacts

## Main Testing Categories

- `matrix/` — matrix testing across environment combinations such as React version and bundler choice
- distribution testing — package the real outputs, publish them into a fake or local npm-style registry, and verify install/use flows the way real users would experience them
- unit testing — run unit test suites inside a known containerized environment instead of assuming the host machine matches CI

## Intended Boundary

The testing pipeline should own:

- container setup
- dependency and package installation strategy
- matrix entry definitions
- startup and execution orchestration
- artifact and log collection

The test packages themselves should keep owning:

- test files
- helpers and fixtures
- assertions and expected behavior

That split keeps the pipeline focused on reliability and reproducibility rather than becoming a second test framework.

## How The Testing Categories Map

- matrix testing
	- should absorb the current React x bundler environment matrix from `packages/reference-e2e`
	- Dagger owns the containerized environment combinations
	- `reference-e2e` keeps owning the actual Playwright tests
- distribution testing
	- should exercise publish-style package outputs against fake or local registry flows
	- this is the natural evolution of the current downstream smoke direction in `pipeline/src/downstream-smoke.ts`
	- this should primarily consume artifacts from `pipeline/src/registry/`
- unit testing
	- should run unit suites in explicit container environments rather than assuming the host or ad hoc runner state
	- this should absorb the same commands your CI runs today (see root `package.json` and `pnpm pipeline`)

## Intended Outcome

The outcome we want is:

- fewer bespoke scripts for creating test environments
- less duplicated setup across CI job definitions
- higher confidence that local test runs and CI test runs mean the same thing

The testing pipeline should make the environment boring and predictable so the actual tests can stay focused on behavior.