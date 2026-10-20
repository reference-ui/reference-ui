# Generated

`ts-rs` output from the `atomic` crate's public structs.

Empty until those structs exist with `#[derive(TS)]`. Do not hand-write
these files. Same pattern as the atlas and tasty generated wrappers.

When wired:

- `CompileResult` — `{ stylesheet, css, diagnostics }`
- `CssRuntime` — the `css()` lookup (not a generic “tables” type)
- `Diagnostic`
- `Want` / `Atom` only if they actually cross N-API
- `index` barrel

JS must not declare a second atom model.

## Must not

- Check in a parallel `utilities` string as source of truth.
- Generate a jsx / types / patterns farm here.
