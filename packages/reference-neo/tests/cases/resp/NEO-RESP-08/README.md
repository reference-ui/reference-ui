# NEO-RESP-08 — numeric r keys lower to a concrete @container query

The world calls css() once with r: { 300: … } sugar and once in direct @container form. The spec checks the sheet carries the base utility plus the 300px container rule, both forms resolve the same two classes node-side, and resizing the container element across 300px flips computed width both ways.

Evidence: [atm] ATM-COND-07; NEO-CSS-02.

> Search terms: arbitrary, pixel, threshold, custom breakpoint, literal, responsive/arbitrary, NEO-RESP-09
