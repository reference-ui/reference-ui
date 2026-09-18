# NEO-MERGE-03 — padding then paddingTop cascade per side regardless of sheet order

The world calls `css({ padding: 'sm' }, { paddingTop: 'lg' })` on one
element. The spec checks the sheet carries both atoms with the shorthand
printed first, the class string keeps both (separate slots), and all four
computed sides paint: the longhand top wins its side while the shorthand
holds the other three. Spacing tokens carry the values: rhythm `Nr` atoms
reference `--spacing-root`, which minimal systems never define.

Evidence: `[atm]` P0 #4 (`docs/evidence/atomic-claims.md` §6); stations
`packages/reference-rs/modules/atomic/tests/cases/ATM-SHORT-06` and
`ATM-ORDER-04`; `[panda-v1]` `vendor/panda-v1/packages/core/__tests__/rule-processor.test.ts:1318`
"resolve property conflicts and order - border example".
