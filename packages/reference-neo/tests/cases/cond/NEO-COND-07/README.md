# NEO-COND-07 — `"&[data-state='open']"` paints only the matching attribute and `_expanded` paints via its twin list

The world calls `css()` with a quoted attribute key on two paragraphs
carrying different `data-state` values, and with `_expanded` on a
`data-expanded` button. The spec checks the sheet carries exactly two
utilities, the attribute class escapes its quotes (`\'open\'`), the
`_expanded` rule keeps the triple twin list, the open paragraph paints
brand, and the closed paragraph keeps the ink baseline while the
expanded twin paints accent.

Evidence: `[atm]` ATM-COND-09 (R1 probe `/tmp/cond-batch3-r1/probe.mjs`
emits the `[data-state='open']` rule and the `_expanded` triple list);
`[panda-v1]`
`vendor/panda-v1/packages/core/__tests__/rule-processor.test.ts:259`
"css" (`"&[data-attr='test']"` nesting `_expanded`); `[lib]`
`packages/reference-lib/.reference-ui/styled/styles.css`
(`[data-slot="icon"]` utilities, e.g. L442).
