# ATM-SITE-79

A named import declared by two `export *` sources with different origins refuses with `Refused::Ambiguous`: nothing folds, and each use diagnoses exactly as an unresolvable import does — while the spread's static sibling survives.
Symbols: `BindingWalk`, `Refused::Ambiguous`, `resolve_binding`, `ValueGraph`.
Siblings: `ATM-SITE-78` (star barrels resolve), `ATM-SITE-75` (unresolvable imports), `ATM-SITE-77` (guarded cycles).
Contract: [SPEC.md](../../../SPEC.md).

> Search terms: ambiguous star, export star twin, refused import, dynamic identifier, unfoldable spread, star fan-out
