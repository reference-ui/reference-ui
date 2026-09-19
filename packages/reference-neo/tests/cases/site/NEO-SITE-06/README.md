# NEO-SITE-06 — Dynamic call value `color: pick()` mints no ghost and emits a located warning

The world styles its node with one `css()` call mixing a dynamic call
value (`color: pick()`, multi-statement so the entry-39 fence refuses it)
and a static sibling (`background: 'ocean'`).
The spec asserts the sheet carries exactly the sibling utility, the node
paints the ocean background while keeping its default text color, and a
fresh compile of the frozen request reports the `color` warning located
at the world's `app.ts` — sync itself succeeds.

Evidence: `[atm]` ATM-LEAF-07 (a dynamic key never erases static
siblings) and ATM-FORBID-02 (calls are not executed); `[panda-v1]`
`vendor/panda-v1/packages/extractor/__tests__/extract.test.ts:3223`
(non-deterministic calls extract nothing).

> Search terms: invocation, unevaluated, partial extraction, diagnostic, site/dynamic-value, diagnostics/located-warning
