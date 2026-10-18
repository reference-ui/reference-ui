# CORE-PRIM-11 — array `css` props flow through the split to `css()` merge and paint

The world renders one Div with the Panda array form `css={[{ color:
'blue.300' }, { backgroundColor: 'green.300' }]}`. The spec checks both
utilities in the sheet, both computed paints in the browser, the `css`
key staying off the DOM, and the layer stamp. The form typechecks with
no expect-error shim: `PrimitiveCssProp` admits arrays.

Evidence: Panda v1 array `css` prop tests; engine RS-23/ATM-SITE-19; probe.

> Search terms: compose, sequence, multi-object, list-form, style list, prim/css-array, prim/split-merge, CORE-PRIM-02
