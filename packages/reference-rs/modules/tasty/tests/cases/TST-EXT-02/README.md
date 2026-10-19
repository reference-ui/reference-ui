# TST-EXT-02 — export * as ns exposes one namespace whose qualified members resolve

`barrel` declares `export * as tree from './leaf'`. That exposes one namespace binding named `tree`
and no flat names, so the barrel does not export `Leaf` itself. A consumer that imports `tree` and writes
`tree.Leaf` must resolve that qualified reference to the `Leaf` symbol id, the same way a qualified
reference through `import * as ns` resolves. `relay` re-exports the namespace by name
(`export { tree } from './barrel'`), and a consumer that reaches `tree.Leaf` through the relay must resolve
the same way. A second consumer that imports `Leaf` straight from the barrel must not resolve to it.

Guards against `export * as` being read as a plain `export *`, which would flatten `Leaf` into the barrel and lose the namespace name `tree`.
