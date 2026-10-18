# CORE-LAYERS-01 — a layered upstream's styles reach the consumer and paint, ranked extends < layers < own

The consumer lists one real upstream under `extends` and another under `layers`.
Both are synced for real: the spec runs `sync()` on each upstream package, reads
its published `baseSystem.mjs`, rewrites the consumer config to
`extends: [ext]` and `layers: [lay]`, and re-syncs the consumer. A stand-in entry
has no `streams`, so a layer built from one would contribute no CSS and prove
nothing; this case refuses stand-ins.

What the spec proves, on the served `styled/styles.css` and in computed style:

1. The served sheet opens with the own root default, then the order statement
   `@layer core-layers1-ext, core-layers1-lay, core-layers1;`, then the extends
   block, the layers block and the own block, in that order.
2. A utility the layers upstream emits, `core-layers1-lay__c_layInk` (colour) and
   `core-layers1-lay__bg-c_layPaper` (background), paints its upstream token value
   on an element of the consumer's `index.html`.
3. Where a layer and an extends entry set the same property, the layer wins. Where
   a layer and the consumer's own `css()` set it, own wins. Equal specificity, so
   only layer order decides.
4. The layer's portable token variables resolve inside its
   `[data-layer="core-layers1-lay"]` scope, and the ink variable reads empty
   outside it.

Layer probes carry `data-layer="core-layers1-lay"` the way that upstream's own
primitives would. The reason is the sheet: `tokensPortable` is scoped by
`[data-layer]`, so `color: var(--colors-lay-ink)` resolves only under that scope.
Layer tokens also never reach the consumer's own `:root`, which holds only the
extends token (`--colors-ext-ink`).

Evidence: `src/config/types.ts:44-49` (the `layers` field),
`src/sync/index.ts:135,152,206` (upstream names, container root, bucket merge),
`src/system/base/streams.ts:185-214` (statement, blocks, own block),
`src/collect/lib/evaluate.ts:63,110` and `src/system/base/jsx.ts:112` (fragments and
roster read `extends` only). Siblings: CORE-CHAIN-06 (real upstream sync under
`extends`), CORE-LAYER-02 (two-system package nesting).

> Search terms: layers, layered upstream, visual-only upstream, cascade layer order, extends below layers below own, portable tokens, data-layer scope, real upstream sync, mergeStreams, order statement, CORE-CHAIN-06, CORE-LAYER-02
