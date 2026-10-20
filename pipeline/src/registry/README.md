# Registry Pipeline

Pipeline-local npm-compatible registry (managed Verdaccio) plus the publish-style staging flow that feeds it. Testing installs the exact packaged artifacts from here; release promotes them to npm.

## Staging flow

`pnpm pipeline registry pack` copies each target package into `.pipeline/registry/staging/`, rewrites `workspace:` specs to concrete versions, drops source-only fields, and runs `pnpm pack` there. Tarballs land under `.pipeline/registry/tarballs/` with a versioned `.pipeline/registry/manifest.json` (name, version, source dir, tarball path, internal deps).

`pnpm pipeline registry load` publishes tarballs missing from Verdaccio; `pnpm pipeline registry start` runs the registry standalone for inspection.

## Boundaries

- `build/` pushes prepared artifacts in; `registry/` never builds.
- `registry/` stores and serves; `release/` decides what leaves for npm.
