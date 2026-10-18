# CORE-SITE-19 — call-form `css([...])` merges and paints last-wins

The world calls `css([{ margin: '10px' }, { margin: '20px' }, false])`:
a merge list with a falsy hole. The spec checks the sheet carries both
margin utilities (never responsive), the node resolves to the last
element's class, and the `20px` margin paints. The frozen-request
recompile carries zero diagnostics.

Evidence: ATM-SITE-25; Panda v2 atomic tests.

> Search terms: merge list, array css arg, responsive confusion, falsy hole, last wins
