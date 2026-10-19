# Build Rust

Build-pipeline logic specific to `@reference-ui/rust`. This folder decides how napi-rs target packages are generated or fetched and how the root package is augmented for registry staging; `registry/` only consumes the prepared artifacts.

## Native freshness

A native binary is fresh only when its `reference-native.<triple>.inputs.sha256` stamp matches the current `@reference-ui/rust` sources and it passes the export-name check. The stamp travels beside the binary, in `dist/native` and in each `dist/npm/<target>` dir. Packing never ships a stale binary:

- a stale target this host can build (the host triple natively, linux in Dagger) is rebuilt whenever a pack needs it
- a stale target this host cannot build is refused for an explicit target list and for releases; in the implicit all-target pack (`pipeline build`, `registry pack`, `pipeline dev`) it is left out with a warning naming the stamp command
- generated tarballs live under a directory keyed by the sources hash, so an older tarball has no path to reuse
- a pack that leaves a target out is never served from the prepared-artifacts cache: every such pack re-prepares and warns again. A binary this host cannot build is picked up only from `dist/artifacts/bindings-<rust target>/`, with its stamp beside it
- the release preflight counts a target as available only when this host can build it or a stamped artifact is present, so a release refuses before any build or delete

Cross-builds are not attempted. Any `.rs` change makes the next linux build run in Dagger (about 50 s). CI stamps each binary in `rust-compile.yml`, and the stamp folds CRLF to LF so Windows checkouts hash the same as macOS and Linux. the `publish-native` step refuses to publish downloaded binaries without a matching stamp.

Parent: [build/README.md](../README.md).
