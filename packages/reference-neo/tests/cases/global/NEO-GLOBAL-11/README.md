# NEO-GLOBAL-11 — vendor pseudo-elements in `globalCss` pass through unchanged

The world authors two lib-shaped vendor rules: a range thumb
(`.ref-range::-webkit-slider-thumb`) and a file button
(`.ref-upload::file-selector-button`), each carrying token colours. The spec
checks the sheet carries both selectors verbatim with their token vars
inside `@layer global` — no `:is()` wrap, no rename — then checks computed
paint through the pseudo-element Chromium exposes: the file-button text
and field colours. The thumb is sheet-only (this Chromium returns the
input's own box for `::-webkit-slider-thumb` computed style).

Evidence: `[lib]` `docs/evidence/lib-sheet-styles-css.md` vendor family,
L811 range track, L848 Mozilla track; `[atm]` ATM-LAYER-03.
