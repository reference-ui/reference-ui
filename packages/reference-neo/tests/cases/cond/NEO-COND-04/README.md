# NEO-COND-04 — `_light`/`_dark` utilities flip with `data-color-mode` on any ancestor

The world calls `css()` with a base color plus `_light` and `_dark`
colors on one element. The spec checks the sheet carries exactly three
utilities wrapped in single `[data-color-mode=…]` ancestors with no
second stamp, the element paints its base color with no attribute set,
and flipping `data-color-mode` first on `html` and then on a nested
wrapper repaints it to the matching leaf each time.

Evidence: `[atm]` P0 #1 (`docs/evidence/atomic-claims.md` colour-mode
islands), ATM-COND-03, ATM-COND-08; `[panda-v1]`
`vendor/panda-v1/packages/core/__tests__/atomic-rule.test.ts:119`
"respect color mode" (four-way selectors, the contrast Reference
refuses); `[decision D1]` (single `data-color-mode` attribute).
