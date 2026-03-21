# Type references

Collects `TypeRef` reference nodes from symbol shells (members, extends, type
parameters, underlying types) for downstream resolution.

## Files

- `mod.rs` — `collect_references_from_members` entry point
- `walk.rs` — recursive walk of `TypeRef` (union, mapped, conditional, etc.)
