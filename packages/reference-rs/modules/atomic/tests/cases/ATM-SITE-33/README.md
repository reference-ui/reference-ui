# ATM-SITE-33 — binary fold bundle with dead-arm elimination

Arithmetic (`+ - * / % **` with JS `Number` coercion),
string concat (`+` with a string side), comparison (`== != === !== <
<= > >=`), and all-literal short-circuit (`&& || ??`) fold over literal
and const-resolved operands; folded ternary tests compile the live arm
only and name the dead arm in an `ATM-I-DEAD-BRANCH` info. Division by
zero, `NaN`, non-finite results, bitwise/shift/`in`/`instanceof`, and
array/object operands refuse with `ATM-W-DYNAMIC-BINARY` and zero wants
from that position — never a dropped value (the `'foo' - 1` net keeps
every static sibling) or a walked-through operand.

`fold` pins arithmetic and concat over literal, ident, and member
operands; `compare` pins comparisons directly and as ternary tests;
`logical` pins the six short-circuit shapes; `deadarm` pins
dead-arm elimination in value, spread, condition, and `css()`-arg
positions; `refuse` pins the five refusal shapes beside an open-test
control; `flat` pins JSX parity.

Both walkers call the shared `extract/fold/{binary,logical,conditional}`
nodes, so want/plan parity is structural. Guards stay authoritative:
`false && 'x'` and `null ?? 'd'` keep the short-circuit rule and never fold.
