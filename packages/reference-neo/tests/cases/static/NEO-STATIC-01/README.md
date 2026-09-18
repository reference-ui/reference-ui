# NEO-STATIC-01 — declared static values × conditions exist in the sheet with no call site, and runtime `css()` paints from them

The world declares `ember`/`gold` tokens and a `staticCss` map of two
base colors plus a hover color, with no static `css()` want for any of
them. The app paints a base probe and a `data-hover` twin through runtime
values (function parameters the extractor cannot see). The spec checks the
sheet carries exactly the three declared atoms with one hover `:is()`
wrap, then checks computed: the base probe paints ember and the twin
paints hover gold — so the atoms exist purely from the declaration.

Evidence: `[panda-v1]`
`packages/core/__tests__/static-css.test.ts` "works" (properties ×
conditions, `color: ['*']`); `[atm]` ATM-STATIC-01 (third want source),
ATM-STATIC-02 (dedup); `[atm]` P1 #14
(`docs/evidence/atomic-claims.md:315`).
