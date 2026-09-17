# NEO-COND-03 — `_hover`/`_disabled` chains two `:is()` lists and the aria twin paints

The world calls `css()` with a base color plus a `_hover`-over-`_disabled`
arm on five probes sharing one class. The spec checks the sheet carries
exactly two utilities with the hover list chained into the disabled list
(including `[aria-disabled=true]`), the data twins and the aria twin paint
only with both arms, and a real disabled button needs a real hover too.

Evidence: `[atm]` ATM-COND-02, ATM-COND-10 (R1 probe
`/tmp/cond-batch2-r1/probe.mjs` emits the chained selector);
`[panda-v1]`
`vendor/panda-v1/packages/core/__tests__/atomic-rule.test.ts:351`
"nested > nested > property"; `[lib]`
`packages/reference-lib/.reference-ui/styled/styles.css:454` (the
disabled twin list on `.ref-button`).
