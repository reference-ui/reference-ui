# Reference UI Matrix

This folder is the top-level home for the next generation of Reference UI matrix tests.

The intent is to separate matrix scenario ownership from the older fixture-driven test layout.

Fixtures remain a consistent set of packages because they are still used by the current unit-level test flows.

This `matrix/` area is where the newer matrix-oriented test surfaces should live as they become first-class parts of the repo.

For local IDE readiness, use `pnpm matrix:setup` from the repo root. That runs
the pipeline-managed matrix setup, installs workspace dependencies, and runs
`ref sync` in each matrix package so generated packages and types are present.

## Status snapshot

- Established matrix packages: `watch`, `primitives`, `css`, `system`
- Newly migrated matrix packages: `recipe`, `spacing`, `responsive`, `color-mode`, `session`, `tokens`, `virtual`
- Still intentionally deferred: design-system chaining (`extends` x `layers`) and the cross-cutting CLI/sync lifecycle extras

The newer packages already follow the same ownership pattern as the existing matrices:

- browser-first packages keep real-style assertions in `tests/e2e`
- filesystem and pipeline contracts stay in `tests/unit`
- packages are kept narrow so concerns do not collapse back into a single kitchen-sink suite

Current validation is mixed rather than complete: the scaffolding and test slices are in place, `tokens` unit coverage has been fixed and revalidated, and the remaining new packages still need full matrix test passes to move from migrated to fully settled.

## Purpose

This directory exists to make the matrix itself a clear top-level concept.

That means:

- the pipeline can evolve around a dedicated matrix surface
- install-focused and TypeScript-focused coverage can grow independently

