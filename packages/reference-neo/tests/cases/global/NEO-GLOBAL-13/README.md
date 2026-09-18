# NEO-GLOBAL-13 — Bare token names in `globalCss` resolve through the property's category

The world authors `body` and `.card` rules with bare token spellings —
`fontFamily: 'sans'`, `borderRadius: 'md'`, `outlineColor: 'ui.focus.ring'` —
the way `@reference-ui/lib` authors its tag recipes. The spec checks the
global layer prints the `var()` forms and the card probe computes the
resolved radius, ring, and ink — never the verbatim author strings.

Evidence: `[atm]` ATM-LAYER-15; `[lib]` `global.ts`, `disclosure.ts`,
`shared.ts` (RS-35).

> Search terms: design tokens, token resolution, semantic tokens, category mapping, implicit tokens, global/token-resolution, global/design-tokens
