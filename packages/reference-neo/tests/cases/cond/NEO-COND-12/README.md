# NEO-COND-12 — `_motionReduce`, `_osDark`, `_print` lower to the preset `@media` lists

The world calls `css()` with a spinning animation plus a `_motionReduce`
`none` arm, a base ink color plus an `_osDark` brand arm, and a base
`block` display plus a `_print` `none` arm. The spec checks the sheet
carries six utilities inside the three preset `@media` lists, and each
target flips computed style under `page.emulateMedia` — reduced motion
stops the spin, dark scheme paints brand, print hides the block — and
flips back when emulation resets.

Evidence: `[atm]` P1 #12 (`@media` presets COND-11); `[lib]`
`docs/evidence/lib-sheet-global-css.md` reduced-motion reset; R1 probe
`/tmp/cond-batch4-r1/probe.mjs` emits the three at-rules.

> Search terms: prefers-reduced-motion, prefers-color-scheme, print stylesheet, dark mode, accessibility, media queries, os prefs, media/motion-reduce, media/os-dark, media/print
