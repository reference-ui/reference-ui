# CORE-MERGE-07 — an `!important` atom beats a later plain atom in the same slot

The world calls `css({ color: 'ember!' }, { color: 'ocean' })` on one
element and the reversed authorship on a twin, beside a plain-only
control. The spec checks the sheet carries both atoms with the spaced
`!important` spelling, both merged class strings are the important atom
alone, and both paint ember while the control paints ocean.

Evidence: Panda v1 global-CSS tests for important; reference-rs case
`rs-cases:ATM-LEAF-09`.

> Search terms: bang suffix, exclamation mark, trailing bang, priority, exclamation override, merge/important, merge/slot-precedence, CORE-MERGE-01
