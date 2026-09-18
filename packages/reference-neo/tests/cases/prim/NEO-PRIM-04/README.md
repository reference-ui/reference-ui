# NEO-PRIM-04 — array StyleProp `p` is responsive across the breakpoint scale; `null` holes skip

The world renders Div probes with array `p` values inside sized container
wrappers: a `['1r', '2r']` probe in narrow, wide, and live-resized
containers, and a `['1r', null, '4r']` probe in sm-range and md-range
containers. A `globalCss` `:root` rule provides the rhythm root. The spec
checks computed padding per container width, exactly three utilities (no
rule for the hole), and the sm/md container at-rules in the sheet.

Evidence: `[atm]` ATM-LEAF-05, P1 #10; `[panda-v1]`
`vendor/panda-v1/packages/parser/__tests__/output.test.ts:2441` ("array
syntax" cases).

> Search terms: container queries, @container, tuple, sparse, container ladder, prim/container-queries, prim/responsive-array
