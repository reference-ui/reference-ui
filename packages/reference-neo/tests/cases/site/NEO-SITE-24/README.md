# NEO-SITE-24 — Non-object `css()` args diagnose while siblings paint

The world styles four nodes: the sibling through `css(styles, { color })`
(a whole const object beside a live arg), the logical node through an
arg-level `cond && {...}`, the spread twin through the same const object
with braces (`css({ ...styles })`), and the tagged node through a live
`` css`…` `` tag. The spec asserts the sibling paints ocean and the twin
paints cherry while the diagnosed nodes paint nothing, the sheet carries
exactly the two surviving utilities, and the frozen-request recompile
carries exactly the three positioned refusal warnings. Whole-object
resolve rides Ph3 — Ph1 ends the silence.

Evidence: `[atm]` ATM-SITE-50 (no-silence sweep);
`[overmatch]` SPEC-V2-65 Ph1, SPEC-V2-38; `[panda-v2]`
`vendor/panda/crates/pandacss_extractor/tests/calls.rs:548`, `:1719`,
`pandacss_stylesheet/tests/atomic.rs:1626`.

> Search terms: non-object css args, whole object, arg-level logical, tagged template site, refusal diagnostics, siblings kept, NEO-SITE-20, ATM-SITE-50
