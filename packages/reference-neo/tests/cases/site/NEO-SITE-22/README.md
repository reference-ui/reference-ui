# NEO-SITE-22 — runtime-`ok` `...(ok && extra)` lands `extra`

The world calls `css({ color: 'red', ...(ok && extra) })` with `ok` read
from the page URL at runtime (unresolvable at extract) and a const
`extra` object. The spec checks the sheet carries both the sibling and
the spread utilities and the node paints both declarations.

Evidence: `[overmatch]` SPEC-V2-21 (pending paint pin); `[panda-v2]`
`conditional_output.rs:274` (logical spread merges right operand);
`[atm]` ATM-SITE-05.

> Search terms: short-circuit, ampersand, guarded object, runtime gate, query param, site/spread, NEO-SITE-08
