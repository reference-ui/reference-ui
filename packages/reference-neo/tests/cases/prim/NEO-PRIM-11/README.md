# NEO-PRIM-11 — array `css` props flow through the split to `css()` merge and paint

The world renders one Div with the Panda array form `css={[{ color:
'blue.300' }, { backgroundColor: 'green.300' }]}`. The spec checks both
utilities in the sheet, both computed paints in the browser, the `css`
key staying off the DOM, and the layer stamp. The form typechecks with
no expect-error shim: `PrimitiveCssProp` admits arrays.

Evidence: `[panda-v1]` `jsx.test.ts:529`; engine RS-23/ATM-SITE-19;
N3 R1 `/tmp/n3cook-r1.mjs`.

> Search terms: compose, sequence, multi-object, list-form, style list, prim/css-array, prim/split-merge, NEO-PRIM-02
