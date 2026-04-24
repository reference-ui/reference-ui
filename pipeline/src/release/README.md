# Release Pipeline

This folder is reserved for release-focused pipeline logic.

Its job is to define how package releases are verified, assembled, and published.

That includes work such as:

- validating publishable artifacts before release
- running release-time checks in the same kind of environment used in CI
- eventually handling package publishing and related delivery steps

The intent is to make release behavior easier to reason about and less dependent on brittle GitHub Actions-only wiring.

The most important role of release is gatekeeping.

`release/` should decide what is allowed to move from the pipeline-local registry to the real public registry.

## Current Module Layout

The first local release implementation is now split into stage-oriented modules:

- `index.ts`
	- public release entrypoint and orchestration surface for the CLI
- `changesets.ts`
	- reads and parses local Changesets status
- `plan.ts`
	- shapes dependency-ordered release plans and local support checks
- `auth.ts`
	- verifies npm authentication before local release mutation begins
- `version.ts`
	- materializes pending version bumps via Changesets
- `stage.ts`
	- rebuilds and stages release artifacts into the managed local Verdaccio registry
- `local.ts`
	- wires the stage modules into the developer-facing local release command
- `types.ts`
	- shared release types and constants used across the stage modules

## Current Release Surface

Release execution for npm is implemented in this folder and invoked via `pnpm pipeline release` (root alias: `pnpm release`). Changesets still author intent (`pnpm changeset`, `pnpm version-packages`); GitHub Actions no longer runs a release workflow in this repository.

## Intended Dagger Responsibility

The `release/` area is where release execution is defined for the monorepo.

That includes:

- release target detection
- promotion decisions for artifacts already present in the pipeline-local registry
- consumption from the pipeline-local registry
- release verification before publish
- package publication ordering and execution

The ownership boundary should be:

- `build/` builds and pushes artifacts into the local registry
- `testing/` validates those artifacts in realistic environments
- `release/` manages the gate that decides whether those artifacts can be promoted and published

## Changesets Integration

Changesets should remain part of the release workflow.

The intended split is:

- Changesets manages release intent
- Changesets manages version bumps and changelog generation
- Dagger manages artifact execution, validation, and publication

That means the release pipeline should eventually incorporate steps equivalent to:

- `pnpm changeset` as the authoring workflow on branches
- `changeset status` or equivalent detection when deciding what is part of a release
- `pnpm version-packages` / `changeset version` when materializing the release locally

Then, after the Changesets side has established what the release is, Dagger should:

- select the exact release artifacts that were already built and stored in the pipeline-local registry
- validate them in distribution form
- publish them to npm

## Local-First Release Direction

The intended direction here is local-first release execution.

That means:

- release should be runnable from a developer machine in the same pipeline definition used everywhere else
- Dagger should provide the reproducible execution environment
- for now, final publish should happen locally rather than from GitHub Actions

In that model, GitHub remains the place we store and review code, not the place where release execution is authored.

This is a better fit for Dagger because the real value is having the release graph be portable, inspectable, and runnable outside GitHub-hosted runners.