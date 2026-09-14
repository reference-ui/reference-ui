# Resolver Module

This folder contains the recursive reference-resolution passes used by
`ast/resolve`.

The top-level resolve layer builds lookup indexes and chooses which parsed file
is being processed. The `resolver/` submodule performs the actual work of
walking symbol shapes and nested `TypeRef` values to attach target ids.

## Shape

- `mod.rs`: shared resolver context
- `symbol.rs`: symbol-level resolution
- `type_ref.rs`: nested `TypeRef` traversal and target attachment

## Boundaries

- `extract` produces unresolved shells and references
- `resolver/` resolves them against indexes built by `resolve/index.rs`
- `generator` consumes the fully resolved graph
