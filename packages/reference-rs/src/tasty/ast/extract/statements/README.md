# Statements

Top-level **statement dispatch** for a single parse pass: for each `Statement` in
`program.body`, route to import collection, export collection, or (for the user
library) default exports and interface/type-alias symbol shells.

This sits between `pipeline` (parse + loop) and the heavier `module_bindings` /
`symbols` implementations.

## Files

- `imports.rs` — `ImportDeclaration` → `collect_import_bindings`
- `exports.rs` — named exports, default exports, user-library type shells
- `mod.rs` — re-exports the two entry points used by `pipeline`
