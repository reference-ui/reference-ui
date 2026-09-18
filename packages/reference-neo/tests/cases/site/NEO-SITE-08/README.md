# NEO-SITE-08 — logical `...(ok && extra)` with const `ok` lands `extra`

The world calls `css({ color: 'red', ...(ok && extra) })` with const `ok`
and a const `extra` object. The spec checks the sheet carries both the
sibling and the spread utilities and the node paints both.

Evidence: `[panda-v1]` `vendor/panda-v1/packages/extractor/__tests__/extract.test.ts`
(logical spreads); `[atm]` ATM-SITE-05.
