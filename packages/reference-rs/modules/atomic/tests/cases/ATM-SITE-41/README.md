# ATM-SITE-41 — Barrel Re-Export Proof (Binding Walk)

Proves : same-name chains through one, two, and three barrel
hops resolve to the origin const, and the aliased re-export
(`export { gap as space }`) resolves too — every hop followed by
binding (imported name + specifier) to the declared export, cycle
guarded, with zero diagnostics.

Before-picture (before the binding walk, probe): `export … from` added nothing
to the project-wide merge — the barrels were inert, and values
resolved iff the origin file was in the include set. The same-name
chains were green by accident of the merge; the aliased re-export
warned `ATM-W-DYNAMIC-IDENTIFIER` (`Dynamic non-literal identifier
'space'`, `packages/reference-rs/modules/atomic/tests/cases/ATM-SITE-41/input/src/Alias.tsx:7`) and dropped, because `space` is declared
nowhere. The build keeps the chains' observable and turns the
alias green: `css({ margin: space })` now mints the `4px` margin atom.

Inputs: `tokens.ts` (origin consts), `barrel.ts` (one hop), `index.ts`
(two hops plus the aliased re-export), `third.ts` (three hops), and
`App.tsx`, `Page.tsx`, `Deep.tsx`, `Alias.tsx` importing from each.
