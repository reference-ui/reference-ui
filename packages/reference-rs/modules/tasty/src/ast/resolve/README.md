# Resolve Module

The `resolve` submodule turns extracted parser output into a connected symbol graph.

It takes the parser-adjacent `ParsedTypeScriptAst`, builds lookup indexes, and then
resolves cross-file symbol references, local references, and nested type references
into the final `ResolvedTypeScriptGraph`.

## Responsibilities

- fold same-file same-name declaration shells before resolution (M1–M3:
  all-Interface groups merge with unioned members; nominal member
  collisions keep first + diagnostic; alias/mixed collisions keep last
  + diagnostic)
- exclude star-ambiguous names from the barrel map with one diagnostic
  (two `export *` targets, different ids — ESM absence; diamond
  same-id and explicit seeds still resolve)
- exclude star-provided `"default"` from the barrel map silently (ESM
  star never re-exports default; explicit `export { X as default }`
  seeds still resolve; no diagnostic — absence, not ambiguity)
- resolve named-reexport seeds transitively and default-aware through
  the target's folded export map (local shells first, so declaring
  files win and `a↔b` cycles terminate); remaining misses stay silent
  drops, the fail-closed shape shared with unresolved imports
- resolve cross-file `typeof` over named value imports through the
  target's value bindings (aliased target exports included;
  default/namespace/re-export-chain values out of scope; cycles fail
  closed to no `resolved`)
- build symbol and export lookup indexes
- resolve imported references through export maps
- resolve local symbol references within a file
- walk nested `TypeRef` structures and attach target symbol ids
- assemble the final file, symbol, and export maps consumed by later stages

## Shape

- `mod.rs`: module wiring and public re-exports
- `graph.rs`: resolved graph output type
- `index.rs`: top-level orchestration and lookup-index construction
- `merge.rs`: pre-resolution same-file declaration-merge fold (M1–M3)
- `resolver/`: recursive type and symbol reference resolution
  split into symbol-shape and type-reference passes
- `names.rs`: shared reference-name parsing helpers

## Boundaries

- `extract` produces parser-derived symbol shells and raw references
- `resolve` connects those shells into a graph
- `generator` consumes the resolved graph to emit runtime artifacts
