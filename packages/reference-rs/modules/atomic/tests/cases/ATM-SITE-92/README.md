# ATM-SITE-92 — An exports condition map leads with its source import, so a types condition never shadows it for the root or a subpath

Pins the `exports` half of the root-entry fix in ATM-SITE-91. A package's
`exports` condition maps expanded `types` before `import`, so a body-less
declaration named under `types` beside a source `import` won the walk. That
held for the root and for every subpath, because both expand the same map.

`cond-pkg` sits in `node_modules` the way a linked workspace package does. Its
`exports` nests `types` beside `import` at the root (`./dist/index.d.ts`,
`./src/index.ts`) and at `./tokens` (`./dist/tokens.d.ts`, `./src/tokens.ts`).
Both declarations are body-less; both sources fold (`'purple'`, `'blue'`).
`App` paints an imported value from each entry plus a literal control, so
the sheet must carry `purple`, `blue` and `red`, one class each, with zero
diagnostics. Under the old order the two imported calls vanish silently.

> Search terms: exports, conditions, types, import, source, subpath, RootEntryPolicy, SourceFirst, condition map
