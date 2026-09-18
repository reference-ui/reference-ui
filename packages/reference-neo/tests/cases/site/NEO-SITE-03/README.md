# NEO-SITE-03 — identifier spread `...rest` unpacks beside its sibling

The world calls `css({ color: 'cherry', ...rest })` with a const `rest`
object carrying a margin. The spec checks the sheet carries both the
sibling and the spread utilities and the node paints both declarations.

Evidence: `[panda-v1]` `extractor/__tests__/unbox.test.ts` L4328;
`[atm]` ATM-SITE-11.

> Search terms: object merge, style composition, combined styles, site/spread, NEO-SITE-08, NEO-SITE-02
