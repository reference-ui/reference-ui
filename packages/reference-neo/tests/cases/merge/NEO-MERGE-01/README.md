# NEO-MERGE-01 — two css() args merge last-wins per slot while the sheet keeps both atoms

The world calls `css({ color: 'ember' }, { color: 'ocean' })` on one
element. The spec checks the sheet carries both color atoms, the emitted
class string is exactly the second atom, and the element paints the second
color — the runtime merge collapses the shared slot while the stylesheet
stays complete.

Evidence: `[atm]` P0 #7 (`docs/evidence/atomic-claims.md` §6); station
`packages/reference-rs/modules/atomic/tests/cases/ATM-MERGE-01`.
