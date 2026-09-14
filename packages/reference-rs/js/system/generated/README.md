# Generated

`ts-rs` output from `crates/system` public structs.

Empty until those structs exist with `#[derive(TS)]`. Do not hand-write
these files. Same pattern as `js/atlas/generated` and `js/tasty/generated`.

When wired:

- `CompileResult.ts` — `{ stylesheet, css, diagnostics }`
- `CssRuntime.ts` — the `css()` lookup (not a generic “tables” type)
- `Diagnostic.ts`
- `Want.ts` / `Atom.ts` only if they actually cross N-API
- `index.ts` barrel

JS must not declare a second atom model.

## Must not

- Check in a parallel `utilities` string as source of truth.
- Generate Panda’s `styled-system/jsx` / `types` farm here.
