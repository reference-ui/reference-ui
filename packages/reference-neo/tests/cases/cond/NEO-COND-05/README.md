# NEO-COND-05 — `'input:hover &'` composes the hovered-input ancestor on one class

The world calls `css()` with a base ink color plus an `'input:hover &'`
parent key on the sibling after an input. The spec checks the sheet mints
exactly two utilities with the conditioned selector `input:hover .<class>`
carrying brand, and both negative halves rest on ink with the input provably
unhovered — the P11 lateral from NEO-PARITY-01: SpecPage offers no hover, so
the positive arm is sheet-proven. (The composition is descendant-shaped and
inputs are void, so no live hover could paint a descendant anyway; the claim
is the engine composition, pinned by the sheet.)

Evidence: `[panda-v1]` `core/__tests__/atomic-rule.test.ts:231` "[parent
selector]"; `[atm]` ATM-COND-20 (RS-12 landed).

> Search terms: nesting, ancestor hover, form control, gating, outside-in hover, conditions/hover, parent-keys, NEO-COND-10
