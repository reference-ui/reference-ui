# CORE-CHAIN-14 — an upstream that publishes a component as owning size keeps size off the downstream's call sites: no rule, no warning

The upstream package publishes `Tile`, a `forwardRef` whose props type sits only in the generic. Its inner function pulls
`size` out by name and spreads the rest into a `Div`, so `size` is Tile's own prop and not the style prop that folds to
width and height. Inside the upstream that is enough. A downstream app sees only the base system the upstream published,
so the ownership has to travel with it: `jsxOwned: { Tile: ['size'] }` beside `jsxElements` in `baseSystem.mjs`.

The world carries a real upstream (`upstream/`) and an app that calls `<Tile size="lg" />` without ever seeing Tile's
source: the declaration in `src/app.tsx` gives it the name and nothing else. A `<Div size="2r" />` control sits beside it.
The spec syncs the upstream through the real `sync()`, reads the published base system, extends that artifact on disk, and
re-syncs the app. It checks the three claims together and reports every one that broke:

1. The upstream's published `baseSystem.mjs` carries `jsxOwned` with `Tile: ['size']`, and lists `Tile` as a host.
2. The app's published sheet has no `width: lg`, `height: lg` or `size: lg` rule, while the control still folds
   `size="2r"` into a width, so the scan did reach the app.
3. The app's sync reports no `ATM-W-UNKNOWN-TOKEN` diagnostic, the warning that an owned `lg` would otherwise raise when
   it is read as a size token.

The canonical config is restored with a heal sync in a `finally`.

Evidence: `ATM-SITE-93` and `ATM-SITE-94` (the same owned-props shadow inside one compile) and `ATM-SITE-95` (the
engine reading the spec's `jsxOwned` for a compiled package that ships no source). The roster in
`src/system/base/jsx.ts` joins `jsxOwned` from `extends` and `layers` and the traced owned props of the local compile,
and `sync()` sends the upstream set with the spec. Siblings: CORE-CHAIN-06 (extends a genuinely synced upstream),
CORE-SYNC-15 (host discovery).

> Search terms: owned props, jsxOwned, tracedJsxOwned, forwardRef, destructured prop, size, published base system, extends, host roster, ATM-W-UNKNOWN-TOKEN, CORE-CHAIN-06, CORE-SYNC-15, ATM-SITE-93, ATM-SITE-95
