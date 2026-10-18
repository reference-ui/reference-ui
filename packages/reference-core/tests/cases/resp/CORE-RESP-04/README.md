# CORE-RESP-04 — nested sm: { md: … } paints only when both queries hold

The world calls css() once with width: '50px' plus sm: { md: { width: '60px' } }. The spec checks the sheet nests the md container rule inside the sm rule, the same call resolves both classes node-side, and only a container at least 768px wide paints 60px: 400px and 700px both keep base width.

Evidence: Panda v1 test "should process complex rule"; ATM-COND-01.

> Search terms: conjunction, intersection, compound, stacked, combined, breakpoint combo, double gate, responsive/nesting, conditions/nesting, CORE-RESP-03
