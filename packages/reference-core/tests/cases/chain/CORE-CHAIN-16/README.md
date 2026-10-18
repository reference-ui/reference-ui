# CORE-CHAIN-16 — a package's styled tags with nothing in extends or layers sync with one located ATM-W-EXTERNAL-UNBACKED warning each, naming the package

A package built on Reference UI renders through its own bundled runtime, which mints classes under the package's system
name. The app backs those classes only by composing the package's base system (`extends` or `layers`), whose name the
compile then fans external style props out under. With nothing composed, the props have nothing to back them: they
compile, the package's classes stay unbacked, and nothing paints. That state must not be silent, and sync must not
refuse over it.

The world is CORE-CHAIN-15's app with nothing composed: `ui.config.ts` has no `extends` or `layers`, and
`@fixture/chain16` stands for an installed package the app never scans. The same import shapes appear:

1. Direct: `<Button color="chain16Ink">` and `<Tile color="chain16Ink">` in `src/direct.tsx`, imported unaliased from
   the package, beside an unstyled `<Tile>`.
2. Barrel: `src/ui/index.ts` re-exports the package's `Button`; `src/barrel.tsx` styles it through `./ui/index.js`.
3. `css` wrapper: `src/wrapper.tsx` wraps the package's `Button` as `const Wrap = ({ css }) => <Button css={css} />` and
   calls `<Wrap css={{ color: 'chain16Ink' }}>`.

A local `<Div color="chain16Ink">` in `src/app.tsx` is the app's own primitive.

The spec re-syncs through the real `sync()` and through the spawned `ref sync --json`, and checks both channels the same
way. Sync succeeds (no throw, exit 0). The `ATM-W-EXTERNAL-UNBACKED` rows are exactly one per styled package tag site, at
that site's file and line (found by marker text, so the expected line follows the source): direct `Button`, direct `Tile`,
barrel `Button` at its use site, and the `Wrap` call site that writes the `css`. The unstyled `Tile`, the forwarding
`<Button css={css}>` inside the wrapper and the own `Div` raise none. Every row is a warning whose message and help name
`'@fixture/chain16'`, and whose help gives the fix as adding its baseSystem to `extends` or `layers`, never a
`jsxElements` entry.

Run against `public-release` (`f75f22869`) both channels report no `ATM-W-EXTERNAL-UNBACKED` row at all: nothing
paints and nothing says why.

Evidence: the JSX walk's `unbacked_tests.rs` and `ATM-SITE-100` (the same warning inside one compile), and the code's
row in Core's diagnostics repro table (`src/diagnostics/tests/repro-rows-default.ts`);
`settle_unbacked` in the atomic assembly drops the line once any upstream qualifier exists, which CORE-CHAIN-15 relies
on. Siblings: CORE-CHAIN-15 (the same shapes composed: they paint), CORE-WATCH-23 (a warning carried by `--json`).

> Search terms: ATM-W-EXTERNAL-UNBACKED, unbacked external, component ownership, provenance, package import, nothing composed, extends, layers, warning not error, sync never refuses, ref sync --json, located diagnostic, file and line, barrel re-export, css wrapper, CORE-CHAIN-15, CORE-WATCH-23, ATM-SITE-100
