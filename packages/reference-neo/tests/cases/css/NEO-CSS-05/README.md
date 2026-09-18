# NEO-CSS-05 — `null`, `false`, `undefined` leaves emit nothing and no ghost class

The world calls `css()` with one live color plus a hole on each of three
sibling props, and once more with holes only. The spec checks the sheet
carries exactly the live utility, the mixed call resolves to that one class
and paints, and the holes-only call resolves to the empty string with the
element resting on its inherited color.

Evidence: `[atm]` ATM-LEAF-03, ATM-GHOST-02; `[panda-v1]`
`vendor/panda-v1/packages/core/__tests__/rule-processor.test.ts:1205`
"ignores declarations with null"; `[decision D11]` (holes vanish, never a
ghost class).
