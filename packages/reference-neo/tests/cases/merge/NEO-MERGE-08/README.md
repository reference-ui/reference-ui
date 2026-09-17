# NEO-MERGE-08 — `flexDir` plus `flexDirection: undefined` keeps only the defined value

The world calls `css({ flexDir: 'column', flexDirection: undefined })`
on one flex probe. The spec checks the sheet carries the single remapped
utility, the class string is that utility alone, and the probe paints a
column — the `undefined` longhand drops without erasing its defined
shorthand. Column, not row: row is the default and would pass unpainted.

Evidence: `[panda-v1]`
`vendor/panda-v1/packages/shared/__tests__/walk-object.test.ts`; stations
`packages/reference-rs/modules/atomic/tests/cases/ATM-LEAF-05`,
`ATM-LEAF-07`, `ATM-LEAF-10`.
