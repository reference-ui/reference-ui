# NEO-SITE-24 — Whole-object args lower while refused positions diagnose

The world styles four nodes: the sibling through `css(styles, { color })`
(a whole const object beside the live arg that wins the merge), the
logical node through an arg-level `cond && {...}` (the object right
lowers, the const-true left diagnoses), the spread twin through the same
const object with braces (`css({ ...styles })`), and the tagged node
through a live `` css`…` `` tag. The spec asserts the sibling paints
ocean, the twin paints cherry, and the logical node paints plum while
the tagged node paints nothing; the sheet carries exactly the three
surviving utilities, and the frozen-request recompile carries exactly
the two positioned refusal warnings.

Evidence: `[atm]` ATM-SITE-50 (whole-object / member args);
`[overmatch]` SPEC-V2-65 Ph3, SPEC-V2-38; `[panda-v2]`
`vendor/panda/crates/pandacss_extractor/tests/calls.rs:548`, `:1719`,
`pandacss_stylesheet/tests/atomic.rs:1626`.

> Search terms: whole-object css args, member args, arg-level logical, tagged template site, refusal diagnostics, siblings kept, NEO-SITE-20, ATM-SITE-50
