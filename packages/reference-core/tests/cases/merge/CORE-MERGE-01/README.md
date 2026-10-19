# CORE-MERGE-01 — two css() args merge last-wins per slot while the sheet keeps both atoms

The world calls `css({ color: 'ember' }, { color: 'ocean' })` on one
element. The spec checks the sheet carries both color atoms, the emitted
class string is exactly the second atom, and the element paints the second
color — the runtime merge collapses the shared slot while the stylesheet
stays complete.

Evidence: reference-rs case
`rs-cases:ATM-MERGE-01`.

> Search terms: override, precedence, conflict, duplicate property, variadic, repeat prop, merge/last-wins, merge/slot-collapse, CORE-MERGE-02
