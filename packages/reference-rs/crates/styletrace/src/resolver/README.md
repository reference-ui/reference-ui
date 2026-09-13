# Resolver

The resolver expands the Reference UI style-prop surface from TypeScript source.

It starts from `StyleProps`, follows imports and re-exports, instantiates simple
generic aliases, and returns a concrete set of property names.

## Files

- `mod.rs` — resolver module entry and re-exports
- `model.rs` — internal type graph structures
- `parser.rs` — Oxc parsing and TS type lowering
- `tracer.rs` — recursive resolution engine
- `util.rs` — shared error and path helpers