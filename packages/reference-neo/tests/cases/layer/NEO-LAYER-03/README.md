# NEO-LAYER-03 — `@keyframes` and `@font-face` print once in `@layer global` and the animation runs

The world registers one `fadeSlide` keyframe with literal bodies, one
`display` family with a `fontFace` block, and two probes: one animated,
one set in the family. The spec checks the sheet carries exactly one
`@keyframes fadeSlide` and one `@font-face`, both inside the global
layer, then checks computed: the animated probe names `fadeSlide` with a
live animation, and the family probe paints the `Display` stack. Token
refs inside keyframe bodies belong to TOKEN-13; the `animations` token
registry belongs to TOKEN-11 — this case asserts placement and paint.

Evidence: `[lib]` 31 keyframes / 3 faces; `[research]` global-css §6.4;
`[atm]` ATM-LAYER-05, ATM-LAYER-06; cross-ref TOKEN-11 (registry).

> Search terms: animation-name, font-family, webfont, dedupe, single emission, fade slide, keyframe placement, layer/global, layer/keyframes, layer/font-face
