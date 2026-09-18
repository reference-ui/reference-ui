# NEO-SITE-04 — Import alias `css as c` and namespace `ui.css` are sites

The world styles one node through an aliased `css` import and another
through a namespace `ui.css` call. The spec asserts both nodes paint their
own color and the sheet carries exactly the two utilities, so binding shape
never decides what extracts.

Evidence: `[atm]` ATM-SITE-15 (namespace imports and compiler-internal
aliases extract; type-only and default imports do not); `[panda-v1]`
`vendor/panda-v1/packages/parser/__tests__/css-2.test.ts:310` (import alias
`css as nCss` extracts) and `namespace.test.ts:79` (`panda.css` extracts).
