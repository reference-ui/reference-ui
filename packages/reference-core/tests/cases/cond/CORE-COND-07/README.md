# CORE-COND-07 — `"&[data-state='open']"` paints only the matching attribute and `_expanded` paints via its twin list

The world calls `css()` with a quoted attribute key on two paragraphs
carrying different `data-state` values, and with `_expanded` on a
`data-expanded` button. The spec checks the sheet carries exactly two
utilities, the attribute class escapes its quotes (`\'open\'`), the
`_expanded` rule keeps the triple twin list, the open paragraph paints
brand, and the closed paragraph keeps the ink baseline while the
expanded twin paints accent.

Evidence: ATM-COND-09 (probe emits the `[data-state='open']` rule and the
`_expanded` triple list); Panda v1 test "css" (`"&[data-attr='test']"` nesting
`_expanded`); reference-lib
the built lib styles (`[data-slot="icon"]`
utilities, e.g. L442).

> Search terms: single quotes, backslash, data attribute, special characters, quote handling, escaping/quotes, conditions/expanded, selector attribute
