# NEO-COND-18 — `& +` and `& ~` in `css()` paint following siblings only

The world emits two leader classes: `'& + [data-slot=peer]'` carrying an
adjacent margin and `'& ~ [data-slot=overlay]'` carrying a general-sibling
padding. The spec checks the sheet keeps both combinators, the adjacent
peer paints the margin while its leader stays flush, and the overlay past
a spacer paints the padding while the spacer stays flat.

Matrix source: `matrix/css-selectors/tests/e2e/css-selectors-contract.spec.ts`
"adjacent sibling selector applies margin to the following peer" +
"general sibling selector applies padding to later overlay siblings" +
`matrix/css-selectors/src/styles.ts` (`adjacentSiblingSelectorClass`,
`generalSiblingSelectorClass`).

> Search terms: sibling, adjacent, general sibling, combinator, data-slot, css-selectors, NEO-COND-18
