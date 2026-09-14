# Types

Lowers Oxc `TSType` / type annotations into internal `TypeRef` values (keywords,
references, composites, mapped types, etc.).

## Files

- `mod.rs` — `LoweringContext`, `type_to_ref` entry, intrinsics
- `lower_keywords.rs` — intrinsic / keyword types
- `lower_composites.rs` — object, array, tuple, function, constructors, template literals
- `lower_references.rs` — qualified names and type references
