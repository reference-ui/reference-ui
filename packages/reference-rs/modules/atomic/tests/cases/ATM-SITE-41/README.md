# ATM-SITE-41 — Barrel Re-Export Proof (Binding Walk)

Proves : same-name chains through one, two, and three barrel
hops resolve to the origin const, and the aliased re-export
(`export { gap as space }`) resolves too — every hop followed by
binding (imported name + specifier) to the declared export, cycle
guarded, with zero diagnostics.

The aliased re-export resolves by binding too: `css({ margin: space })`
mints the `4px` margin atom.

Inputs: `tokens.ts` (origin consts), `barrel.ts` (one hop), `index.ts`
(two hops plus the aliased re-export), `third.ts` (three hops), and
`App.tsx`, `Page.tsx`, `Deep.tsx`, `Alias.tsx` importing from each.
