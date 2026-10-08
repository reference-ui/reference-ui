# NEO-RECIPE-05 — `recipe(...).raw(props)` returns a style object that `css()` paints identically

The world defines one `panel` recipe and feeds `raw()` output into `css()`
beside the plain recipe call. The spec checks `raw()` merges base, variant,
and matching compound leaves, and that raw-fed nodes paint computed styles
equal to their class-fed twins.

Evidence: `[decision D16]` (`recipe(...).raw()` shipped, `css.raw` not);
`[panda-v1]` `generator/src/artifacts/js/cva.ts:63` (`raw: resolve`).

> Search terms: plain-object form, css() input, unstyled output, twin parity, object twin, recipe/raw, recipe/css-interop, NEO-RECIPE-10
