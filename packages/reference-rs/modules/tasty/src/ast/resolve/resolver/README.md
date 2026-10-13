# Resolver Module

This folder contains the recursive reference-resolution passes used by
`ast/resolve`.

The top-level resolve layer builds lookup indexes and chooses which parsed file
is being processed. The `resolver/` submodule performs the actual work of
walking symbol shapes and nested `TypeRef` values to attach target ids.

## Binders

A symbol's own type parameters shadow same-named symbols across its whole shape: its `extends`,
underlying type, members, references, and parameter constraints. A reference to such a name is
bound (its target stays unset and it is marked with its own name), so no top-level symbol captures
it. Extraction marks the nested binders the same way (see `ast/extract/types`). Once a symbol's
resolution is done, `binders.rs` clears every mark, so the output carries the same unresolved shape
an external name has. Evaluation resolves other declarations' types with no binders, and it never
dereferences a marked reference, because the mark names no symbol.

## Boundaries

- `extract` produces unresolved shells and references
- `resolver/` resolves them against indexes built by `resolve/index.rs`
- `generator` consumes the fully resolved graph
