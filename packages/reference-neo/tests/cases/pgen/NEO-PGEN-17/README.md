# NEO-PGEN-17 — bound recipe variants: alias good assigns, bad fails TS2322; recipe calls fail TS2353 nested, TS2322 flat.

A valid selection assigns at the exported variant alias, and a valid
recipe call assigns through the inferred variants: precision lives at the
alias and the call, never at per-tag DivProps, which stays open unknown by
user-space law. Related: NEO-PGEN-22 (the bound narrowing that flips it),
NEO-PGEN-15 (the css twin of this openness story).

The world's tone recipe fragment mints the tone-axis union, and the W4
flip landed all three negatives: a wrong axis value fails with TS2322 at
the alias, a nested variant object fails with TS2353 at the call, and a
bad axis value fails with TS2322 at the flat call. The world, the
temp-project plumbing, and the paint proof already stand.
