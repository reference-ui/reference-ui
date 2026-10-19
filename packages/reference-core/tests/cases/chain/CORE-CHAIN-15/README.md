# CORE-CHAIN-15 — an installed package's Button and published Tile paint a consumer token whether imported directly, through a barrel, or under a css wrapper

A package built on Reference UI ships its components bundled with its own generated runtime, so every style prop they
forward mints a class under the package's system name. This case gives such a package the two names that fool
a name-gated compile: `Button`, which spells one of the app's own primitives, and `Tile`, a forwarding wrapper the package
publishes in `jsxElements`. The app styles them with `chain15Ink`, a token defined only downstream, in the three ways
apps import components:

1. Direct: `import { Button, Tile } from '@fixture/chain15'` in the direct fixture, unaliased.
2. Barrel: the UI barrel re-exports the package's `Button`, and the barrel fixture imports it from `./ui/index.js`.
3. `css` wrapper: the wrapper fixture declares `const Wrap = ({ css }) => <Button css={css} />` around the package's
   `Button` and calls `<Wrap css={{ color: 'chain15Ink' }}>`.

The package is real and installed. `upstream/` is `@fixture/chain15` (system `core-chain15-up`): a manifest whose
`exports` map `.` to the built index and `./baseSystem` to the published base system, a Tile component
that forwards to `Div` (so its sync traces Tile and publishes it), and an index re-export that re-exports `Button` from the
package's own `@reference-ui/react` beside `Tile`. The app never scans it.

The spec syncs the upstream through the real `sync()` and checks the published base system names `core-chain15-up`,
lists `Tile` in `jsxElements` and does not carry the probe value. It builds the package's sources to its `dist/` with the
harness's world build, links the package into the world install the way a workspace install leaves
it, extends the published artifact and re-syncs the app. The app's sync follows each import to that directory and reads
the system it published there. The page loads the package through the same install, and an importmap scope resolves
the package's own `@reference-ui/react` to its bound runtime, so every class its components mint is
`core-chain15-up__*`. In the browser a local `<Div color="chain15Ink">` control must paint, every package probe (direct
`Button`, `Tile`, barrel `Button`, wrapped `Button`) must compute `rgb(11, 110, 79)`, and the runtime must log no
`no compiled class` miss. The link goes and the canonical config is restored with a heal sync in a `finally`.

Ownership comes from provenance alone: nothing in the world configures `jsxElements`, and the app's sync learns which
system renders each tag from the directory its import lands in. Before provenance the app's compile gated JSX tags by
name, so each of the four tags was taken for the app's own host and its value compiled under the app's name, while the
package runtime minted `core-chain15-up__c_chain15Ink` and nothing backed it. Run against `public-release`
(`f75f22869`) all four probes compute `rgb(0, 0, 0)` with that class and the runtime logs `no compiled class` for it;
the local control still paints. The install is load-bearing too: reachable only through a browser importmap, the
package's import would resolve nowhere on disk, the sync would take it for a package not built on
Reference UI and lower nothing, and the four probes would fail the same way.

Evidence: `ATM-SITE-96` (direct package import), `ATM-SITE-97` (barrel), `ATM-SITE-98` (`css` wrapper) and
`ATM-SITE-99` (upstream-published name) pin the same verdicts inside one compile; the request's `upstreamHosts` keeps the
published `Tile` apart from the app's own hosts. Siblings: CORE-CHAIN-08 (a prebuilt package component, backed under
its published system), CORE-CHAIN-14 (real upstream sync), CORE-CHAIN-16 (the same shapes with the package not
composed: the unbacked warning), CORE-CHAIN-17 (a workspace package, own or composed).

> Search terms: component ownership, provenance, package import, installed package, node_modules link, workspace install, importmap scope, published system, primitive name, Button, published jsxElements, upstreamHosts, barrel re-export, css wrapper, package backing, external style props, prebuilt dist, bound react entry, foreign qualifier, no compiled class, CORE-CHAIN-08, CORE-CHAIN-14, CORE-CHAIN-16, ATM-SITE-96, ATM-SITE-97, ATM-SITE-98, ATM-SITE-99, CORE-CHAIN-17
