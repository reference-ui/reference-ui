# NEO-SITE-01 — literal ternary: both arms compile, the runtime arm paints

The world calls `css({ color: flag ? 'cherry' : 'ocean' })` with a flag the
extractor cannot resolve (read from the page URL at runtime). The spec
checks the sheet carries both arm utilities with nothing else, the node
takes only the runtime-chosen cherry class, and the node paints cherry.

Evidence: `[decision D11]`; `[panda-v1]` `parser/__tests__/output.test.ts` L878;
`[atm]` ATM-SITE-05.
