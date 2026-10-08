# NEO-SITE-19 — call-form `css([...])` merges and paints last-wins

The world calls `css([{ margin: '10px' }, { margin: '20px' }, false])`:
a merge list with a falsy hole. The spec checks the sheet carries both
margin utilities (never responsive), the node resolves to the last
element's class, and the `20px` margin paints. The frozen-request
recompile carries zero diagnostics.

Evidence: `[atm]` ATM-SITE-25; `[overmatch]` SPEC-V2-29; `[panda-v2]`
`vendor/panda/crates/pandacss_stylesheet/tests/atomic.rs:1474`.

> Search terms: merge list, array css arg, responsive confusion, falsy hole, last wins
