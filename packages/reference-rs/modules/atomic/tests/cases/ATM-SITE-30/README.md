# ATM-SITE-30 — unary `+`/`-` on numeric literals folds at the literal

Overmatch pin-before-narrow (SPEC-V2-08): filed before SITE-38 narrows the
unary fallthrough. `-4`, `-0.5`, and `+50` extract with one want and one
runtime plan per leaf; `-0` canonicalizes to `0` on both sides so wants and
plans share one spelling. Zero diagnostics.

Catalog entries 13 (static backticks) and 36 (micro-fold bundle) ride the
same station number and land as Ph2 arms.

Panda: `calls.rs:1093` (`unary_negation_on_numeric_literal`), `:1110`
(`unary_plus_on_numeric_literal`).
