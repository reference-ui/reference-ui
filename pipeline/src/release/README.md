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

## Current Release Surface

Today, release behavior is split between workflow YAML and Node scripts:

- `.github/workflows/release.yml`
	- creates or updates the changesets release PR
	- decides whether publishing should happen
	- coordinates rust artifact compilation before publish
	- invokes package publishing
- `scripts/release/detect.mjs`
	- determines which packages are unpublished and whether rust artifacts are needed
- `scripts/release/publish.mjs`
	- publishes rust first when needed
	- then publishes the remaining packages in dependency-safe order
- `scripts/release/shared.mjs`
	- package discovery, previous ref resolution, npm publication checks, publish ordering

## Intended Dagger Responsibility

The `release/` area should become the place where release execution is actually defined.

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