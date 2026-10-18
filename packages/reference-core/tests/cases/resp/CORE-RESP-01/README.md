# CORE-RESP-01 — responsive arrays map index to base and first breakpoint

The world calls css() once with width: ['50px', '60px']. The spec checks the sheet carries the base utility plus the sm container rule, the same array resolves both classes node-side, and resizing the container element flips computed width both ways.

Evidence: Panda v1 test "responsive array"; ATM-LEAF-05, ATM-COND-01.

> Search terms: min-width, @container, mobile-first, positional, mq, positional slots, slot order, responsive/array, CORE-RESP-02
