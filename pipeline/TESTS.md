# Matrix Tests Plan

## Goal

Each package under `matrix/` should have a consistent test layout and a consistent runner model.

The matrix system should treat both of these as first-class:

- Vitest for unit-style and consumer-level test execution
- Playwright for browser-facing e2e execution

This document describes how matrix package tests should be structured before we implement heavier full-matrix orchestration.

## Package-Level Test Structure

Instead of a single `tests/` folder, matrix packages should move toward a split like this:

- `unit/`
- `e2e/`

Intended meaning:

- `unit/`
  - Vitest-driven tests
  - unit and integration-style checks
  - type-aware runtime checks inside the synthetic consumer
- `e2e/`
  - Playwright-driven tests
  - browser-facing behavior
  - downstream runtime and bundler validation

This gives matrix packages a stable convention that matches how we already think about the two runner types.

## Runner Availability

Each matrix package should be able to rely on both test runners being available:

- Vitest
- Playwright

That does not mean every package must use both.

It means the matrix test system should provision both as supported options so packages can opt into:

- Vitest only
- Playwright only
- both Vitest and Playwright

The package should not have to invent custom runner bootstrapping each time.

## Default Responsibilities

Vitest should be the default for:

- unit tests
- type and runtime checks that stay inside the consumer package
- lightweight integration checks

Playwright should be the default for:

- browser-driven tests
- app or bundler smoke flows
- end-to-end behavior where DOM, navigation, and browser runtime matter

## Expected Directory Shape

Example:

```text
matrix/typescript/
  unit/
    react.test.tsx
  e2e/
    smoke.spec.ts
```

This is only the structural direction.

We do not need to migrate every package immediately, but this should be the standard we build around.

Current repo state:

- existing Vitest matrix suites should live under `unit/`
- Playwright matrix suites should live under `e2e/`
- `matrix/playwright` is the reference e2e fixture for this layout

## Pipeline Expectations

The matrix pipeline should set up the test suites, not leave that setup to each package ad hoc.

That means pipeline should eventually own:

- creating the synthetic consumer
- installing package dependencies
- installing or preparing runner prerequisites
- deciding which runner to invoke for each job
- collecting logs and artifacts consistently

## Runner Model

The internal planning model should eventually treat test runner type as structured job data.

Example categories:

- `runner: vitest`
- `runner: playwright`

This is better than inferring execution from arbitrary command strings at the last minute.

## Default Targeted Package Behavior

Normal targeted package testing should stay cheap.

If a user runs:

- `pnpm pipeline test --packages=@matrix/typescript`

the package should run in one default environment only.

Runner selection for that default mode should be conservative:

- run the package's standard Vitest coverage first
- only run Playwright if the package explicitly has e2e coverage configured for default mode

The heavy path belongs to full mode, not to the default local package-test loop.

## Full Mode

The future heavy command is:

- `pnpm pipeline test --full`

This is where we should expect:

- environment expansion
- multiple packages
- parallel containers
- Vitest and Playwright jobs
- a TUI to monitor execution

Default package testing and full compatibility testing should not have the same cost profile.

## Playwright Image Contract

Playwright jobs do not run on the default Node base image.

The matrix runner selects the container image explicitly:

- Vitest-only packages use `node:24-bookworm`
- packages with `e2e/` coverage use `mcr.microsoft.com/playwright:v<version>-jammy`

The `<version>` segment is derived from the matrix package's pinned `@playwright/test` version.

This contract is intentional:

- the Playwright image already contains the browser binaries and OS dependencies
- e2e jobs avoid `playwright install --with-deps` during container startup
- the package version and image version stay in lockstep

Matrix packages should therefore pin `@playwright/test` to an exact version instead of a caret range.

## Playwright Browser Cost

Playwright browser installation can be expensive.

If every container installs browsers from scratch, full-mode runs will be unnecessarily slow.

We should plan around browser caching before large-scale Playwright adoption in matrix.

### Caching Options To Explore

Option 1:

- cache the Playwright browser install directory with a Dagger cache volume
- set `PLAYWRIGHT_BROWSERS_PATH` to a stable cached path
- key the cache by browser package version and container image

Option 2:

- use a prebuilt container image that already contains Playwright browser dependencies and browser binaries
- keep the image version pinned and explicit

Option 3:

- split OS-level browser dependencies from browser binary downloads
- cache what can be cached and bake the rest into the base image

Current direction:

- use a dedicated Playwright-capable base image for e2e jobs
- keep the image version explicit and derived from the pinned package version

Future optimization to revisit only if needed:

- cache additional Playwright assets on top of the base image when a real bottleneck remains

## Container Resources

Current observed container CPU capacity is:

- `2` CPUs

This comes from the current Docker backend, not from an explicit CPU limit in the matrix runner.

Right now the matrix runner enforces a memory minimum, but it does not set a custom CPU quota for containers.

That means container CPU availability currently tracks whatever the Docker backend exposes.

Implication:

- parallel orchestration should treat available CPU as a runtime constraint
- full-mode concurrency should likely be bounded by detected CPU capacity, not just by number of jobs

## Orchestration Direction

Because we expect both Vitest and Playwright jobs, orchestration should distinguish between lighter and heavier work.

Vitest jobs are generally cheaper.

Playwright jobs are generally heavier because they may involve:

- browser installation or restore
- browser startup
- server startup for e2e targets
- artifact capture such as traces, videos, and screenshots

The future scheduler should understand this well enough to avoid starting too many heavy browser jobs at once on a low-core Docker backend.

## Recommended Next Steps

1. Standardize matrix package structure around `unit/` and `e2e/`.
2. Define an internal runner model that distinguishes Vitest and Playwright jobs.
3. Add a Playwright browser caching strategy before scaling e2e coverage.
4. Detect available CPU in full mode and use it to bound parallel container execution.
5. Build the TUI around per-job status, runner type, environment, logs, and artifacts.