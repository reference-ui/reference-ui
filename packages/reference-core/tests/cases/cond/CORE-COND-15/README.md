# CORE-COND-15 — mixed `@supports` + `@container` + `&:hover` nests and gates

The world pairs one mixed arm (`@supports (display: grid)` outside `sm`
outside `&:hover`) with a bogus-query control. The spec checks the sheet
nests the at-rules outside the hovered selector, the live probe paints only
when container and hover both hold, the narrow and bogus probes never paint,
and a resync prints the sheet byte-identical.

Evidence: Panda v1 test "mixed vs at-rule sorting"; ATM-COND-19 (RS-15).

> Search terms: container queries, feature queries, breakpoint, idempotent, at-rule sandwich, at-rules/supports, at-rules/container, conditions/hover, breakpoints/sm
