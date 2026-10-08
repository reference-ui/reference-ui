# NEO-SITE-07 — Cross-file `const` from `styles.ts` resolves

The world keeps its color value in `src/styles.ts` and styles the node
from `src/app.ts` through the imported `brand` binding. The spec asserts
the node paints cherry and the sheet carries exactly the one utility, so
a site value may live in another scanned file without losing its paint.

Evidence: `[atm]` ATM-SITE-16 (cross-file consts resolve; generated,
dist, and module dirs stay out of the scan); `[panda-v1]`
`vendor/panda-v1/packages/parser/__tests__/css-raw-spread.test.ts:423`
(spreading across files).

> Search terms: multi-file, separate file, module boundary, project scan, site/cross-file, NEO-SITE-02
