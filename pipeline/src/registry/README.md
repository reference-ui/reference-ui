# Registry Pipeline

This folder is reserved for pipeline-local registry infrastructure.

Its job is to provide a private, virtual npm-style registry that the pipeline can use for realistic package-consumption testing and release preparation.

The first concrete shape for that should be:

- `pnpm build` builds the workspace through the pipeline CLI
- `pnpm pipeline:registry:pack` creates publish-style `.tgz` tarballs from the built public packages
- `pnpm pipeline:registry:start` runs a local Verdaccio registry
- `pnpm pipeline:registry:stage:local` publishes those tarballs into the local registry

That gives us an npm-compatible boundary immediately, without forcing release or testing to invent their own packaging path.

## Why This Exists

Reference UI has already shown that some of the most important failures only appear after packaging and distribution.

That means we need a layer in the pipeline that sits between:

- build
- testing
- release

and lets all three of those areas interact with the exact packaged artifacts we intend users to consume.

## Intended Responsibilities

The `registry/` area should eventually be responsible for:

- storing pre-production builds of real published packages
- storing packaged fixture libraries needed by the test ecosystem
- exposing those artifacts through a private npm-style registry interface
- providing a shared artifact source for matrix, unit, and distribution testing
- providing the release pipeline with already-built artifacts that have already gone through validation

The ownership boundary here should be:

- `build/` pushes artifacts into the local registry
- `registry/` stores and serves them
- `release/` decides which validated artifacts are allowed to leave it

## Initial Format

The first artifact format should be plain npm package tarballs plus a manifest.

That means:

- each public package is packed into a `.tgz` file with `pnpm pack --ignore-scripts`
- the tarballs are written under `.pipeline/registry/tarballs/`
- the pipeline writes `.pipeline/registry/manifest.json` describing:
	- package name
	- version
	- source directory
	- tarball file name
	- tarball path
	- internal workspace dependencies

That format is intentionally simple.

It is close to what npm itself consumes, and it gives both testing and release a stable artifact contract.

## Tools That Fit This Well

The tools that fit the first version best are:

- Verdaccio for the local npm-compatible registry
- `pnpm pack` for generating publish-style tarballs from already-built packages
- Dagger for eventually running the registry and consumers inside isolated containerized environments

Verdaccio is the useful first step because it gives us a real registry interface now. Dagger can then own how that registry is started and consumed inside the broader pipeline graph.

## Reuse Across Testing And Release

Yes, that is the point of this layer.

Once the built packages are packed and published into the local registry:

- testing can install those exact package versions from the registry
- release can promote the same validated artifacts instead of rebuilding them

That keeps artifact creation in `build/`, artifact hosting in `registry/`, and promotion decisions in `release/`.

## How It Fits Into The Pipeline

The intended flow is:

1. `build/` produces package artifacts.
2. `build/` pushes those artifacts into `registry/`.
3. `registry/` stores and serves those artifacts.
4. `testing/` consumes those artifacts in realistic install flows.
5. `release/` acts as the gate and promotes validated artifacts to the real public registry.

This lets us test what we actually ship instead of depending only on workspace links or fresh ad hoc package builds at release time.