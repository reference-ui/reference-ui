# ATM-SITE-110 — A const copied from an import in the same file folds to the origin's value, through a chain of copies

`tokens.ts` declares `export const v0 = 'red'`. `App.tsx` imports it and copies
it twice in the same file, `const v1 = v0` and `const v2 = v1`, then writes
`css({ color: v2 })`.

A copy of an import takes the import's value, the way a copy of a same-file
const takes that const's value: the call site folds to `color: red`, plans its
class, and reports nothing. Each copy answers through the alias chain to the
import it ends at, so a copy of a copy folds too. A copy that dropped its value
would leave the element unstyled with no diagnostic to say why. Sibling:
ATM-SITE-109 (the copy sits in the exporting file and the consumer imports it).

> Search terms: import copy, const alias, same-file alias, alias chain, imported const, fold, silent miss
