# Value inference (expressions)

Infers `TypeRef` values from Oxc **expression** syntax for `const` bindings: object
literals, array/tuple literals, primitives, and `as` / `satisfies` wrappers.

Used by `values/`; separate from `types/` (which lowers `TSType` annotations).

## Files

- `primitives.rs` — boolean / number / string spans and const literal narrowing
- `objects.rs` — object literal properties
- `arrays.rs` — array and tuple element inference
- `mod.rs` — re-exports
