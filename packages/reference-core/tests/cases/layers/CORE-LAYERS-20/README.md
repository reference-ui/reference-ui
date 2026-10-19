# CORE-LAYERS-20 — through a chain where b extends a, an app that extends b paints its own token value inside a's and b's components, and an app that layers b paints b's value inside both

The nested side of the token-scope ruling (CORE-LAYERS-19 is the
direct side). Three systems define `brand`: package a (`core-layers20-a`, `#7e22ce`), package b
(`core-layers20-b`, `#b45309`), which extends a, and the app (`core-layers20`, `#15803d`). a ships `ABadge` and b
ships `BCard`, each a `Span` that styles itself with its own `bg="brand"`; `prebuilt/nested.mjs` stands for their
dists and renders each through its own package's bound `react.mjs`, so each element stamps its own package's
`data-layer`. The page renders `ABadge` on its own (`#a-direct`) and `BCard` (`#b-card`) holding another `ABadge`
(`#a-in-b`), the way b's own components wrap a's. No probe carries an app style prop.

The spec syncs a through the real `sync()`, rewrites b's config to extend a and syncs b, checks that b's published
own token entry claims a's stamps after its own, then composes b into the app twice, re-syncing each time:

| probe | app `extends: [b]` | app `layers: [b]` |
| --- | --- | --- |
| `#a-direct` (a's own `bg="brand"`) | app brand | b brand |
| `#b-card` (b's own `bg="brand"`) | app brand | b brand |
| `#a-in-b` (a's own `bg="brand"`, inside b) | app brand | b brand |

Beside the paint, the served sheet is read: under extends the app's own token rule names its stamp, then a's, then
b's; under layers it names its own stamp alone. Light mode only; CORE-LAYERS-19 reads both modes. Every canonical
config is restored with a heal sync in a `finally`.

Mechanism. A system's token rule declares on its own `[data-layer]` stamps and on the stamps of every system it
extends, read from the fragment nodes it evaluates, in the served sheet and in the published portable entry alike.
Extends: the app evaluates a's and b's fragments, so its rule claims both stamps, and its block ranks last. Layers:
the app evaluates neither, but b's published entry claims a's stamps, and b's block ranks after a's, so b's values
hold inside a's elements as they do in b's own pages.

One consequence is stated, not hidden: under layers `#a-direct` paints b's brand too. A stamp names the package that
renders an element, not the package that composed it, so every a element in the page takes b's values once b claims
a's stamps. An app that wants a's own values for a's components it renders itself composes a directly under extends,
and then its own values win there.

Why it fails before the fix: each token rule named only its own stamp. Run against `public-release` (`f75f22869`),
the spec fails with seven lines: b's published tokens do not claim a's stamps, the app's own rule names the wrong
stamps under extends, both a probes paint a's `rgb(126, 34, 206)` in both legs, and b's Card paints b's
`rgb(180, 83, 9)` under extends. b's Card under layers already passed there.

Evidence: `packages/reference-rs/modules/atomic/src/stylesheet/system_layers/scope.rs` (the stamp lists),
`packages/reference-core/src/system/base/extended.ts` (the extends closure, and `extendedSystemsOf` for a published
system), `src/system/base/extend.ts` (an override block claims the same stamps). Siblings: CORE-LAYERS-19 (direct
composition, dark mode, package-only tokens), CORE-CHAIN-01 (transitive extends), CORE-LAYERS-11 (a diamond through
layers), CORE-LAYERS-17 (extendSystem on a layered package).

> Search terms: token scope, nested composition, transitive extends, extends closure, layers, data-layer, package component, brand, extendedSystems, published tokensPortable, stamps, owner ruling, CORE-LAYERS-19, CORE-CHAIN-01, CORE-LAYERS-11, CORE-LAYERS-17
