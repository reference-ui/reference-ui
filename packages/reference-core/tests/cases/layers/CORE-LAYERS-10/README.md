# CORE-LAYERS-10 — consumer content inside a layered component keeps the consumer's token values, and each root stamps its own data-layer

The consumer and a layered upstream both define one colour token, `probeInk`, with different values.
The upstream's leaves are `#be185d` (light) and `#f9a8d4` (dark). The consumer's are `#15803d` (light)
and `#86efac` (dark). The upstream is a real sync (`upstreams/up`): it emits its own `probeInk`
utility, so its layer carries a rule the page can paint. The spec syncs that upstream, lists it under
`layers` in the consumer `ui.config`, re-syncs, copies the upstream's published react entry beside
the world, and restores the canonical spelling in a `finally`.

The page renders the upstream's `Div` with `color="probeInk"`, and that layered component holds one
consumer `Div` as its child, also with `color="probeInk"`. The page loads once per leg, and the query
string sets html `data-color-mode` before the first render:

1. No html `data-color-mode`.
2. Html `data-color-mode="light"`.
3. Html `data-color-mode="dark"`.

Each leg proves, on the live DOM and computed style:

- The layered component's root carries `data-layer="core-layers10-up"` and paints the upstream value
  (`rgb(190, 24, 93)` light, `rgb(249, 168, 212)` dark).
- The consumer child is nested inside that root, carries `data-layer="core-layers10"`, and paints the
  consumer value (`rgb(21, 128, 61)` light, `rgb(134, 239, 172)` dark).

The sheet is read beside the paint: the upstream's `probeInk` rule sits in its layer block, and the
consumer's own rule sits in the own block.

Why the child needs its own stamp: custom properties inherit. An unstamped child inside the upstream
root reads `--colors-probe-ink` from the upstream's scope and paints the upstream value. Its own
`data-layer` puts it under its own system's scope.

Why the colour-mode legs matter: `LayerScopeContext` was one boolean shared across every system. A
primitive under any ancestor primitive skipped its stamp whenever a colour mode was in effect, so the
consumer child inside the upstream root lost its stamp in legs 2 and 3. Commit 0b124ea85 carries the
nearest ancestor's layer name instead: a primitive whose ancestor belongs to another system always
stamps. Leg 1 has no colour mode in effect, so it passes both before and after that fix.

Evidence: the primitives scope context (the stamp rule and the layer-name
scope), the primitives generator (each system binds its own layer
name), the config types (the `layers` field), the sync entry (the upstream sync and the
published react entry). Siblings: CORE-LAYERS-09 (the upstream probe under a consumer primitive),
CORE-LAYERS-01 (a layer paints between extends and own), CORE-LAYERS-02 (the layered visual-only boundary).

> Search terms: layers, layered component, consumer content, children, nested primitive, same-named token, probeInk, data-layer, data-color-mode, colour mode, dark mode, LayerScopeContext, custom property inheritance, 0b124ea85, CORE-LAYERS-01, CORE-LAYERS-02, CORE-LAYERS-09
