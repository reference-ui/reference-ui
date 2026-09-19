# NEO-SITE-18 — static key plus spread ternary paints the runtime winner

The world calls `css({ padding: '0', ...(unk ? { padding: '10px' } : ...
) })` with an open `unk` test (a DOM read: statically unfoldable,
runtime-true). The spec checks the sheet carries all three union
utilities, the node resolves to the winning arm's class, and the node
paints the winner. The frozen-request recompile carries zero
diagnostics. A folded `const u = true` test would prune to the live arm
with a dead-arm info instead (correct per v2, pinned at ATM-SITE-33) —
the union needs v2's `unk`.

Evidence: `[atm]` ATM-SITE-24; `[overmatch]` SPEC-V2-22; `[panda-v2]`
`vendor/panda/crates/pandacss_extractor/tests/conditional_output.rs:363`.

> Search terms: ternary spread union, colliding spread, static plus spread, order independent, NEO-SITE-08
