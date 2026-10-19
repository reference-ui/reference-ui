# CORE-LAYERS-19 — under extends the app's token value paints inside a package's components, its own styles and the app's alike; under layers the package keeps its value, and a package-only token keeps its value either way

Owner ruling, 2026-10-19 (token scope under extends vs layers): when an app composes a design-system
package with `extends`, the app's token values win, including inside that package's components. When it composes
it with `layers`, the package keeps its own token values. The share guide promises the same.

The world keeps the prebuilt importmap shape: the page reaches acme through its importmap, and nothing installs it in
the world install. `upstream/` is a real package, acme (`core-layers19-acme`). Its
tokens define `brand` (`#be185d`, dark `#f9a8d4`), the public `acmeOnly` (`#1d4ed8`, dark `#93c5fd`) and the private
`_private.seal` (`#7c3aed`, dark `#c4b5fd`). Its Badge component declares two components: `Badge`, a `Span` that
styles itself with `bg="brand"`, `color="acmeOnly"` and `borderColor="_private.seal"`, and `Plain`, a `Span` that
forwards what its caller writes. The acme prebuilt stand-in stands for acme's dist: it renders both through acme's bound
react entry, so every element stamps `data-layer="core-layers19-acme"`. The app (`core-layers19`) defines `brand`
too (`#15803d`, dark `#86efac`) and renders an own `Div bg="brand"` control, `<Badge>`, and `<Plain bg="brand">`.
Since acme is not installed, the app's sync cannot follow `@fixture/layers19` to a directory and lowers nothing for
`<Plain bg="brand">` (an import that lands nowhere is not a Reference package, ATM-SITE-103). The class acme's runtime
mints for it, `core-layers19-acme__bg_brand`, is backed by acme's own published rule for Badge's `bg="brand"`. The
probe reads token scope, which `data-layer` decides whichever block prints the rule.

The spec syncs acme through the real `sync()`, then composes it twice, re-syncing the app each time: first under
`extends`, then under `layers`. Each composition loads the page with html `data-color-mode` light, then dark.
Expected, per leg:

| probe | extends | layers |
| --- | --- | --- |
| own control, `bg="brand"` | app brand | app brand |
| Badge, acme's own `bg="brand"` | app brand | acme brand |
| Badge, acme's own `color="acmeOnly"` | acme value | acme value |
| Badge, acme's own `borderColor="_private.seal"` | acme value | acme value |
| Plain, the app's `bg="brand"` | app brand | acme brand |

Both acme probes keep `data-layer="core-layers19-acme"` in every leg. Beside the paint, the served sheet is read:
under extends the own block's token rule also names acme's stamps; under layers it does not. The runtime must log
no `no compiled class` miss. The canonical config is restored with a heal sync in a `finally`.

Mechanism. Token custom properties are unprefixed, and what scopes them is `data-layer`: every upstream's tokens
print under its own `[data-layer]` stamps in the consumer's sheet, and a primitive of another system stamps its own
name. Sync now sends the engine the upstreams whose fragments the app evaluates, the extends closure, as
`extendedSystems`. The engine's own token rule then also declares on those systems' stamps. The own block is the
last cascade layer, so its declarations beat the package's on the package's own elements, in light and dark, at any
specificity. A layered package is never named, so it keeps its values. A package-only public token sits in the app's
vocabulary with the package's own value, so it paints the same; a `_private` token is stripped from the app's
vocabulary at the extends merge, so only the package declares it.

Why it fails before the fix: the own token rule named only `:root`, `body` and the app's own stamp. Acme's elements
carry acme's stamp, and acme's block declares `brand` on it, so both extends probes painted acme's brand. Run against
`public-release` (`f75f22869`), the spec fails with five lines: the own token block does not claim acme's stamps,
and the extends legs read `rgb(190, 24, 93)` light and `rgb(249, 168, 212)` dark for both Badge's and Plain's
background, where the app's `rgb(21, 128, 61)` and `rgb(134, 239, 172)` are expected. The layers legs and the
package-only probes already passed there.

Evidence: the stamp lists,
the extends closure, the sync entry (the request field),
the primitives scope context (the stamp rule). Siblings: CORE-LAYERS-20 (nested
composition), CORE-LAYERS-10 (consumer content inside a layered component), CORE-LAYERS-17 (extendSystem on a
layered package), CORE-CHAIN-15 (an installed package's components, composed), CORE-SYNC-17 (`_private` strip
under extends).

> Search terms: token scope, token override, extends, layers, data-layer, package component, app token wins, brand, package-only token, _private, dark mode, extendedSystems, owner ruling, theming, share, CORE-LAYERS-10, CORE-LAYERS-17, CORE-LAYERS-20, CORE-CHAIN-15, CORE-SYNC-17
