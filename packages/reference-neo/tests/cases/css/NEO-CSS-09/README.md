# NEO-CSS-09 — dots, slashes, brackets, parens, percent, quotes, and commas round-trip from values to selectors

The world calls `css()` once per escaping shape: a dotted rem, a percent
width, a `calc()` with parens and percent, a slashed aspect ratio, a quoted
font stack with a comma, a bracketed content string, and a two-shadow box
shadow. The spec checks the sheet carries exactly seven utilities with the
escaped selectors, the DOM classes stay unescaped, and each probe paints the
declared value in computed style.

Evidence: `[lib]` `docs/evidence/lib-sheet-styles-css.md` §3 class-name
grammar row; `[panda-v1]`
`vendor/panda-v1/packages/shared/__tests__/esc.test.ts` "invalid characters
are escaped" and `vendor/panda-v1/packages/core/__tests__/classname.test.ts`;
`[atm]` ATM-NAME-01..07 (escapes in selectors, runtime names unescaped).
