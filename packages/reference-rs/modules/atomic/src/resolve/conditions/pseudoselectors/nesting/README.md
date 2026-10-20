# Nesting tests

Proofs for two-level selector nesting. Fast and slow paths agree on trims and empties, comma templates scope each member to the parent, multi-ampersand templates wrap combinator parents in `:is`, and pseudo-elements move past the compound following `&` — each test calling the nester directly and comparing selector strings.
