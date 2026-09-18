# NEO-RESP-06 — container queries sort mobile-first: min-width ascending, then max-width descending

The world calls css() once with a full six-slot width array plus lgDown, mdDown, and smDown overrides. The spec checks the sheet orders min-width blocks ascending and max-width blocks descending after them, the same call resolves nine classes node-side, and overlapping widths cascade to the last matching block: 500px paints smDown, 700px mdDown, 800px lgDown, 1100px lg, 1600px 2xl.

Evidence: [panda-v1] sort-mq.test.ts "should sort media queries"; [atm] ATM-ORDER-01.
