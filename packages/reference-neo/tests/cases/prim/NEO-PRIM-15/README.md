# NEO-PRIM-15 — corner-pair radius shorthands resolve to both addressed corners

The world renders six probes, one per pair shorthand
(`borderTopRadius`, `borderBottomRadius`, `borderLeftRadius`,
`borderRightRadius`, `borderStartRadius`, `borderEndRadius`), each at
`2r`. The spec checks every addressed corner paints 8px: the four
physical pairs on their two corners each, and the logical pairs on
their LTR corners (start → left pair, end → right pair).

Matrix source: `matrix/spacing/tests/e2e/system-contract.spec.ts`
"physical border radius pair shorthands resolve to both addressed
corners" + "logical border radius pair shorthands resolve to the
expected corners in LTR" + `matrix/spacing/src/index.tsx`
(`spacing-radius-*-pair`).

> Search terms: corner pair, borderTopRadius, borderStartRadius, logical radius, LTR, spacing-radius, NEO-PRIM-15
