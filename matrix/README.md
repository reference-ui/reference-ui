# Reference UI Matrix

This folder is the top-level home for the next generation of Reference UI matrix tests.

The intent is to separate matrix scenario ownership from the older fixture-driven test layout.

Chain fixtures live at `matrix/fixtures/` (flat, `@fixtures/*` names
preserved) because the kept chain suites consume them as packed
packages.

Kept suites live at `matrix/tests/`. For local IDE readiness, use
`pnpm pipeline setup --sync` from the repo root. That runs the
pipeline-managed matrix setup, installs workspace dependencies, and
runs `neo sync` in each matrix package so generated packages and
types are present.

## Status snapshot

Matrix keeps exactly what can't be proved in local tests or in one
set of environments (see `TEST_COVERAGE.md` for the coverage index):

- Kept gate: `tests/chain/T2` (sole `layers:` prover), `tests/chain/T8`
  (policy proof), `tests/mcp` (the whole MCP standard, 19 files)
- Everything provable natively moved OUT: behavior and browser
  coverage lives in Neo cases (`packages/reference-neo/tests/cases/`),
  compiler units in Rust seam tests

The kept packages follow the same ownership pattern as before:

- browser-first packages keep real-style assertions in `tests/e2e`
- filesystem and pipeline contracts stay in `tests/unit`
- packages are kept narrow so concerns do not collapse back into a single kitchen-sink suite

## Purpose

This directory exists to make the matrix itself a clear top-level concept.

That means:

- the pipeline can evolve around a dedicated matrix surface
- install-focused and TypeScript-focused coverage can grow independently

