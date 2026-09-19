# ATM-HARVEST-05

A holey template is not information, but a wholesale CSS value sitting in
its hole still is: `` `brand ${'red'} tonight` `` puts `red` in the pool
and harvest mints `"color:red"` onto `css({ color: \`${color}\` })`. The
partial `` `${n}px` `` on `width` mints nothing — no length was written.
Symbols: `HarvestPool`, `Sink`, `warn_dynamic`, `HarvestSink`.
Siblings: `ATM-HARVEST-01` (string-literal floor), `ATM-HARVEST-02` (partial
joins mint nothing), `ATM-SITE-51` (static templates fold at the site).
Contract: [SPEC.md](../../../SPEC.md).

> Search terms: wholesale in hole, whole-value wrap, partial `${n}px`, inner literal harvest, join is not a value
