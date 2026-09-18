# NEO-COND-01 — `_hover` matches both `:hover` and `[data-hover]` (one `:is()` wrap)

The world calls `css()` with a base color plus a `_hover` color on a live
element, and the same `_hover` color alone on a `data-hover` twin. The
spec checks the sheet carries exactly two utilities with a single
`:is(:hover, [data-hover])` selector, the twin paints without interaction,
and the live element paints its base color at rest, the hover color under
a real `page.hover()`, and the base color again after the pointer leaves.

Evidence: `[atm]` ATM-COND-02, ATM-COND-10; `[panda-v1]`
`vendor/panda-v1/packages/core/__tests__/atomic-rule.test.ts:317` "simple"
(grouped conditions lower `_hover` to one `:is()` wrap); `[lib]`
`packages/reference-lib/.reference-ui/styled/styles.css`
`:is(:hover, [data-hover])` ×26 (e.g. L475).

> Search terms: pseudo-class, dual bind, hover twin, conditions/hover, selector :is(), NEO-COND-02
