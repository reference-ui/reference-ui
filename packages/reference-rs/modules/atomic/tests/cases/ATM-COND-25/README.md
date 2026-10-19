# ATM-COND-25 — Self-`&` inside functional pseudos

Self-`&` inside functional pseudos (`&:not(&.no)`, `&:has(&, :not(&))`,
`&.b :not(& + &)` and five more) substitutes every unquoted `&` at one
level. Contract: SPEC.
