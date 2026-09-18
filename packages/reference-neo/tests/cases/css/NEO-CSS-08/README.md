# NEO-CSS-08 — every `!` spelling marks important; bangs in quoted strings do not

The world calls `css()` with `'red!'`, `'red !important'`, and
`'red!IMPORTANT'` beside a later plain `'yellow'`, plus a quoted
`content: '"hello!"'`. The spec checks all three spellings resolve to the
one important class and beat the later plain utility in computed color
while plain alone paints yellow, and the content string stays intact and
unimportant.

Evidence: `[atm]` P0 #5 (`docs/evidence/atomic-claims.md`), ATM-LEAF-09,
ATM-LEAF-10; `[panda-v1]`
`vendor/panda-v1/packages/core/__tests__/atomic-rule.test.ts:10` "respect
important syntax" (contrast: `vendor/panda-v1/packages/shared/src/important.ts`
matches `!` anywhere, Atomic strips suffixes only).

> Search terms: specificity, cascade, trailing bang, override, exclamation mark, bang suffix, css/important, css/bang-suffix
