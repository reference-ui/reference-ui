# ATM-SITE-30 — unary `+`/`-` on numeric literals folds at the literal

Overmatch pin-before-narrow (SPEC-V2-08): filed before SITE-38 narrows the
unary fallthrough. `-4`, `-0.5`, and `+50` extract with one want and one
runtime plan per leaf; `-0` canonicalizes to `0` on both sides so wants and
plans share one spelling. Zero diagnostics.

Ph2 arms (landed): SPEC-V2-13 static backticks (`` `red` `` folds as the
plain string) and SPEC-V2-36 micro-fold bundle (shorthand `{ color }`,
`css({})`, `css('panda', {...})`, `cx('card', css({...}))`, no-arg `css()`
— folds and silence controls, zero diagnostics).

Panda: `calls.rs:1093` (`unary_negation_on_numeric_literal`), `:1110`
(`unary_plus_on_numeric_literal`); backticks ``calls.rs:1194``; micros
`scope.rs:262`, `calls.rs:224`, `:1697`, `:679`, `:1687`.
