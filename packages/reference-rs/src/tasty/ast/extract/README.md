# Extract Module

The `extract` submodule is the Oxc-facing parsing pass inside the AST layer.

It parses scanned TypeScript source, walks top-level statements, and turns raw
syntax into parser-adjacent Tasty structures such as import bindings, export
bindings, symbol shells, members, comments, and lowered `TypeRef` values.

## Responsibilities

- parse `.ts` and `.tsx` source with Oxc
- collect import bindings and export bindings
- extract interface and type-alias symbol shells
- capture leading comments and lightweight JSDoc data
- lower Oxc type syntax into Tasty `TypeRef`

## Shape

- `mod.rs`: extraction orchestration per scanned file
- `comments.rs`: comment and JSDoc capture helpers
- `members.rs`: member extraction for interfaces and object types
- `symbols.rs`: symbol-shell construction
- `types.rs`: `TSType` to `TypeRef` lowering
- `module_bindings/`: import/export binding collection

## Boundaries

- `scanner` decides which files exist in the scan
- `extract` understands Oxc syntax and builds parser-derived structures
- `resolve` connects those structures into a graph
