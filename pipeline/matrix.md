# Matrix Plan

## Goal

The matrix system should support compatibility testing across environment axes such as React and bundler versions without making the default developer loop slow or noisy.

Related testing structure and runner planning lives in `pipeline/TESTS.md`.

Two modes must exist:

1. Targeted package testing
2. Full compatibility matrix testing

The default must stay cheap.

If a user runs `test` for a specific matrix package locally, pipeline should run that package in one default environment only.

It should not expand across every React and bundler combination unless the user explicitly asks for full matrix coverage.

## Default Behavior

Default behavior for targeted package testing:

- `pnpm --dir ../../pipeline exec tsx src/cli.ts test --packages=@matrix/typescript`
- runs one Dagger consumer job
- uses the default environment
- default React version is the latest React version declared in `matrix.json`
- default bundler should be the package default when bundlers matter

This gives us a practical local workflow:

- matrix packages still exist locally with one workspace `node_modules`
- editor types work
- local `test` remains a thin entrypoint into pipeline
- the actual container execution stays explicit and deterministic

Full matrix coverage must be opt-in.

Examples of explicit full coverage:

- `pnpm pipeline test --full`
- `pnpm pipeline test --packages=@matrix/typescript --full`

The exact CLI flag can be finalized later, but the behavior should be:

- no matrix expansion by default
- full environment expansion only when explicitly requested

## Config Shape

The first schema extension should stay small.

Example:

```json
{
	"matrix": true,
	"name": "typescript",
	"environments": {
		"react": ["18", "19"],
		"bundler": ["vite@5"]
	}
}
```

This is enough for v1.

Rules:

- `matrix` keeps the existing inclusion contract
- `name` keeps the existing logical package identity
- `environments` declares compatibility coverage, not default runtime behavior by itself
- if `environments` is omitted, the package uses pipeline defaults

## Environment Semantics

`environments` should be interpreted as compatibility arrays.

Initial supported axes:

- `react`: string array like `17`, `18`, `19`
- `bundler`: string array like `vite@5`, `webpack@5`

This should remain intentionally conservative.

We do not need arbitrary nested config or plugin-style matrix axes yet.

## Planning Model

We should add a planning layer between discovery and execution.

Flow:

1. Discover matrix packages
2. Read `matrix.json`
3. Resolve the requested execution mode
4. Produce concrete jobs
5. Execute jobs in Dagger

The important design point is that `matrix.json` defines compatibility space, while the planner decides how much of that space to execute for a given command.

### Targeted Package Mode

If the user selects specific packages and does not request matrix expansion:

- create one job per selected package
- use the default environment only
- default React version is the latest declared package-supported React version
- default bundler is the pipeline default for that package class

Example:

- `@matrix/typescript`
	- job: `react=19`, `bundler=vite@5` if that is the default bundler

### Full Matrix Mode

If the user explicitly requests full matrix expansion:

- expand the declared environment arrays into concrete jobs
- run all compatible combinations for that package

Example:

```json
{
	"environments": {
		"react": ["17", "18", "19"],
		"bundler": ["vite@5", "webpack@5"]
	}
}
```

produces:

- `react=17, bundler=vite@5`
- `react=17, bundler=webpack@5`
- `react=18, bundler=vite@5`
- `react=18, bundler=webpack@5`
- `react=19, bundler=vite@5`
- `react=19, bundler=webpack@5`

## Default Environment Resolution

We need a single place in pipeline that defines defaults.

Initial defaults:

- React default: latest version declared in `matrix.json`
- Bundler default: first package-supported bundler if present, otherwise pipeline fallback

Important rule:

- `environments` declares what a package supports
- defaults declare what we run when the user is not asking for exhaustive coverage

That means a package can support React `18` and `19`, but a normal local targeted test still only runs React `19` because that is the latest declared version. If a package declares `17`, `18`, and `19`, the default targeted run still uses only `19` unless the user opts into matrix expansion.

## Execution Contract

Current execution direction should remain intact.

Local matrix package:

- `setup` routes into pipeline setup
- `test` routes into pipeline test
- `sync` remains `ref sync`

Container consumer:

- package manifest is only install metadata
- runner executes setup and test commands directly
- runner does not depend on generated consumer `scripts.test`

This is already the cleaner boundary and should remain the foundation for matrix expansion.

## Precursor Work Before Full Matrix Environments

Before implementing full environment-matrix runners, we should standardize test execution and orchestration.

This is a prerequisite, not optional cleanup.

If we skip this and jump straight into React and bundler expansion, we will end up multiplying inconsistent runner behavior across more containers.

### Standardize Test Runners

We should explicitly support both:

- Vitest
- Playwright

The matrix pipeline will likely need both.

Vitest covers:

- package-level runtime tests
- type-level tests where the package already uses Vitest-driven assertions
- smoke/integration checks inside a synthetic consumer

Playwright covers:

- browser-facing flows
- real downstream runtime validation
- bundler/browser behavior where a unit-level runner is not enough

Before full environment expansion, we should define one clean execution contract for each runner type.

Current contract:

- Vitest-oriented packages keep their tests under `unit/`
- Playwright-oriented packages keep their tests under `e2e/`
- any package with `e2e/` runs on the pinned Playwright base image instead of the default Node image

That means the planner should eventually be able to describe jobs such as:

- run Vitest in this consumer
- run Playwright in this consumer

without encoding that decision as ad hoc command branching inside the Dagger runner.

### Standardize Runner Materialization

We should decide how a matrix package declares that it uses:

- Vitest only
- Playwright only
- both Vitest and Playwright

The first version does not need a full DSL for this, but pipeline should have a normalized internal model for test runner type before it gains a full compatibility matrix.

### Parallel Container Orchestration

Full matrix mode will be expensive.

That means orchestration needs to be part of the design, not something added later.

We should plan for:

- parallel container execution
- bounded concurrency
- deterministic logs and artifact collection
- clear per-job status reporting

The current serial execution path is acceptable for the existing small matrix, but it is not the end state.

When `pnpm pipeline test --full` exists, it should be understood as the heavy compatibility command and should be able to run multiple jobs concurrently.

### TUI Direction

We should plan a TUI for the heavier matrix flows.

This matters because once we have:

- multiple packages
- multiple environments
- parallel containers
- Vitest and Playwright jobs

plain streaming logs will become hard to follow.

The TUI should eventually show:

- planned jobs
- running jobs
- passed jobs
- failed jobs
- per-job runner type
- per-job environment
- links or paths to logs and artifacts

This should be treated as orchestration UX, not as a separate afterthought.

### Full Mode

The heavy compatibility command should be modeled as:

- `pnpm pipeline test --full`

Semantically:

- opt into full matrix expansion
- opt into heavier orchestration behavior
- opt into parallel execution where safe
- run all configured test runners needed for the resolved jobs

This is the command that should eventually feel like the full compatibility pipeline, not the cheap local package-test entrypoint.

## What Changes For Environment-Aware Runs

To support React and bundler environments, the synthetic consumer generation will need environment materialization.

That likely means:

- dependency overrides for React and related packages
- bundler-specific fixture dependencies when required
- possible generated config differences for Vite vs Webpack consumers

This should not be implemented as string substitution on test commands alone.

The environment must be represented as structured data in the plan.

## Proposed Types

These names are illustrative, not final.

```ts
interface MatrixPackageEnvironmentConfig {
	react?: string[]
	bundler?: string[]
}

interface MatrixPackageConfig {
	matrix: true
	name: string
	environments?: MatrixPackageEnvironmentConfig
}

interface MatrixResolvedEnvironment {
	bundler?: string
	react: string
}

interface MatrixExecutionJob {
	environment: MatrixResolvedEnvironment
	packageName: string
}

interface MatrixExecutionPlan {
	jobs: MatrixExecutionJob[]
	mode: 'default' | 'full'
}
```

## CLI Direction

Current CLI:

- `pipeline test`
- `pipeline test --packages=@matrix/typescript`

Planned behavior:

- `pipeline test`
	- may continue to run the current default test set in default environments
- `pipeline test --packages=@matrix/typescript`
	- runs only the targeted package in the default environment
- `pipeline test --matrix`
	- runs matrix expansion for the default selected packages
- `pipeline test --packages=@matrix/typescript --matrix`
	- runs full matrix expansion for that package only

The flag name can change, but the semantic contract should stay the same.

## Why This Shape

This plan avoids three common failure modes:

1. Slow local iteration because every targeted package test explodes into a full compatibility grid
2. Hardcoded React and bundler logic in the runner instead of a planning layer
3. Premature suite-level DSL complexity before we know we need per-suite targeting

This is the smallest useful design that still leaves room for future refinement.

## Future Extension

If later we need only some tests to run in some environments, we can extend the config with optional suite-level selection.

That should be a later feature, not part of the first environment-aware matrix implementation.

But v1 should not require this.

## Implementation Phases

Phase 1:

- extend `matrix.json` parsing to support optional `environments`
- keep existing packages working unchanged
- add planner types and default environment resolution

Phase 2:

- standardize how matrix jobs represent Vitest and Playwright execution
- standardize the internal runner model before environment expansion
- define the future `--full` command semantics

Phase 3:

- add a planning module that resolves jobs for default mode vs full matrix mode
- print the resolved plan before execution

Phase 4:

- add parallel orchestration with bounded concurrency
- define log and artifact ownership for concurrent jobs
- design the TUI around planned, running, passed, and failed jobs

Phase 5:

- add environment materialization for React and bundler versions in the synthetic consumer
- execute one job per resolved environment

Phase 6:

- evaluate whether per-suite targeting is actually needed

## Non-Goals For V1

- arbitrary environment axes
- automatic inference from test files
- full matrix expansion by default
- per-test selection rules
- dynamic planner plugins

## Summary

The first version should be intentionally small:

- `matrix.json` gets an optional `environments` object
- targeted package tests run only one default environment
- default React version is the latest React version declared by that package
- Vitest and Playwright get standardized runner treatment before full matrix rollout
- `pnpm pipeline test --full` becomes the explicit heavy compatibility command
- orchestration and a TUI are part of the plan before large-scale matrix expansion
- full matrix execution is explicit, never implicit
- the planner owns expansion
- the runner only executes concrete jobs
