# NEO-SITE-21 — impure helper leaves refuse while static siblings paint

The world styles two nodes mixing an impure-helper color leaf (a
`Math.random` helper, an async call) with a static margin sibling. The
spec checks the sheet carries only the two margin utilities, the margins
paint, the refused colors paint nothing, and the frozen-request
recompile carries the two positioned warnings. The pure-helper paint arm
rides Ph3 SPEC-V2-39.

Evidence: `[atm]` ATM-SITE-32; `[overmatch]` SPEC-V2-42; `[panda-v2]`
`vendor/panda/crates/pandacss_extractor/tests/scope.rs:1020`, `:1164`.

> Search terms: impure helper, doom tripwire, refuse pins, Math.random, async call, sibling paints
