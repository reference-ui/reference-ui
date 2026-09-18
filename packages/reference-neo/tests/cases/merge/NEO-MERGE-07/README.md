# NEO-MERGE-07 — an `!important` atom beats a later plain atom in the same slot

The world calls `css({ color: 'ember!' }, { color: 'ocean' })` on one
element and the reversed authorship on a twin, beside a plain-only
control. The spec checks the sheet carries both atoms with the spaced
`!important` spelling, both merged class strings are the important atom
alone, and both paint ember while the control paints ocean.

Evidence: `[panda-v1]`
`vendor/panda-v1/packages/core/__tests__/global-css.test.ts` important;
station `packages/reference-rs/modules/atomic/tests/cases/ATM-LEAF-09`.
