# Extract Module

The `extract` submodule is the Oxc-facing parsing pass inside the AST layer.

It parses scanned TypeScript source, walks top-level statements, and turns raw
syntax into parser-adjacent Tasty structures such as import bindings, export
bindings, symbol shells, members, comments, and lowered `TypeRef` values.

## Layout

Each major concern lives in its **own directory** with a short `README.md` and
focused Rust modules:

| Directory | Role |
|-----------|------|
| `comments/` | Leading comments and JSDoc-style parsing |
| `members/` | Interface / object member signatures → `TsMember` |
| `symbols/` | Interface and type-alias symbol shells |
| `type_references/` | Collect reference `TypeRef` nodes from shells |
| `types/` | `TSType` → `TypeRef` lowering |
| `infer/` | Expression-level value inference for `const` bindings |
| `values/` | Collect const bindings and dispatch expression inference |
| `module_bindings/` | Import and export binding collection |

Top-level modules next to `mod.rs`:

| Path | Role |
|------|------|
| `pipeline.rs` | `extract_files` / `extract_file` — parse with Oxc and run the statement loop |
| `statements/` | Per-statement routing for imports, exports, and user symbol shells (`README.md` inside) |
| `util.rs` | Small shared helpers (`slice_span` for source slicing); same idea as `generator/util.rs` |

`mod.rs` only declares submodules and re-exports `extract_files` and `slice_span`.

## Boundaries

- `scanner` decides which files exist in the scan
- `extract` understands Oxc syntax and builds parser-derived structures
- `resolve` connects those structures into a graph
