# Type references

Collects `TypeRef` reference nodes from symbol shells (members, extends, type
parameters, underlying types) for downstream resolution. Each `extends` clause is walked like any
other type, so the type arguments it names are collected too.

## Files

- `mod.rs` — `collect_references_from_members` entry point
- `walk/` — recursive `TypeRef` walk
  - `mod.rs` — `collect_type_ref_references`, shell type-parameter hook
  - `variants.rs` — `match` on `TypeRef` variants
  - `helpers.rs` — shared `walk_*` helpers (optional, slices, members, params, template parts)
