# NEO-RESP-05 — mdDown, mdOnly, smToLg bind the query and never overlap at the boundary

The world calls css() three times, pairing base width with one range condition each. The spec checks the sheet carries the three epsilon-bounded container queries, each call resolves both classes node-side, and containers at boundary±1px paint exactly one side: 767 vs 768, 639 vs 640, 1023 vs 1024.

Evidence: [panda-v1] breakpoints.test.ts "breakpoint down"; [atm] ATM-COND-13, P1 #11.

> Search terms: max-width, between, clamped, exclusive, min-max, range sugar, epsilon ranges, responsive/range, conditions/range, NEO-RESP-06
