# NEO-LAYERS-07 — a layer's token names never reach the consumer: colour, spacing, radius and font-size uses each warn at their use site and paint no layer value, a font family stays raw and silent, and extends resolves the same names

The consumer lists one real upstream under `layers`. The upstream is a real sync:
`upstreams/up` declares one token in each category the consumer names (`upInk` colour,
`upGap` spacing, `upRadius` radius, `upFont` font family, `upSize` font size), plus one
badge recipe and one utility that resolve `upInk` inside the layer. The consumer world
(`world/src/app.tsx`) uses each token name twice, once in a JSX style prop on `Div` and
once in a `css()` call, beside an unstyled sibling `#plain` as the baseline.

The spec runs `sync()` on the upstream, rewrites the consumer `ui.config.ts` to
`layers: [up]`, re-syncs, and reads the diagnostics, the served sheet and the computed
style. It then rewrites the same upstream under `extends`, re-syncs, and reads them again.
The canonical config is restored in a `finally`.

Phase A (`layers: [up]`) proves:

1. Each colour, spacing, radius and font-size use raises one warning, at its own line in
   `world/src/app.tsx`: `ATM-W-UNKNOWN-COLOR` for `upInk`, `ATM-W-UNKNOWN-TOKEN` for `upGap`,
   `upRadius` and `upSize`. The font-family uses raise nothing. No warning is a sync error.
2. The consumer's own block prints each name raw (`color: upInk;`, `padding: upGap;`,
   `border-radius: upRadius;`, `font-size: upSize;`, `font-family: upFont;`) and never
   resolves an upstream variable. The upstream block declares its five token variables and
   resolves its own names inside the layer (`var(--colors-up-ink)`).
3. Paint: each colour, padding, radius and font-size probe paints the unstyled sibling's
   value. The font-family probes read the raw name `upFont`, not `Georgia, serif`.

Phase B (`extends: [up]`) proves the same names resolve. The sync raises no unknown-token
warning, no raw declaration survives in the sheet, and every probe paints the upstream value:
`rgb(190, 24, 93)`, `13px`, `9px`, `Georgia, serif` and `21px`.

Evidence: `packages/reference-rs/modules/atomic/src/resolve/tokens/bare_name.rs` (the bare-name
warning, which only the length categories reach), `packages/reference-rs/modules/atomic/src/resolve/tokens/scale.rs:22-24` (spacing, radii,
sizes and fontSizes are the length categories), `packages/reference-rs/modules/atomic/src/resolve/tokens/mod.rs:275-280` (the category each
prop maps to), and `packages/reference-rs/modules/atomic/src/diagnostics/codes.rs:253,280` (the two codes). Siblings: NEO-LAYERS-02
(one colour use under layers warns and paints nothing, under extends it paints), NEO-LAYERS-16
(the same boundary seen by the typechecker).

> Search terms: layers, layer-only token, unknown token, unknown colour, ATM-W-UNKNOWN-TOKEN,
> ATM-W-UNKNOWN-COLOR, use site, bare token name, spacing, radius, font size, font family,
> raw declaration, extends, positive control, NEO-LAYERS-02, NEO-LAYERS-16
