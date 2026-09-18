# NEO-CSS-07 — Arbitrary values are one class each and paint

The world calls `css()` with the arbitrary spellings lib authors write —
an `rgba()` color, a `color-mix()` background, a `calc()` width — one probe
each. The spec checks the sheet carries exactly those three utilities with
the functions intact, each probe carries a single class, and each paints.

Evidence: `[atm]` ATM-NAME-01..07, ATM-LEAF-01..08; `[lib]`
`packages/reference-lib/.reference-ui/styled/styles.css:27446`
(`color-mix(in oklch, currentColor 14%, transparent)`).

> Search terms: hsl(), var(), url(), clamp(), function values, css/arbitrary-values, css/css-functions, NEO-CSS-09
