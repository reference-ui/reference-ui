# CORE-LAYERS-13 — a layer's dark and breakpoint rules keep their layer rank: own beats them and layers beat extends under the same condition

The consumer lists one real upstream under `extends` (ext) and another under `layers` (lay).
Both are synced for real. Each upstream ships two conditional utilities: a dark-mode colour
(`_dark`, a `[data-color-mode=dark]` wrap) and a wide-container colour (`sm`, a 640px
`@container` query). The consumer adds its own base, dark and wide rules in the app fixture.

Eight probes cover the three ranks under both conditions. Each probe lists its upstream
classes statically in `index.html` and receives its own rule at runtime. The spec reads each
probe's computed colour in four scenarios (light or dark, container 800px or 400px) and
compares it with its truth table, where a probe with no applicable rule must match the
unstyled `#plain` sibling.

What the spec proves:

1. The served sheet opens with `@layer core-layers13-ext, core-layers13-lay, core-layers13;`,
   then the ext block, the lay block and the own block. The ext dark and wide rules sit in
   the ext block, the lay dark and wide rules in the lay block, and the own rules in the own block.
2. A layer's dark rule keeps its layer rank. Under dark mode, own's unconditional base colour
   still wins over the more specific `[data-color-mode=dark]` rule the layer ships
   (`dark-own-base`). The layer's dark rule also beats extends' base colour (`dark-layer-over-ext-base`).
3. Under the same condition, own beats layers: own dark over layer dark (`dark-own-dark`),
   own wide over layer wide (`wide-own-sm`).
4. Under the same condition, layers beat extends: layer dark over extends dark
   (`dark-layer-over-ext-dark`), layer wide over extends wide (`wide-layer-over-ext-sm`), and
   layer wide over extends base (`wide-layer-over-ext-base`).
5. The breakpoint leg has a query container. The consumer's `container: true` call on `#root`
   emits `container-type: inline-size` in the own block, so the `sm` queries measure `#root`.
   The sync still warns `ATM-W-MISSING-CONTAINER-ROOT` for these `@container` atoms, because that
   check reads a container root from `globalCss` only. The warning is not asserted here; CORE-LAYERS-04 owns it.

The layer probes carry `data-layer="core-layers13-lay"` the way that upstream's own primitives
would, so the portable layer tokens resolve in their scope. The class names are the engine's
names for each conditional utility (`<system>__dark:c_<token>`, `<system>__sm:c_<token>`); the
spec asserts each name in the published utilities, so a renamed class fails loud.

The committed `ui.config` imports nothing; the spec rewrites it, re-syncs, and restores the
canonical spelling in a `finally`.

> Search terms: layers, dark mode, data-color-mode, breakpoint, container query, sm, cascade layer rank, own beats layer, layer beats extends, conditions under layers, CORE-LAYERS-01, CORE-LAYERS-04, CORE-COND-02
