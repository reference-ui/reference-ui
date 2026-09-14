# Resolve Module

The `resolve` submodule turns extracted parser output into a connected symbol graph.

It takes the parser-adjacent `ParsedTypeScriptAst`, builds lookup indexes, and then
resolves cross-file symbol references, local references, and nested type references
into the final `ResolvedTypeScriptGraph`.

## Responsibilities

- build symbol and export lookup indexes
- resolve imported references through export maps
- resolve local symbol references within a file
- walk nested `TypeRef` structures and attach target symbol ids
- assemble the final file, symbol, and export maps consumed by later stages

## Shape

- `mod.rs`: module wiring and public re-exports
- `graph.rs`: resolved graph output type
- `index.rs`: top-level orchestration and lookup-index construction
- `resolver/`: recursive type and symbol reference resolution
  split into symbol-shape and type-reference passes
- `names.rs`: shared reference-name parsing helpers

## Boundaries

- `extract` produces parser-derived symbol shells and raw references
- `resolve` connects those shells into a graph
- `generator` consumes the resolved graph to emit runtime artifacts
