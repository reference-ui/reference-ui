# TST-EXT-02 — export * as ns exposes one namespace whose qualified members resolve

`barrel.ts` declares `export * as tree from './leaf'`. That exposes one namespace binding named `tree`
and no flat names, so the barrel does not export `Leaf` itself. A consumer that imports `tree` and writes
`tree.Leaf` must resolve that qualified reference to the `Leaf` symbol id, the same way a qualified
reference through `import * as ns` resolves. `relay.ts` re-exports the namespace by name
(`export { tree } from './barrel'`), and a consumer that reaches `tree.Leaf` through the relay must resolve
the same way. A second consumer that imports `Leaf` straight from the barrel must not resolve to it.

Origin: doom round break TST-DOOM-15. Before the fix, `export * as` was read as a plain `export *`, so the
barrel flattened `Leaf` and the namespace name `tree` was lost.
