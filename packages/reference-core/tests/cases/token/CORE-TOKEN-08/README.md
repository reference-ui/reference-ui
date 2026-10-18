# CORE-TOKEN-08 — negative spacing token (-sm) and negative rhythm (-1r, -4r) paint negated calc of the positive var

The world paints three probes: `marginTop: '-sm'` against a named `sm`
token plus `marginTop: '-1r'` and `marginTop: '-4r'` rhythm sugar over a
`0.25rem` root. The spec checks the sheet negates the token var
(`calc(-1 * var(--spacing-sm))`) and the root (`calc(-1 * …)`,
`calc(-4 * …)`), keeps the minus in the class names, and that each probe
computes its negative pixel value like its inline reference.

Evidence: reference-lib 368 negatives; Panda v1 spacing tests; ATM-TOKEN-07,
ATM-RHYTHM-05.

> Search terms: negation, offset, overlap, outdent, token/rhythm, token/negation, CORE-TOKEN-07
