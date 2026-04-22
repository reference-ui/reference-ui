# Pipeline Vision

## Goal

Use Dagger as the execution layer for a local-first pipeline.

The purpose of that shift is to give Reference UI:

- better local ergonomics
- faster iteration on delivery and testing workflows
- cleaner isolated test environments
- much higher confidence in what we build, test, and release

The main idea is simple:

- define the real build, test, and release graph once
- run that graph locally first
- let CI call the same graph instead of re-implementing it in workflow YAML

## Why We Need This

Our previous setup has worked, but it is hard to reason about.

The current pain points are:

- GitHub Actions, custom scripts, and release logic are spread across multiple YAML files and helper scripts
- releases are painful because we often only find real distribution problems after publishing to npm
- `reference-e2e` has been responsible for spinning up its own sandbox environments, which mixes test logic with environment orchestration
- CI setup and local setup are too different, which makes delivery harder to trust

## What Makes Reference UI Different

Reference UI is not just a component package.

It is a CLI for a design system.

That matters because consumers are not only importing runtime code. They are also depending on:

- CLI behavior
- generated outputs
- chainable `baseSystem` behavior
- Rust-backed modules and native packaging
- the way our packages are installed and consumed together

So the pipeline has to test more than whether source code compiles.

It has to test how users actually consume the product after packaging and installation.

## Current State

Reference UI works.

It already has useful tests and the product itself is in good shape.

The weak point is distribution confidence.

Right now, some of the most important failures only appear after packages are published to npm. That is exactly the class of problem the pipeline should eliminate.

## What We Need From The Pipeline

The pipeline should provide four major things.

### 1. Reproducible build environments

Builds should run in known containerized environments rather than depending on the state of a local machine or a GitHub-hosted runner.

### 2. Better testing environments

The pipeline should own environment orchestration for testing, especially:

- matrix testing across bundlers and runtime combinations
- unit testing in explicit container environments
- distribution testing against packaged outputs

`reference-e2e` should keep its tests and assertions, but it should not have to behave like a custom infrastructure framework.

### 3. Distribution-first confidence

We need to validate package distribution before release, not after release.

That means testing the outputs we actually ship, not just workspace-linked development setups.

### 4. Local-first release execution

Release execution should be runnable locally through Dagger.

GitHub Actions can still exist, but it should become a thin trigger or wrapper around the same release graph rather than the place where the release behavior is authored.

## Proposed Pipeline Shape

The current rough category split is:

- `build/` — responsible for building packages
- `release/` — responsible for releasing packages
- `registry/` — responsible for a private, virtual npm-style registry used by the pipeline
- `testing/` — responsible for testing flows such as matrix, unit, and distribution testing

## Why `registry/` Probably Deserves Its Own Section

The registry concept is important enough that it likely should not be hidden under `build/`.

The proposed registry would house:

- pre-production builds of our real published packages
- packaged fixture libraries needed for test scenarios
- the exact artifacts we want to install in downstream and e2e-style tests

That registry would then be used by the testing pipeline so we can verify that publish-style installs actually work on a user's machine.

This matters because that is where some of our current failures are showing up: after packaging, after publishing, and only when consumed like a real user would consume them.

So while the registry is connected to build, it is really shared infrastructure for:

- build
- testing
- release

That is why `pipeline/src/registry/` likely makes sense as its own section.

## Intended Flow

The rough intended flow is:

1. Build package artifacts in Dagger.
2. Commit those build outputs into a private pipeline registry.
3. Run matrix, unit, and distribution tests against those registry-hosted artifacts.
4. If release is needed, publish the already-built and already-validated artifacts.

That is much better than rebuilding and rediscovering issues during the release itself.

## Release Model

Changesets should still manage versioning, changelogs, and the release PR flow.

Dagger should own the execution side:

- build the release artifacts
- validate them
- make them available through the private registry
- publish them when we are ready

In that model, release becomes much simpler:

- the packages are already built
- the packages are already tested in distribution form
- publishing becomes a final promotion step, not a blind leap

## What Success Looks Like

If this vision works, then the repo should move from:

- logic scattered across GitHub Actions YAML
- hand-rolled sandbox orchestration
- release confidence that depends too much on npm publish feedback

to:

- one clear pipeline structure
- local-first execution through Dagger
- isolated environments that are easier to reason about
- realistic package-consumption testing before release
- higher delivery reliability and confidence overall

## Changesets In This Model

Changesets should remain part of the release workflow.

The split should be:

- Changesets owns release intent
- Changesets owns changelog generation and versioning metadata
- Dagger owns release execution

That means the release pipeline should eventually use Changesets for things such as:

- deciding what changed
- applying version bumps and changelog updates
- identifying which packages are part of a release

Then Dagger should take over the operational side:

- build the release artifacts
- place them into the private pipeline registry
- run final validation against those artifacts
- publish the already-validated outputs locally

In practice, `pnpm changeset` and the existing `version-packages` / Changesets flow are still compatible with this vision. The difference is that publishing and release validation move into the Dagger pipeline instead of living in GitHub Actions.

## Decisions So Far

The current direction is now firm enough to record a few concrete decisions.

### `registry/` is a first-class top-level area

`pipeline/src/registry/` should exist as its own section.

It should provide a private, virtual npm-style registry that the internal test ecosystem can pull from.

That includes:

- real pre-production package builds
- packaged fixture libraries
- release-candidate artifacts used by testing and release validation

### Release is local-only for now

For now, release publishing should happen only from a local Dagger flow.

GitHub should remain a place to store and review code, not the place where release execution happens.

That keeps the release process:

- local-first
- reproducible through Dagger
- independent from GitHub-hosted runner behavior

### `reference-e2e` should keep tests, but lose infrastructure ownership

`reference-e2e` already has strong Playwright coverage.

The problem is that it is currently doing too many jobs.

The direction should be:

- keep the Playwright tests in `reference-e2e`
- move environment orchestration into the pipeline
- introduce a bridging API that gives `reference-e2e` the capabilities it needs inside pipeline-owned sandboxes

That bridge should eventually give the test package controlled access to things like:

- editing files in its sandbox
- resetting state
- triggering sync/build steps when needed
- reading pipeline-owned outputs and artifacts

This keeps the test package focused on test behavior rather than on building its own infrastructure.




## Direction

The direction is clear even if every detail is not yet finalized:

Reference UI should move toward a Dagger-owned, local-first pipeline that builds, tests, validates, and releases the real artifacts users consume.

