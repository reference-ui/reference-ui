# NEO-CSS-12 — rhythm `4r`, `3.5r`, and `1/2r` lower to root calc formulas

The world pins `--spacing-root` and calls `css()` with an integer, a
decimal, and a fraction rhythm step. The spec checks the sheet carries the
three calc formulas over the root — Neo has no per-key spacing vars, so
`4r` is `calc(4 * var(--spacing-root))`, not Panda's `var(--spacing-4r)` —
and each probe paints its computed pixels at the known root.

Evidence: `[lib]` `docs/evidence/lib-sheet-global-css.md` Trace B/E and
`docs/evidence/lib-sheet-styles-css.md` §3 rhythm row (contrast: L5161
`var(--spacing-4r)` is a Core token Neo does not mint); `[atm]` P1 #8
(`docs/evidence/atomic-claims.md`), ATM-RHYTHM-01..05.

> Search terms: spacing scale, multiples, design tokens, r suffix, r steps, css/rhythm, css/spacing
