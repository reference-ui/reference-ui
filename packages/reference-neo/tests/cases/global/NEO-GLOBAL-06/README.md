# NEO-GLOBAL-06 — `'& ~ &'` under a comma selector distributes `:is()` siblings per member

The world authors the panda complex-nesting shape: `body > p, body > ul`
with a base margin plus an `'& ~ &'` sibling key. The spec checks the sheet
distributes per member with every combinator member `:is()`-wrapped —
`:is(body > p) ~ :is(body > p), :is(body > ul) ~ :is(body > ul)` — then checks
computed paint: each second sibling carries the 10px top margin, each leader
stays flush, and selector-match probes show the second paragraph matching the
wrapped sibling selector while a nested paragraph sits outside the wrapped
member (a margin negative cannot work here — the sync's reset zeroes all
margins — so scoping is proven by matching, not paint).

The nested value is the literal `'10px'`; the claim is the selector
distribution, not the value. (An earlier draft claimed bare `10` lowers
unitless — captain probe N1 refutes it for `css()`: `marginTop: 10` →
`margin-top: 10px`. The globalCss numeric path is unprobed.) Note the D7
contrast: Panda's own snapshot wraps only the first
member (`body > ul ~ body > ul` bare) — a Panda bug, not parity; Neo wraps
every combinator member.

Evidence: `[panda-v1]` `core/__tests__/global-css.test.ts:243` "complex
recursive nesting"; `[atm]` ATM-LAYER-09 (RS-11 landed).

> Search terms: general sibling, tilde, selector list, child combinator, panda complex nesting, global/nesting, selector :is()
