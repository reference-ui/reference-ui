# NEO-SITE-18 — static key plus spread ternary paints the runtime winner

The world calls `css({ padding: '0', ...(u ? { padding: '10px' } : ...
) })` with a const `u`. The spec checks the sheet carries all three
union utilities, the node resolves to the winning arm's class, and the
node paints the winner. The frozen-request recompile carries zero
diagnostics.

Evidence: `[atm]` ATM-SITE-24; `[overmatch]` SPEC-V2-22; `[panda-v2]`
`vendor/panda/crates/pandacss_extractor/tests/conditional_output.rs:363`.

> Search terms: ternary spread union, colliding spread, static plus spread, order independent, NEO-SITE-08
