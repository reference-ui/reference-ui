# NEO-LAYER-01 — the six-layer order holds with reset present and empty base/recipes omitted while utilities beat token and higher-specificity earlier-layer rules

The world declares a light/dark `brand` token, a `.ref-chip[data-tone]`
tag recipe in `globalCss`, and three probes: one carrying
`data-color-mode=dark` whose utility redefines `--colors-brand`, one chip
carrying a `color` utility against the `(0,2,0)` tag rule, and one bare
chip as the control. The spec checks the sheet carries the six-name order
statement with the `reset` present and the `base` and `recipes` bodies omitted, then
checks computed: the dark probe paints the utility var (beating the
equal-specificity token island by rank), the chipped utility paints brand
(beating the more specific global rule by rank alone), and the control
paints the tag colour (so the global rule is proven live).

Evidence: `[lib]` `styles.css` L70 (order statement); `[panda-v1]`
`core/src/layers.ts`; `[atm]` ATM-LAYER-02, ATM-LAYER-03, ATM-LAYER-04.

> Search terms: @layer, layer rank, layer sequence, empty layer elision, custom property, dark mode var, layer precedence, layer/order-statement, layer/empty-elision, layer/utility-rank, NEO-LAYER-05, NEO-LAYER-06
