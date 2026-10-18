# CORE-CSS-12 — rhythm `4r`, `3.5r`, and `1/2r` lower to root calc formulas

The world pins `--spacing-root` and calls `css()` with an integer, a
decimal, and a fraction rhythm step. The spec checks the sheet carries the
three calc formulas over the root — Core has no per-key spacing vars, so
`4r` is `calc(4 * var(--spacing-root))`, not Panda's `var(--spacing-4r)` —
and each probe paints its computed pixels at the known root.

Evidence: reference-lib Trace B/E and
rhythm row (contrast: L5161
`var(--spacing-4r)` is a retired reference-core token that core does not mint); ATM-RHYTHM-01..05.

> Search terms: spacing scale, multiples, design tokens, r suffix, r steps, css/rhythm, css/spacing
