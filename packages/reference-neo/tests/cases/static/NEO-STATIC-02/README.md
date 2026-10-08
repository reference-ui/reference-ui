# NEO-STATIC-02 — wildcard `*` expands a token category, and the overlapping static want dedups to one atom

The world declares three neutral tokens and `staticCss` of `color: ['*']`,
plus one static `css()` want for `n100` that overlaps the wildcard. The
app paints a control through the static want and two probes through
runtime values. The spec checks the sheet carries exactly three atoms —
the overlap dedups instead of doubling — then checks computed: all three
probes paint their shade, so the wildcard expanded the whole category.

Evidence: `[panda-v1]`
`packages/core/__tests__/static-css.test.ts` "works" (`color: ['*']`
expansion); `[atm]` ATM-STATIC-02 (AST + static dedup); `[decision D14]`
(real tokens only — the count is the token count).

> Search terms: glob, asterisk, dedupe, deduplication, star operator, static/wildcard, static/dedup, NEO-STATIC-01
