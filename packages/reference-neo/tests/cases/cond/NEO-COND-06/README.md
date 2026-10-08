# NEO-COND-06 — `'& > p'` paints the child paragraph and not the grandchild

The world calls `css()` with a child-combinator key on a parent holding a
direct `p` child and a `p` grandchild nested one `div` deeper. The spec
checks the sheet carries exactly one utility keeping the `> p`
combinator, the child paints brand, and the grandchild and the middle
`div` keep the ink baseline.

Evidence: `[atm]` ATM-COND-14 (R1 probe
`/tmp/cond-batch2-r1/probe.mjs` emits the `> p` rule); `[panda-v1]`
`vendor/panda-v1/packages/core/__tests__/atomic-rule.test.ts:189`
"[pseudo] should work with nested selector"; `[lib]`
`packages/reference-lib/.reference-ui/styled/styles.css` (15 `>`
child/descendant selectors, e.g. `.ref-button > svg`).

> Search terms: > selector, direct child, child selector, one level, child only, combinators/child, selector >, NEO-COND-10
