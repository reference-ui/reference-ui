# CORE-LAYERS-17 — an extendSystem override of a layered upstream's token paints its component in light and dark, keeps the data-layer name, and rides the consumer's published streams

The consumer lists a real upstream under `layers`, and brands that upstream's published system in its own module,
`world/src/system/up.ts`. `brandUp` applies one `extendSystem` call to the upstream's base system. It overrides two of
the upstream's tokens: `upInk` gets a light and a dark value, and `upSoft` gets a light-only value over a token the
upstream darkens. The spec syncs the upstream for real (`upstreams/up`), copies its published react entry beside the
world, rewrites the consumer `ui.config.ts` to import `brandUp` and list `brandUp(upBaseSystem)` under `layers`,
re-syncs, and restores the canonical config in a `finally`.

The page renders a consumer `Div` that holds two probes from the upstream's published `Div`: `color="upInk"` and
`color="upSoft"`. The page loads once per leg, and the query string sets html `data-color-mode` before the first render:

1. No html `data-color-mode`: `upInk` paints its override light value, and `upSoft` paints its light-only value.
2. Html `data-color-mode="light"`: the same as leg 1.
3. Html `data-color-mode="dark"`: `upInk` paints its override dark value. `upSoft` still paints its light-only value,
   because the override prints a dark rule that replaces the upstream's own dark value.

Each leg proves, on the live DOM and computed style, that each probe keeps `data-layer="core-layers17-up"`, the
upstream's name, unchanged, and that the probe paints the value above. The consumer root stamps `core-layers17`.

The spec then proves the rest:

- The consumer's published `baseSystem.mjs` carries the override block at the end of the upstream's stream entry: a light
  rule on the `[data-layer]` stamps, and a dark rule with `upInk`'s dark value and `upSoft`'s light value.
- The served sheet carries the upstream's `@layer` block, so the rules ride the consumer's own stylesheet.
- Editing `up.ts` (the light value of `upInk` changes) and re-syncing changes the paint on the next load. `upSoft` keeps
  its light-only paint. The spec restores `up.ts` in its `finally`.

Why it would fail: if the override dropped its dark rule for a light-only leaf, `upSoft` would paint the upstream's dark
value in dark mode. If the override changed the layer name, the probe would leave the upstream's scope and lose its paint.

Evidence: `src/system/base/extend.ts` (`extendSystem` and the override block it prints), `src/system/base/extend.test.ts`
(the block's selectors and values), `src/sync/index.ts` (the layers sync). Siblings: CORE-LAYERS-09 (the upstream probe
pattern this case copies), CORE-LAYERS-18 (the override shapes through a real sync), CORE-LAYERS-10 (layered consumer content).

> Search terms: extendSystem, layers, branded, theme, override, light and dark, data-layer, data-color-mode, dark mode,
> published streams, baseSystem.mjs, upstream probe, light-only override, re-sync, paint, computed style, CORE-LAYERS-09,
> CORE-LAYERS-18
