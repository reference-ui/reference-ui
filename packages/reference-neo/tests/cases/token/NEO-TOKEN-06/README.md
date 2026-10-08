# NEO-TOKEN-06 — semantic alias chains stay var() references, not inlined hex

The world declares a two-link alias chain (`critical` → `danger` →
`red.500`) and paints one probe through the chain head plus a second probe
with the leaf token directly. The spec checks the token layer prints each
link as a `var()` alias rather than an inlined hex, and that both probes
compute the same red.

Evidence: `[panda-v1]`
`generator/__tests__/generate-token.test.ts` "should reuse css variable in
semantic token alias"; `token-dictionary/__tests__/alias.test.ts`; `[atm]`
ATM-TOKEN-11.

> Search terms: indirection, pointer, forwarding, no-inline, token/alias
