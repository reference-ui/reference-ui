# CORE-CHAIN-17 — a workspace package one root sync spans paints as the app's own; synced as its own system and composed, it paints under that system, a token both define taking the app's value under extends and the package's under layers

A monorepo has two honest shapes, both with no configuration. In the first, one sync at the root spans the app and its
workspace packages: a component a package exports renders the root's runtime, so its style props are the app's own.
In the second, the package runs its own sync and publishes its own system, and the app composes it like any installed
package: the component renders the package's runtime, so its style props back under the package's system. Either way
the app imports the component by its package name, through the workspace link, and the sync must follow that import to
where it lands, not stop at its spelling (which once sent the first shape external and warned that `@acme/ui` had a
system of its own).

The world is the monorepo root:

- `ui.config.ts` (system `core-chain17`) includes `theme/**`, `apps/web/src/**` and `packages/ui/src/**`.
- `theme/tokens.ts` defines the app-only `chain17Ink` (`#1d4ed8`) and `shared` (`#15803d`).
- `packages/ui/` is `@acme/ui`, a workspace source package: `package.json` exports `.` as `./src/index.ts` and
  `./baseSystem`; `src/Card.tsx` forwards a Div's props to `Div`; `ui.config.ts` (system `chain17-ui`) and
  `theme/tokens.ts`, which defines `shared` too (`#be185d`), are used only when the package runs its own sync.
- `apps/web/src/app.tsx` imports `{ Card } from '@acme/ui'` and renders a local `<Div color="chain17Ink">` control,
  `<Card bg="chain17Ink">`, a same-file wrapper `const Panel = ({ css }) => <Card css={css} />` called as
  `<Panel css={{ bg: 'chain17Ink' }}>`, and `<Card bg="shared">`.

The spec builds both workspaces' `src/` to their `dist/` with the harness's world build and links `packages/ui` into
`world/node_modules/@acme/ui`, the way a workspace install leaves it. It then runs three legs over the same tree,
re-syncing the root each time and loading the page:

| leg | packages/ui | root config | page |
| --- | --- | --- | --- |
| one system | no sync of its own | canonical | `index.html`: the package renders the root runtime |
| extends | synced as `chain17-ui` | `extends: [uiBase]` from `'@acme/ui/baseSystem'` | `two-systems.html`: an importmap scope resolves the package's `@reference-ui/react` to its own runtime |
| layers | synced as `chain17-ui` | `layers: [uiBase]` | `two-systems.html` |

Expected, per leg:

| reading | one system | extends | layers |
| --- | --- | --- | --- |
| `ATM-W-EXTERNAL-UNBACKED` rows | none | none | none |
| prefixes backing `bg_chain17Ink` in the sheet | `core-chain17` only | `chain17-ui` only | `chain17-ui` only |
| Card and Panel: class, `data-layer` | `core-chain17__bg_chain17Ink`, `core-chain17` | `chain17-ui__bg_chain17Ink`, `chain17-ui` | same as extends |
| Card and Panel: background | the app's ink | the app's ink | the app's ink |
| `<Card bg="shared">`: background | the app's `shared` | the app's `shared` | the package's `shared` |

The local control paints the ink in every leg, and the runtime logs no `no compiled class` miss. The link and the
package's own sync output go and the canonical config is restored with a heal sync in a `finally`, so the committed tree
is the one-system shape.

The shared token answers owner question 1 of `.claude/plans/styling-across-packages.md` as ruled in its §11: under
`extends` the app's value wins inside the package's components, here on a style the app writes on the package's Card;
under `layers` the package keeps its own. CORE-LAYERS-19 pins the same ruling on a package's own styles, CORE-LAYERS-20
through a chain.

Run against `public-release` (`f75f22869`) the one-system leg passes: that compile gated tags by name, and the traced
Card was own. Both composed legs fail: the root sync backs `bg_chain17Ink` under `core-chain17` while the package's
runtime mints `chain17-ui__bg_chain17Ink`, so Card, Panel and the shared probe paint transparent and the runtime logs
`no compiled class` four times.

Mechanism: the atomic extract resolves a bare specifier the way Node does, through each ancestor `node_modules` and the
link, canonicalised. A hit in this compile's sources continues the identity walk (the traced Card is own) unless its
package directory published a system, which then renders it (`identity/alias.rs`, `package_system.rs`). Evidence:
`ATM-SITE-101` (the workspace package, own and with its own system), `ATM-SITE-102` (a package borrowing this project's
runtime). Siblings: CORE-CHAIN-15 (an installed package, composed), CORE-CHAIN-16 (not composed: the warning),
CORE-LAYERS-19 and CORE-LAYERS-20 (token scope).

> Search terms: monorepo, workspace package, pnpm workspace, node_modules link, symlink, one system, two systems, root sync, include spans packages, own host, traced wrapper, published system, baseSystem subpath, bare specifier, extends, layers, token scope, data-layer, shared token, app token wins, owner ruling, importmap scope, css wrapper, gap 1, ATM-W-EXTERNAL-UNBACKED, CORE-CHAIN-15, CORE-CHAIN-16, CORE-LAYERS-19, CORE-LAYERS-20, ATM-SITE-101, ATM-SITE-102
