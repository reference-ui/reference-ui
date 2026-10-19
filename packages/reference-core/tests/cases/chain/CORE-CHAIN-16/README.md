# CORE-CHAIN-16 — an installed package whose system the app does not compose, with nothing or another system composed, warns ATM-W-EXTERNAL-UNBACKED once per styled tag site naming the package, its system and its baseSystem fix, and backs nothing; a non-Reference package stays silent

A package built on Reference UI renders through its own bundled runtime, which mints classes under the package's own
system. The app backs those classes only by composing that system (`extends` or `layers`): a style prop on one of the
package's tags is backed under the systems the package renders through, and nothing else. When the app has not
composed it, the props have nothing to back them: they compile to nothing, the package's classes stay unbacked, and
nothing paints. That state must not be silent, sync must not refuse over it, and it must not be papered over by
spraying the rule under whatever else the app does compose, a class the package's runtime never mints.

The world is CORE-CHAIN-15's app with the package not composed. Three directories stand beside the app:

- `upstream/` is `@fixture/chain16`, a real package built on Reference UI (system `core-chain16-up`): a `package.json`
  exporting `.` (its built `dist/`) and `./baseSystem`, a `src/Tile.tsx` that forwards to `Div`, and a `src/index.ts`
  re-exporting `Button` from its own runtime beside `Tile`.
- `other/` is `core-chain16-other`, a real system with one token of its own: the stand-in for a design system the app
  does compose (an app that extends lib but not this package).
- `plain/` is `plain-glyphs`, a React package not built on Reference UI: a `Glyph` that colours a span inline, no
  system, no Reference runtime. The shape of an icon set installed from the registry.

The app uses the package in the three import shapes:

1. Direct: `<Button color="chain16Ink">` and `<Tile color="chain16Ink">` in `src/direct.tsx`, imported unaliased from
   the package, beside an unstyled `<Tile>`.
2. Barrel: `src/ui/index.ts` re-exports the package's `Button`; `src/barrel.tsx` styles it through `./ui/index.js`.
3. `css` wrapper: `src/wrapper.tsx` wraps the package's `Button` as `const Wrap = ({ css }) => <Button css={css} />` and
   calls `<Wrap css={{ color: 'chain16Ink' }}>`.

`src/glyph.tsx` renders `<Glyph color="chain16Glyph" />` from `plain-glyphs`, and a local `<Div color="chain16Ink">` in
`src/app.tsx` is the app's own primitive.

The spec syncs `upstream/` and `other/` through the real `sync()`, builds both packages' `src/` to their `dist/`, links
`@fixture/chain16` into `world/node_modules` the way a workspace install leaves it, and copies `plain-glyphs` into
`world/node_modules` the way a registry install does (inside node_modules, so it never borrows the app's runtime). It
then runs two legs, re-syncing through the real `sync()` and through the spawned `ref sync --json` in each, and checks
both channels the same way:

- **nothing composed**: the canonical `ui.config.ts`, `extends: []`.
- **another system composed**: `extends: [otherBase]`, `core-chain16-other` only.

In both legs sync succeeds (no throw, exit 0). The `ATM-W-EXTERNAL-UNBACKED` rows are exactly one per styled package tag
site, at that site's file and line (found by marker text, so the expected line follows the source): direct `Button`,
direct `Tile`, barrel `Button` at its use site, and the `Wrap` call site that writes the `css`. The unstyled `Tile`, the
forwarding `<Button css={css}>` inside the wrapper, the own `Div` and the plain `Glyph` raise none, and no row of any
code lands in `src/glyph.tsx`. Every row is a warning whose message names `'@fixture/chain16'` and the system it renders
through, `'core-chain16-up'`, and whose help gives the fix as adding `'@fixture/chain16/baseSystem'` to `extends` or
`layers`, never a `jsxElements` entry. In the served sheet, `c_chain16Ink` is backed under `core-chain16` alone (the own
control), never under `core-chain16-other`, and `c_chain16Glyph` is backed under nothing.

Run against `public-release` (`f75f22869`) both channels report no `ATM-W-EXTERNAL-UNBACKED` row in either leg, and
with `core-chain16-other` composed the sheet backs the package's `c_chain16Ink` and the plain glyph's `c_chain16Glyph`
under `core-chain16-other`: nothing paints, nothing says why, and the app ships rules no runtime mints.

Evidence: the JSX walk's `unbacked_tests.rs` and `ATM-SITE-100` (the same warning inside one compile, including the
composed-another-system leg), `ATM-SITE-103` (a non-Reference package's tag lowers nothing), and the code's row in
Core's diagnostics repro table (`src/diagnostics/tests/repro-rows-default.ts`). The package's verdict comes from
`package_system.rs` in the atomic extract: the published `baseSystem.mjs` names the system; a directory inside
node_modules with none is foreign. Siblings: CORE-CHAIN-15 (the same shapes composed: they paint), CORE-CHAIN-17 (a
workspace package, own or composed), CORE-WATCH-23 (a warning carried by `--json`).

> Search terms: ATM-W-EXTERNAL-UNBACKED, unbacked external, component ownership, provenance, package import, installed package, node_modules, published system, baseSystem fix, nothing composed, partly composed, extends another system, no spray, foreign group, non-Reference package, plain package, icon set, silent, warning not error, sync never refuses, ref sync --json, located diagnostic, file and line, barrel re-export, css wrapper, CORE-CHAIN-15, CORE-CHAIN-17, CORE-WATCH-23, ATM-SITE-100, ATM-SITE-103
