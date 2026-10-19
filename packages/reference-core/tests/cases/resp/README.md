# CORE-RESP — container breakpoints and responsive arrays

Proves Reference's responsive dialect paints by container width, not viewport width: named breakpoints, range conditions, numeric `r` keys, and array values with `null` holes all lower to `@container` queries, and the browser proof flips a container element's width and reads computed style. `SPEC.md` carries the responsive contract; `TESTS.md` is the case ledger.

> Search terms: container queries, responsive arrays, null holes, range conditions, breakpoint scale, container root, viewport contract, mobile-first sort

## Cases

- CORE-RESP-01 — responsive arrays map index to base and first breakpoint.
- CORE-RESP-02 — null holes in responsive arrays skip the breakpoint.
- CORE-RESP-03 — the `base` key is the unprefixed class.
- CORE-RESP-04 — nested sm: { md: … } paints only when both queries hold.
- CORE-RESP-05 — mdDown, mdOnly, smToLg bind the query and never overlap at the boundary.
- CORE-RESP-06 — container queries sort mobile-first: min-width ascending, then max-width descending.
- CORE-RESP-07 — container utilities paint only under a container root.
- CORE-RESP-08 — numeric r keys lower to a concrete @container query.
- CORE-RESP-09 — runtime and build time lower named responsive sugar to the same class.
- CORE-RESP-10 — the viewport contract: width, height, and mixed branches gate per query.

Parent: [tests/cases/](../README.md).
