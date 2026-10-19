# CORE-MERGE-03 — padding then paddingTop cascade per side regardless of sheet order

The world calls `css({ padding: 'sm' }, { paddingTop: 'lg' })` on one
element. The spec checks the sheet carries both atoms with the shorthand
printed first, the class string keeps both (separate slots), and all four
computed sides paint: the longhand top wins its side while the shorthand
holds the other three. Spacing tokens carry the values: rhythm `Nr` atoms
reference `--spacing-root`, which minimal systems never define.

Evidence: reference-rs cases
`rs-cases:ATM-SHORT-06` and
`ATM-ORDER-04`; Panda v1 test "resolve property conflicts and order - border
example".

> Search terms: box model, per-side, declaration order, expands, padding split, merge/shorthand-longhand, merge/sheet-order, CORE-MERGE-04
