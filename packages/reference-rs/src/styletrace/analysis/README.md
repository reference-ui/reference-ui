# Analysis

The analysis layer scans a directory of source files and returns exported JSX
component names that keep a style-prop link back to Reference primitives.

It builds on the resolver’s concrete style-prop surface, parses components with
Oxc, collects forwarding edges, and then walks the wrapper graph.

## Files

- `mod.rs` — analysis module entry and public export
- `analyzer.rs` — graph walk and cache management
- `model.rs` — wrapper graph and prop-binding data structures
- `parser.rs` — Oxc parsing and component extraction
- `walk.rs` — statement / expression / JSX traversal
- `discovery.rs` — source-file and primitive discovery helpers
- `util.rs` — string slicing and small parsing helpers