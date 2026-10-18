# NEO-PRIM-13 — category-prefixed `colors.*` style props paint the token and leak no raw path

The world renders two probes: one with category-prefixed values
(`color="colors.red.600"`, `backgroundColor="colors.yellow.100"`,
`borderColor="colors.blue.600"`) and a bare-spelling control
(`red.600`, `yellow.100`, `blue.600`). The spec checks both probes
paint the identical token colours, the sheet declares the three rules
through `var(--colors-*)`, and no raw `colors.*` path leaks into a
declaration value. The prefixed spelling is the matrix's
`primitive-category-tokens` fixture; Neo resolves it to the same var
as the bare spelling.

Matrix source: `matrix/primitives/tests/e2e/primitives-contract.spec.ts`
"primitive resolves category-prefixed color tokens in the browser" +
`matrix/primitives/src/index.tsx` (`primitive-category-tokens`).

> Search terms: category prefix, colors dot, token path spelling, raw leak, primitive-category-tokens, prim/prefixed-colors, NEO-PRIM-13
