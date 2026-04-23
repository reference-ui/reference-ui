# Build Rust

This folder owns the build-pipeline logic that is specific to `@reference-ui/rust`.

The important boundary is:

- `build/rust/` decides how napi-rs target packages are generated or fetched
- `build/rust/` decides how the root package needs to be augmented for registry staging
- `registry/` only consumes already-prepared package artifacts and publishes them into Verdaccio

That keeps the local registry layer focused on npm-style staging instead of carrying
knowledge about Rust targets, optional native packages, or napi-rs packaging details.