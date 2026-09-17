# NEO-COND-08 — `_before`/`_after` with quoted `content` paint and sort after pseudo-classes

The world calls `css()` with a `_hover` color plus `_before` and
`_after` quoted contents and colors on one paragraph. The spec checks
the sheet carries exactly five utilities with the hover rule ahead of
both pseudo-element rules and no `!important` from the quoted bang,
and the paragraph paints ink at rest and accent under a real hover
while its `::before` and `::after` paint their contents and colors.

Evidence: `[atm]` ATM-COND-10, ATM-LEAF-10, ATM-ORDER-03 (R1 probe
`/tmp/cond-batch3-r1/probe.mjs` emits hover before `::before`/`::after`
and keeps quoted `content` verbatim); `[panda-v1]`
`vendor/panda-v1/packages/core/__tests__/conditions.test.ts:207`
"pseudo-elements sort after pseudo-classes and mixed conditions";
`[lib]` `docs/evidence/lib-sheet-global-css.md` Trace D (`.ref-q`
`_before`/`_after` quote contents).
