# Release Pipeline

This folder is reserved for release-focused pipeline logic.

Its job is to define how package releases are verified, assembled, and published.

That includes work such as:

- validating publishable artifacts before release
- running release-time checks in the same kind of environment used in CI
- eventually handling package publishing and related delivery steps

The intent is to make release behavior easier to reason about and less dependent on brittle GitHub Actions-only wiring.

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
- release artifact preparation
- release verification before publish
- package publication ordering and execution

## Local-First Release Direction

The intended direction here is local-first release execution.

That means:

- release should be runnable from a developer machine in the same pipeline used by CI
- Dagger should provide the reproducible execution environment
- GitHub Actions, if still used, should mostly trigger or observe the same Dagger release flow rather than containing the release logic itself

In that model, Actions becomes a thin automation wrapper, not the place where release behavior is authored.

This is a better fit for Dagger because the real value is having the release graph be portable, inspectable, and runnable outside GitHub-hosted runners.