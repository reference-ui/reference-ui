# Values

Collects `const` value bindings from top-level statements and infers a `TypeRef`
from initializer expressions (primitives, object/array literals, `as` /
`satisfies`).

## Files

- `collect.rs` — walk variable / export declarations and record bindings
- `infer_dispatch.rs` — expression-level dispatch into `infer/` helpers
- `ts_assertions.rs` — `as` / `satisfies` and `as const` narrowing
- `mod.rs` — re-exports for `extract` and `infer/`
