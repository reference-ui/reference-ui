# Module bindings

Collects **import** and **export** name bindings from top-level statements: default
exports, named exports, and re-exports that feed `ParsedFileAst` and symbol shells.

## Files

- `imports.rs` — resolve import specifiers and populate `import_bindings`
- `exports.rs` — named/default exports, user-library shells, and export name maps
- `mod.rs` — public entry points for `extract::mod`
