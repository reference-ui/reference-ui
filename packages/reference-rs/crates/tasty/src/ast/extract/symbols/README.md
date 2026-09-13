# Symbols

Builds lightweight `SymbolShell` values for interface declarations and type aliases
(used for export bookkeeping before resolution).

## Files

- `interface.rs` — `push_interface_shell` (members, extends, references)
- `type_alias.rs` — `push_type_alias_shell` (underlying type + references)
- `mod.rs` — re-exports for `extract` and `module_bindings`
