# NEO-RECIPE-10 — Variant + `css()` utilities on the same node: utilities win via layer order

The world defines one `flag` recipe and paints one probe with the recipe
class plus a `css()` color utility. The spec checks the recipe rule lives in
`@layer recipes`, the utility in the later `@layer utilities`, and the mixed
probe paints the utility color while the recipe-only probe keeps its own.

Evidence: `[atm]` ATM-RECIPE-03, ATM-LAYER-04 (P2 #19).

> Search terms: cascade layers, specificity, class merging, override precedence, recipe/layers, recipe/css-interop, NEO-RECIPE-05
