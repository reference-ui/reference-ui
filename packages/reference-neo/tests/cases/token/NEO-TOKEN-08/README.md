# NEO-TOKEN-08 — negative spacing token (-sm) and negative rhythm (-1r, -4r) paint negated calc of the positive var

The world paints three probes: `marginTop: '-sm'` against a named `sm`
token plus `marginTop: '-1r'` and `marginTop: '-4r'` rhythm sugar over a
`0.25rem` root. The spec checks the sheet negates the token var
(`calc(-1 * var(--spacing-sm))`) and the root (`calc(-1 * …)`,
`calc(-4 * …)`), keeps the minus in the class names, and that each probe
computes its negative pixel value like its inline reference.

Evidence: `[lib]` 368 negatives; `[panda-v1]`
`token-dictionary/__tests__/spacing.test.ts`; `[atm]` P1 #8, ATM-TOKEN-07,
ATM-RHYTHM-05.
