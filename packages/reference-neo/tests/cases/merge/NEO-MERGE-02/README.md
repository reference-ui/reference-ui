# NEO-MERGE-02 — bg then background collapse to one slot and the last value wins

The world calls `css({ bg: 'sand', background: 'clay' })` on one element.
The spec checks the sheet carries both background atoms, the emitted class
string is exactly the `background` atom, and the element paints the clay
background — the alias and the longhand share one cascade slot.

Evidence: `[atm]` MERGE-02 (`docs/evidence/atomic-claims.md` §2); station
`packages/reference-rs/modules/atomic/tests/cases/ATM-MERGE-02`.
