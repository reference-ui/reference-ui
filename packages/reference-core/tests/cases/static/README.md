# CORE-STATIC — pre-generated atoms

Proves `staticCss` pre-generation: declared property × value × condition wants join AST-extracted wants before resolve, so the sheet carries utilities nobody authored inline. Reference-rs cases prove emission strings and runtime keys; these cases prove paint (a runtime `css()` value finds its atom) and the fail-closed negative (a value outside the set yields a diagnostic, never a ghost class). `SPEC.md` carries the static contract; `TESTS.md` is the case ledger.

> Search terms: staticCss, pre-generated atoms, runtime values, wildcard expansion, static dedup, fail closed, MERGE-06

## Cases

- CORE-STATIC-01 — declared static values × conditions exist in the sheet with no call site, and runtime `css()` paints from them.
- CORE-STATIC-02 — wildcard `*` expands a token category, and the overlapping static want dedups to one atom.
- CORE-STATIC-03 — a runtime value outside the static set yields the MERGE-06 diagnostic, not a ghost, and an unsatisfiable `staticCss` request fails sync.

Parent: [tests/cases/](../README.md).
