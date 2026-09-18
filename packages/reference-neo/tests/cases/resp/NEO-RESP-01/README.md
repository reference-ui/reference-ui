# NEO-RESP-01 — responsive arrays map index to base and first breakpoint

The world calls css() once with width: ['50px', '60px']. The spec checks the sheet carries the base utility plus the sm container rule, the same array resolves both classes node-side, and resizing the container element flips computed width both ways.

Evidence: [panda-v1] core/__tests__/atomic-rule.test.ts "responsive array"; [atm] ATM-LEAF-05, ATM-COND-01.
