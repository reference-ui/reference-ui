# NEO-TOKEN-12 — multiple refs in one value all resolve

The world paints one probe with `padding: '{spacing.1r} {spacing.2r}'` over
two named spacing tokens. The spec checks the engine splits the two-value
shorthand per side with each ref resolved to its `var()`, the sheet leaves
no unresolved brace behind, and the probe computes the 4px/8px pair like
its inline reference.

Evidence: `[panda-v1]` `core/__tests__/serialize.test.ts` "expand multiple
references" (`padding: '{spacing.3} {spacing.5}'`); `[atm]` ATM-TOKEN-08.
