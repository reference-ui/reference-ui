# NEO-COND-04 — `_light`/`_dark` utilities flip with `data-color-mode` on any ancestor

The world calls `css()` with a base color plus `_light` and `_dark`
colors on one element. The spec checks the sheet carries exactly three
utilities wrapped in single `[data-color-mode=…]` ancestors with no
second stamp, the element paints its base color with no attribute set,
and flipping `data-color-mode` first on `html` and then on a nested
wrapper repaints it to the matching leaf each time.

Evidence: colour-mode islands, ATM-COND-03, ATM-COND-08; Panda v1 test "respect
color mode" (four-way selectors, the contrast Reference refuses); single
`data-color-mode` attribute.

> Search terms: light mode, dark mode, theming, color scheme, mode switch, light dark, theme toggle, conditions/light, conditions/dark
