# ATM-SITE-33 — binary fold bundle with dead-arm elimination

Overmatch Ph3 (SPEC-V2-10, SPEC-V2-11, SPEC-V2-12, SPEC-V2-19, SPEC-V2-66
fold half). Arithmetic (`+ - * / % **` with JS `Number` coercion),
string concat (`+` with a string side), comparison (`== != === !== <
<= > >=`), and all-literal short-circuit (`&& || ??`) fold over literal
and const-resolved operands; folded ternary tests compile the live arm
only and name the dead arm in an `ATM-I-DEAD-BRANCH` info. Division by
zero, `NaN`, non-finite results, bitwise/shift/`in`/`instanceof`, and
array/object operands refuse with `ATM-W-DYNAMIC-BINARY` and zero wants
from that position — never a dropped value (the `'foo' - 1` net keeps
every static sibling) or a walked-through operand.

`fold.ts` pins arithmetic and concat over literal, ident, and member
operands; `compare.ts` pins comparisons directly and as ternary tests;
`logical.ts` pins the six short-circuit shapes; `deadarm.ts` pins
dead-arm elimination in value, spread, condition, and `css()`-arg
positions; `refuse.ts` pins the five refusal shapes beside an open-test
control; `flat.tsx` pins JSX parity.

Both walkers call the shared `extract/fold/{binary,logical,conditional}`
nodes, so want/plan parity is structural. Guards stay authoritative:
`false && 'x'` and `null ?? 'd'` keep the entry-18 rule and never fold.
Panda: `calls.rs:1148` (concat), `:1168` (arithmetic), `:1394` (drop
net), `:1499` (logical literals), `:1535`–`:1614` (equality and
comparison), `:1443`/`:1635` (folded tests), `conditional_output.rs:47`
(dead arm), `scope.rs:849` (ident operands).
