# Bundle Assembly

This folder assembles the final emitted artifact bundle for Tasty.

Given a resolved `TypeScriptBundle`, it produces the set of JavaScript modules
and declaration modules that make up the manifest-first runtime artifact layout.

## Responsibilities

- assign stable export names for emitted symbol chunks
- emit the manifest, runtime loader, and chunk-registry modules
- emit one chunk module per symbol
- emit the declaration shims consumed by the JS runtime

## Shape

- `mod.rs`: top-level artifact-bundle assembly
- `modules/`: individual emitted module templates and helpers

## Boundaries

- `symbols.rs` and `types.rs` serialize symbol payload content
- `bundle/` decides how those payloads are laid out across output modules
