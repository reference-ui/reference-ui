# ATM-SITE-84

An import resolves to its origin binding only: `glow` folds `#f59e0b` from its unmutated export despite a same-named write in another file, while the written file's own use still diagnoses `ATM-W-MUTATED-BINDING` naming that write.
Symbols: `ImportLookup`, `ResolvedExport::mutation`, `Scoped::mutation`, `ValueGraph`.
Siblings: `ATM-SITE-28` (mutation wording), `ATM-SITE-31` (cross-file helpers).
Contract: [SPEC.md](../../../SPEC.md).

> Search terms: origin precision, cross-file poison, mutated binding, name-wide bag, import mutation, export let
