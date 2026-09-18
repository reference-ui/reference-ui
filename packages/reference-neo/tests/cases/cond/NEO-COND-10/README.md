# NEO-COND-10 — `':focus > &'` paints the child while the parent holds focus

The world calls `css()` with a base ink color plus a `':focus > &'` parent
key on the child of a focusable parent. The spec checks the sheet mints
exactly two utilities with the conditioned selector `:focus > .<class>`
carrying brand, then checks computed paint: the child rests on ink, paints
brand while the parent holds focus, and returns to ink when focus moves to
an unrelated control or blurs away — so the arm gates on the parent's focus
exactly.

Evidence: `[panda-v1]` `core/__tests__/atomic-rule.test.ts` "outlier";
`[atm]` ATM-COND-20 (RS-12 landed).
