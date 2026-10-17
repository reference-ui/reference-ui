# ATM-SITE-38 — unary fold-or-refuse over const-resolved operands

. `-`/`+`/`!`/`~` fold over
literal and const-resolved numeric/boolean operands with the operator
applied to every leaf; anything else refuses with a located diagnostic and
zero wants — never a dropped sign (`-space` over `const space = 4` folds to
`-4`) or a walked-through operand (`!true` folds to `false`, never `true`).

`fold.ts` pins const-resolved folds (scalar, member, boolean, multi-leaf,
mixed-leaf leniency); `literal.ts` pins literal folds and refusals
(non-numeric strings, `typeof`/`delete`); `unfoldable.ts` pins inline
distribution, array/object refusal, and dynamic operands keeping their
existing vocabulary (unbound, member-miss, mutated); `transparent.ts` pins
(TS non-null `!` transparent in wants and plans).

Both walkers call the shared `extract/fold/unary.rs` node, so want/plan
parity is structural. Strings refuse
where v2 coerces.
