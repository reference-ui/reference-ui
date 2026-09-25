# TST-QRY-01 type queries

Verifies typeof query expressions preserved across aliases and member wrappers.
Ensures expressions like typeof themeConfig and typeof tokens.spacing are accurately surfaced.
Proves primary SPEC ID anchor TST-QRY-01.

Doom-night fortify pin C (tasty resolve cluster): cross-file `typeof`
over named value imports (`consumer.ts` imports `tokens` from
`values.ts`, plus the aliased `export { themeTokens as tokens }`
target) resolves to the same object payload the local twin carries,
for aliases and interface members alike. Cycles fail closed:
`cycle-a ↔ cycle-b` const aliases infer no value binding, so
`CycleType` carries no `resolved` and the suite terminates.

Known gaps (out of scope by design, not silently half-handled):
- default-imported values (`import tokens from …`): the import arm
  takes named bindings only.
- namespace-member values (`typeof Ns.tokens`): no namespace arm.
- values arriving via re-export chains (`export { v } from` mid
  barrels): the arm reads the direct target's value bindings only
  and never follows `reexport_target`.
- const aliases (`export const v = w`): inference records no
  binding for identifier inits, locally or across files, so both
  twins fail closed to no `resolved`.

Design note: the borrowed target `TypeRef` is re-resolved in the
consumer's context by the existing `TypeQuery` mapping arm; the
in-scope literal shapes carry no nested references, so that pass is
a no-op for them.
