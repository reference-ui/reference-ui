# Registry Pipeline

This folder is reserved for pipeline-local registry infrastructure.

Its job is to provide a private, virtual npm-style registry that the pipeline can use for realistic package-consumption testing and release preparation.

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

## How It Fits Into The Pipeline

The intended flow is:

1. `build/` produces package artifacts.
2. `build/` pushes those artifacts into `registry/`.
3. `registry/` stores and serves those artifacts.
4. `testing/` consumes those artifacts in realistic install flows.
5. `release/` acts as the gate and promotes validated artifacts to the real public registry.

This lets us test what we actually ship instead of depending only on workspace links or fresh ad hoc package builds at release time.