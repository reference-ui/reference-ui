# NEO-PRIM-06 — `variant` stamps `data-variant` and selects the tag recipe; neither it nor `colorMode` is a style prop

The world authors a `.ref-div[data-variant="accent"]` tag recipe in
`globalCss` (the recipe grammar the lib sheet uses: marker class plus
`[data-variant]`, not `recipe()`), then renders a plain Div twin, a
`variant="accent"` Div, and a `colorMode="dark"` Div, all style-free. The
spec checks the stamp plus marker class, the recipe paint on the variant
twin only, zero utilities in the sheet, and `stylePropNames` excluding both
keys in the published runtime data.

Evidence: `[lib]` `docs/evidence/lib-sheet-styles-css.md` §3 (90 `.ref-*`
stems, `[data-variant]`, empty `recipes` layer); `[atm]` ATM-COND-06; PLAN
§4.3 ABI.
