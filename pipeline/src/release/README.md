# Release Pipeline

Local-first release execution: verifies npm auth, materializes pending Changesets versions, rebuilds and stages release artifacts into managed Verdaccio, then publishes the staged tarballs to npm in dependency order.

## Surface

- `pnpm pipeline release` (root alias: `pnpm release`) runs the full local release.
- `pnpm pipeline release plan` shows the unpublished packages that would publish, without mutating anything.

Changesets owns intent and version/changelog text; the pipeline owns execution, validation, and publication. Rust releases additionally preflight native target availability before any build or delete.

## Boundaries

- `build/` builds and pushes artifacts into the local registry.
- `testing/` validates those artifacts in realistic environments.
- `release/` gates promotion of validated artifacts to the public registry.

Parent: [src/README.md](../README.md).
