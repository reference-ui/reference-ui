# NEO-MERGE-05 — a conditional object arg merges with a base arg at the condition slot

The world calls `css({ color: 'ember' }, { _hover: { color: 'ocean' } })`
on one element and the `css([...])` merge-list form on a twin. The spec
checks the sheet carries the base plus hover atoms with no query wrap,
both class strings match exactly, and hover paints the merged ocean over
the resting ember — the condition arg joins its own slot either way.

Evidence: Neo `plans.test.ts`; station
`packages/reference-rs/modules/atomic/tests/cases/ATM-MERGE-03`.
