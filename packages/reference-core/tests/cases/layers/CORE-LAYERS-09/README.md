# CORE-LAYERS-09 — a layered upstream's published component paints its own tokens at top level inside a consumer primitive, with and without html data-color-mode and in dark mode

The consumer lists a real upstream under `layers`. The upstream is a real sync (`upstreams/up`): it
declares one colour token with a light and a dark leaf (`upInk`) and one utility source that calls
`css({ color: 'upInk' })`, so the layer emits its rule. The spec syncs that upstream, copies its
published react entry (`.reference-ui/react/react.mjs`, bound to the upstream's own layer
`core-layers9-up`) beside the world, rewrites the consumer `ui.config.ts` to `layers: [up]`, re-syncs,
and restores the canonical spelling in a `finally`.

The page renders a consumer `Div` (layer `core-layers9`) that holds a same-system `Div` and the
upstream's `Div` with `color="upInk"`. The page loads once per leg, and the query string sets html
`data-color-mode` before the first render:

1. No html `data-color-mode`: the upstream probe paints the light leaf.
2. Html `data-color-mode="light"`: the probe still paints the light leaf.
3. Html `data-color-mode="dark"`: the probe paints the dark leaf.

Each leg proves, on the live DOM and computed style:

- The upstream component's own root carries `data-layer="core-layers9-up"`, so its
  `var(--colors-*)` resolve inside its own scope.
- That root paints the upstream token's value: `rgb(190, 24, 93)` light, `rgb(249, 168, 212)` dark.
- The consumer primitive stamps `core-layers9`, and the same-system `Div` keeps today's rule: stamped
  with no colour mode in effect, unstamped under one.

Why it fails before the fix: `LayerScopeContext` is one boolean shared through `Symbol.for` across
every system. A primitive whose ancestor is any primitive, and whose colour mode is set through the
page or an ancestor, skipped its stamp. The upstream probe then lost its layer scope, so
`var(--colors-up-ink)` resolved to nothing and the probe inherited the page ink. The fix carries the
nearest ancestor's layer name, so a primitive of another system always stamps, and only the same
system keeps the skip.

Evidence: `packages/reference-rs/modules/primitives/js/context.ts` (the scope context and the stamp
rule), `packages/reference-core/src/primitives/generate/generate.ts` (each system binds its own layer
name through `configurePrimitives`), `src/config/types.ts` (the `layers` field), `src/sync/index.ts`
(the upstream sync and the published react entry). Siblings: CORE-LAYERS-01 (a layer paints between
extends and own), CORE-LAYERS-02 (the layered visual-only boundary), CORE-PRIM-07 (colour-mode islands
on one system), CORE-PGEN-02 (the first primitive stamps its layer on a plain root).

> Search terms: layers, layered component, published react entry, upstream Div, data-layer, data-color-mode, colour mode, dark mode, shared layer scope context, cross-system nesting, Symbol.for, LayerScopeContext, CORE-LAYERS-01, CORE-LAYERS-02, CORE-PRIM-07, CORE-PGEN-02
