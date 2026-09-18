# NEO-COND-09 — `'&:focus, &:hover'` splits into two selectors on one class

The world calls `css()` with a base ink color plus a comma key
carrying one color on a button. The spec checks the sheet carries a
base utility plus one comma utility whose class string appears in two
selectors split by a comma, and the button
paints ink at rest, brand under a real hover, ink again after the
pointer leaves, brand while focused, and ink again after blur — so
each arm of the comma paints alone.

Evidence: `[atm]` ATM-COND-14 (R1 probe `/tmp/cond-batch3-r1/probe.mjs`
emits `.X:focus, .X:hover` on one class); `[panda-v1]`
`vendor/panda-v1/packages/core/__tests__/atomic-rule.test.ts:416`
"outlier: should work with basic" (`'&:focus, &:hover'` key).

> Search terms: multiple selectors, selector list, grouped selectors, either arm, focus-hover combo, selectors/comma, conditions/focus, conditions/hover, NEO-COND-02
