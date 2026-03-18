# Generator Layer

The `generator` module turns the resolved Tasty graph into emitted artifacts.

It sits after scanning, AST extraction, and reference resolution, and owns the
final transformation from normalized Rust data into runtime-facing output
modules and declaration shims.

## Shape

- `mod.rs`: generator surface and raw bundle assembly
- `bundle/`: emitted artifact bundle assembly and module emission
- `symbols.rs`: symbol payload and reference emission
- `types.rs`: member and `TypeRef` emission
- `util.rs`: shared formatting helpers

## Boundaries

- `ast/` produces the resolved symbol graph
- `generator/` serializes that graph into emitted artifacts
- `emitted.rs` defines the raw emitted contract those artifacts conform to
