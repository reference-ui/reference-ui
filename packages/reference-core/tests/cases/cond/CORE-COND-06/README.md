# CORE-COND-06 — `'& > p'` paints the child paragraph and not the grandchild

The world calls `css()` with a child-combinator key on a parent holding a
direct `p` child and a `p` grandchild nested one `div` deeper. The spec
checks the sheet carries exactly one utility keeping the `> p`
combinator, the child paints brand, and the grandchild and the middle
`div` keep the ink baseline.

Evidence: ATM-COND-14 (probes emits the `> p` rule); Panda v1 test "[pseudo]
should work with nested selector"; reference-lib
the built lib styles (15 `>`
child/descendant selectors, e.g. `.ref-button > svg`).

> Search terms: > selector, direct child, child selector, one level, child only, combinators/child, selector >, CORE-COND-10
