# Generated

`ts-rs` output from the `atomic` crate's public structs.

Empty until those structs exist with `#[derive(TS)]`. Do not hand-write
these files. Same pattern as `modules/atlas/js/generated` and `modules/tasty/js/generated`.

When wired:

- `CompileResult.ts` — `{ stylesheet, css, diagnostics }`
- `CssRuntime.ts` — the `css()` lookup (not a generic “tables” type)
- `Diagnostic.ts`
- `Want.ts` / `Atom.ts` only if they actually cross N-API
- `index.ts` barrel

JS must not declare a second atom model.

## Must not

- Check in a parallel `utilities` string as source of truth.
- Generate a jsx / types / patterns farm here.
