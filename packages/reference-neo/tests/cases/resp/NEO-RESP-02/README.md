# NEO-RESP-02 — null holes in responsive arrays skip the breakpoint

The world calls css() once with width: ['50px', null, '60px']. The spec checks the sheet carries base plus md with no sm rule, the same array resolves both classes node-side, and a container inside the sm range still paints base width while md paints the third slot.

Evidence: [panda-v1] atomic-rule.test.ts "array with gaps"; [atm] ATM-LEAF-05; [decision D10].
