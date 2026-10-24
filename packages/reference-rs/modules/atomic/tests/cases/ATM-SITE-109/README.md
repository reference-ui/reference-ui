# ATM-SITE-109 — A const copied from an imported const folds to the origin's value in a consumer's css() call

`f0.ts` declares `export const v0 = 'red'`. `f1.ts` imports it and re-declares
the value under a new name, `export const v1 = v0`. The consumer imports `v1`
from `f1.ts` and writes `css({ color: v1 })`.

The value graph follows a chain of copies across files: `v1` in the consumer
resolves to the declared export in `f1.ts`, whose initializer is the import
`v0`, which resolves to the declared export in `f0.ts`. The call site folds to
`color: red` and plans its class, with no diagnostic. A chain that stopped at
`v1` and dropped the call silently would leave the element unstyled with
nothing to say why. Sibling: ATM-SITE-05 (import spreads).

> Search terms: import chain, const copy, re-declared export, cross-file value, imported const, fold, silent miss
