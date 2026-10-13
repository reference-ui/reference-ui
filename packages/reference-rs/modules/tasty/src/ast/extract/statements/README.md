# Statements

Top-level **statement dispatch** for a single parse pass: for each `Statement` in
`program.body`, route to import collection, export collection, or (for the user
library) default exports and interface/type-alias symbol shells.

This sits between `pipeline` (parse + loop) and the heavier `module_bindings` /
`symbols` implementations. `export * as ns` records one namespace binding instead of a star
target, and `unsupported` names the module-level statements tasty skips (augmentations of a
path-shaped module, `declare global`, `import x = …`, `export =`) with a warning.

## Files

- `imports.rs` — `ImportDeclaration` → `collect_import_bindings`
- `exports.rs` — named exports, default exports, user-library type shells
- `mod.rs` — re-exports the two entry points used by `pipeline`
