# CORE-COND-18 — `& +` and `& ~` in `css()` paint following siblings only

The world emits two leader classes: `'& + [data-slot=peer]'` carrying an
adjacent margin and `'& ~ [data-slot=overlay]'` carrying a general-sibling
padding. The spec checks the sheet keeps both combinators, the adjacent
peer paints the margin while its leader stays flush, and the overlay past
a spacer paints the padding while the spacer stays flat.

Matrix source: the CSS-selectors contract spec
"adjacent sibling selector applies margin to the following peer" +
"general sibling selector applies padding to later overlay siblings" +
the selector styles (`adjacentSiblingSelectorClass`,
`generalSiblingSelectorClass`).

> Search terms: sibling, adjacent, general sibling, combinator, data-slot, css-selectors, CORE-COND-18
