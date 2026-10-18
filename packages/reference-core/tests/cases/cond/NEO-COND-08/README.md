# NEO-COND-08 — `_before`/`_after` with quoted `content` paint and sort after pseudo-classes

The world calls `css()` with a `_hover` color plus `_before` and
`_after` quoted contents and colors on one paragraph. The spec checks
the sheet carries exactly five utilities with the hover rule ahead of
both pseudo-element rules and no `!important` from the quoted bang,
and the paragraph paints ink at rest and accent under a real hover
while its `::before` and `::after` paint their contents and colors.

Evidence: ATM-COND-10, ATM-LEAF-10, ATM-ORDER-03 (probes emits hover before
`::before`/`::after` and keeps quoted `content` verbatim); Panda v1 test
"pseudo-elements sort after pseudo-classes and mixed conditions"; reference-lib
Trace D (`.ref-q` `_before`/`_after` quote contents).

> Search terms: generated content, content property, ordering, double colon, before after, conditions/before, conditions/after, ordering/pseudo-elements
