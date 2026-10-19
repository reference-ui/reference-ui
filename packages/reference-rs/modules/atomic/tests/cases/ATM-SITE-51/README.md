# ATM-SITE-51 — interpolated templates fold over foldable parts

Template folds: `` `${n}px` `` over const `n`,
`` `${o.p}` `` over a const member, literal `` `${2}` ``/`` `${true}` ``
parts, multi-part `` `linear-gradient(${a}, ${b})` ``, wrapped parts,
unary parts, binary parts (via the SITE-33 node), nested static
templates, and the `!`-suffix rule on the joined string each emit one want
and one runtime plan per joined string.
Multi-leaf parts fan out to one string per combination (at most eight);
past the cap the template refuses whole — never a partial fan-out. Every
unfoldable part (free identifier, member, call, mutated binding,
`void`, an unfoldable ternary arm) yields zero wants from its template
plus one located `ATM-W-DYNAMIC-TEMPLATE` diagnostic naming the part, and
static siblings still extract. A folded template under unary refuses the
operator without leaking string wants past it.

Both walkers call the shared `extract::fold::template` node, so
want/plan parity is structural. `null`/`undefined` parts coerce to
`"null"`, matching v2's `coerce_to_string` quirk.

Panda's staged whole-call drop becomes our per-part
diagnostic.
