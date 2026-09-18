# NEO-CSS-04 — Unitless numbers take the property's unit policy and paint

The world calls `css()` with one numeric leaf per policy: a dimensional
width, two unitless props (`opacity`, `zIndex`), and an authored custom
property. The spec checks the sheet carries exactly those four utilities
with `px` only on the width, and each declaration paints its computed value.

Evidence: `[atm]` ATM-UNIT-01, ATM-UNIT-02; `[panda-v1]`
`vendor/panda-v1/packages/core/__tests__/rule-processor.test.ts:1215`
"unitless".

> Search terms: z-index, line-height, font-weight, px suffix, unit inference, css/units, css/numeric-values
