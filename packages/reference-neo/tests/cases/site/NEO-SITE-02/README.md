# NEO-SITE-02 — local const member `theme.primary` compiles through `css()`

The world holds a local const style object and passes one member into
`css({ color: theme.primary })`. The spec checks the sheet carries the
resolved utility and the node paints it. Whole-object `css(styles)` stays
absented per the site SPEC — members and spreads are the author shapes.

Evidence: `[panda-v1]` `extractor/__tests__/unbox.test.ts` L4304;
`[atm]` ATM-SITE-06.

> Search terms: property lookup, dot notation, token reference, site/member-access, NEO-SITE-03
