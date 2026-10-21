# ATM-RECIPE-11 — Slot refusals and slot-stem collisions

A slotted recipe with a stray slot key, a non-array, duplicate or empty
`slots` is refused whole. Each refusal carries `ATM-E-RECIPE-SLOT` at the
offending node. A plain recipe named like a slot stem (`card__root`), or a
plain and a slotted recipe sharing one `className`, is refused with
`ATM-E-DUPLICATE-RECIPE`; the first claimant keeps its table.
Related: ATM-RECIPE-06, ATM-RECIPE-10.
