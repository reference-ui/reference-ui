# CORE-TOKEN-10 — the `font()` registry emits `--fonts-*` and `--font-weights-*` and the `font: 'sans'` macro paints family + weight

The world registers the Inter `sans` family with thin, normal, and bold
weights. The host derives the `fontWeights` token subtree into the evaluated
spec (mirroring the retired reference-core `buildFontTokens`), so the tokens layer carries both
`--fonts-sans` and the three `--font-weights-sans-*` vars; the browser
agrees — the macro probe paints the Inter stack at weight 400.

Placement note: this row belongs to the TOKEN group (TESTS.md
`CORE-TOKEN-10`), but the remainder rung is SYNC-owned
(`collect/lib/evaluate.ts` merge), so the case lives under `sync/`.

Evidence: reference-lib `styles.css` L2173–2191 (font vars); ATM-COND-05.

> Search terms: type-scale, webfont, font-stack, weight-axis, sans macro, typeface kit, tokens/font-registry, tokens/font-macro, CORE-LAYER-04
