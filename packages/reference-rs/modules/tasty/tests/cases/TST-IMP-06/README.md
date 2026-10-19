# TST-IMP-06 — A relative .js, .mjs or .cjs specifier resolves to its TypeScript source sibling with no unresolved-import warning

Verifies the NodeNext convention for source files: `./button.js` resolves to the `button` `.tsx` source,
`./icon.js` to the `icon` `.ts` source, `./chunk.mjs` to the `chunk` `.mts` source, and `./legacy.cjs`
to the `legacy` `.cts` source. A compiled specifier names its source, as TypeScript resolves it.
Verifies that no `TST-W-UNRESOLVED-IMPORT` warning is emitted and that each imported name is a user-owned symbol
rather than an external reference.
Proves primary SPEC ID anchor TST-IMP-06.
