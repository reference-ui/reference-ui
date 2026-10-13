# NEO-LAYERS-02 — a layered upstream ships CSS only; under extends the same upstream also becomes authoring surface

The consumer lists one real upstream twice, once under `layers` (phase A) and once under
`extends` (phase B). The upstream is a real sync: `upstreams/up` declares one colour token
(`upInk`), one recipe (`layBadge`), one custom element name in its roster (`LayerCard`) and one
utility. The spec runs `sync()` on it, rewrites the consumer `ui.config.ts` between the phases,
re-syncs, and restores the canonical spelling in a `finally`.

Phase A (`layers: [up]`) proves, from the synced artefacts and computed style:

1. The consumer spec holds none of the upstream's authoring surface. `system/evaluated-system.json`
   has no `upInk` colour and no `layBadge` recipe. `system/jsx-elements.json` has an empty
   `upstream` list and no `LayerCard` in `merged`. The published `system/baseSystem.mjs`
   `fragment` does not mention `upInk`, and its `jsxElements` is empty. `styled/types/index.d.ts`
   declares no `ColorToken` for `upInk` and no `LayBadgeVariantProps`.
2. The CSS still lands. `styled/styles.css` carries the statement `@layer neo-layers2-up, neo-layers2;`
   after the root default, then the upstream block, which carries its portable token, the utility
   `.neo-layers2-up__c_upInk` and the recipe rule `.neo-layers2-up__layBadge_s_lg`, all before the
   own block.
3. Paint: the upstream utility paints `rgb(190, 24, 93)` and the upstream recipe paints
   `font-size: 20px` on probes in `index.html`. Those probes carry `data-layer="neo-layers2-up"`
   the way the upstream's own primitives would, because its portable token variable resolves only
   under that scope (`[data-layer]`, D3 in `layers/SPEC.md`). Without the scope the utility paints
   nothing, which is the same rule the probe would show for any layer-only token.
4. A consumer `css({ color: 'upInk' })` under layers is not a sync error. Sync resolves with one
   `ATM-W-UNKNOWN-COLOR` warning at the consumer's `src/app.ts` call, naming `upInk`, and emits the
   raw declaration `color: upInk;`. The browser drops that declaration, so the token probe inherits
   the colour of an unstyled sibling. The probe's class is asserted first, so a script that never
   ran cannot pass by inheritance.

Phase B (`extends: [up]`) proves the same artefacts gain the upstream: the token and the recipe
enter the evaluated spec, the roster carries `LayerCard`, the published fragment mentions `upInk`,
`ColorToken` includes `'upInk'`, and the consumer's `css({ color: 'upInk' })` emits
`var(--colors-up-ink)` and paints `rgb(190, 24, 93)`. Sync emits no layer warning.

Two notes. Token and recipe typegen lands in `styled/types/index.d.ts`; `react/react.d.mts`
carries no token names in either phase, so it is not used as an oracle. Under extends the
upstream recipe also prints inside the own block, because the own spec now holds the recipe; that
duplication is current behaviour and is not asserted here.

Evidence: `src/config/types.ts:44-49` (the `layers` contract: streams join, fragments and roster
stay extends-only), `src/sync/index.ts:161-169` (upstream names, extends then layers),
`src/sync/index.ts:219-223` (the merge reads both buckets), `src/collect/lib/evaluate.ts:133,164`
(fragments read extends only), `src/system/base/jsx.ts:71` (the roster reads extends only),
`src/packager/system.ts:23-39` (the published artefacts), `src/system/base/streams.ts:185-214`
(the statement and blocks). Siblings: NEO-LAYERS-01 (a layer paints between extends and own),
NEO-CHAIN-06 (real upstream sync under extends), NEO-SYNC-08 (the rejection pattern, which this
case does not need because an unknown layer token warns rather than fails).

> Search terms: layers, visual-only upstream, extends authoring surface, portable tokens, recipe
> adoption, jsxElements roster, layer-only token, ATM-W-UNKNOWN-COLOR, ColorToken typegen, raw
> declaration, NEO-LAYERS-01, NEO-CHAIN-06, NEO-SYNC-08
