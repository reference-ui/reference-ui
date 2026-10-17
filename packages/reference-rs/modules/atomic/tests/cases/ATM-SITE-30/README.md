# ATM-SITE-30 — unary `+`/`-` on numeric literals folds at the literal

Pinned before SITE-38 narrows the
unary fallthrough. `-4`, `-0.5`, and `+50` extract with one want and one
runtime plan per leaf; `-0` canonicalizes to `0` on both sides so wants and
plans share one spelling. Zero diagnostics.

Static backticks (`` `red` `` folds as the
plain string) and micro-fold bundle (shorthand `{ color }`,
`css({})`, `css('panda', {...})`, `cx('card', css({...}))`, no-arg `css()`
— folds and silence controls, zero diagnostics).
