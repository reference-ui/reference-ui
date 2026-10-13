# Build Rust

This folder owns the build-pipeline logic that is specific to `@reference-ui/rust`.

The important boundary is:

- `build/rust/` decides how napi-rs target packages are generated or fetched
- `build/rust/` decides how the root package needs to be augmented for registry staging
- `registry/` only consumes already-prepared package artifacts and publishes them into Verdaccio

Key files in this folder:

- `targets.ts`: orchestration for preparing target-package tarballs and local/container build steps
- `compatibility.ts`: native binary compatibility checks for reusable `.node` artifacts
- `planning.ts`: pure target-planning and tarball-strategy decisions
- `package-metadata.ts`: pure package metadata validation and optional dependency override generation

That keeps the local registry layer focused on npm-style staging instead of carrying
knowledge about Rust targets, optional native packages, or napi-rs packaging details.

## Native freshness

A native binary is fresh only when its `reference-native.<triple>.inputs.sha256`
stamp matches the current `packages/reference-rs` sources and it passes the
export-name check. The stamp travels beside the binary, in `dist/native` and in
each `dist/npm/<target>` dir. Packing never ships a stale binary:

- a stale target this host can build (the host triple natively, linux in Dagger)
  is rebuilt whenever a pack needs it
- a stale target this host cannot build is refused when the caller names it in an
  explicit target list, and when the pack is a release. In the implicit all-target
  pack (`pipeline build`, `registry pack`, `pipeline dev`) it is left out with a
  warning that names the stamp command
- generated tarballs live under a directory keyed by the sources hash, so an
  older tarball has no path to reuse
- a pack that leaves a target out is never served from the prepared-artifacts cache:
  the key cannot see a binary or stamp placed afterwards, so every such pack
  re-prepares and warns again. A binary this host cannot build is picked up only
  from `dist/artifacts/bindings-<rust target>/`, with its stamp beside it
- the release preflight counts a target as available only when this host can build
  it or a stamped artifact is present, so a release refuses before any build or delete

Cross-builds are not attempted. Any `.rs` change makes the next linux build run in
Dagger (about 50 s). CI stamps each binary in `rust-compile.yml`, and the stamp folds
CRLF to LF, so a Windows checkout produces the same stamp as macOS and Linux (a
Rust raw string whose only change is CRLF vs LF therefore does not change the hash).
`publish-native.ts` refuses to publish downloaded binaries without a matching stamp.
