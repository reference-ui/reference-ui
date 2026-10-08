# NEO-PRIM-02 — `css` prop and sibling StyleProps both paint; `css` wins on conflict

The world renders two Divs: one with sibling StyleProps plus a `css` prop
carrying a third declaration, and one where the `css` prop repeats the
sibling color with a different value. The spec checks computed styles from
both sources on the first, the `css` value winning on the second, exactly
four utilities in the sheet, and the `css` key staying off the DOM.

Evidence: `[atm]` ATM-SITE-14; `[panda-v1]`
`vendor/panda-v1/packages/parser/__tests__/output.test.ts:74-88` (`css` prop
alongside sibling style props on one element).

> Search terms: override, precedence, cascade, merge, override probe, prim/css-override, prim/sibling-merge, NEO-PRIM-11
