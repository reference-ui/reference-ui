# NEO-TOKEN-10 — the `font()` registry emits `--fonts-*` and `--font-weights-*` and the `font: 'sans'` macro paints family + weight

The world registers the Inter `sans` family with thin, normal, and bold
weights. The host derives the `fontWeights` token subtree into the evaluated
spec (mirroring core `buildFontTokens`), so the tokens layer carries both
`--fonts-sans` and the three `--font-weights-sans-*` vars; the browser
agrees — the macro probe paints the Inter stack at weight 400.

Provenance note: this row belongs to the TOKEN group (TESTS.md
`NEO-TOKEN-10`), but the remainder rung is SYNC-owned
(`fragments/base/index.ts` merge via the Gap-1 easement), so the SYNC-mop
slice proves it here under `sync/`; the captain may move the folder home to
`token/` with no id change.

Evidence: `[lib]` `styles.css` L2173–2191 (font vars); `[core]` font
registry `buildFontTokens`; `[atm]` ATM-COND-05.

> Search terms: type-scale, webfont, font-stack, weight-axis, sans macro, typeface kit, tokens/font-registry, tokens/font-macro, NEO-LAYER-04
