# NEO-GLOBAL-10 — `:has()` selectors in `globalCss` pass through and match

The world authors a field bezel with a base border plus the lib invalid
rule: `[data-reference-field]:has([aria-invalid="true"])` twinned with
`[data-reference-field][data-invalid]`, both carrying a token border colour.
The spec checks the sheet carries the literal `:has()` selector with the
token var inside `@layer global`, then checks computed paint: a bezel with a
valid inner input holds base, bezels with an invalid inner input or the
twin attribute paint the invalid token, and toggling `aria-invalid` live
flips the bezel both ways.

Evidence: `[lib]` `docs/evidence/lib-sheet-styles-css.md` `:has(` ×8,
L1044 invalid bezel; `[atm]` ATM-LAYER-03.

> Search terms: form validation, invalid state, parent selector, relational selector, error state, validation twin, global/has, selector :has(), NEO-GLOBAL-03
