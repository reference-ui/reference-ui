# NEO-LAYERS-11 — a diamond's shared upstream prints its block once, first in order, and the order statement and paint are unchanged

Three upstreams are synced for real: `a`, the shared base, and two branches, `b` and `c`, that each
extend `a`. The consumer extends `b` and layers `c`, so `a` is reached through both branches. Each
branch's streams carry `a` once, so the consumer's expansion lists it twice: `[a, b] ++ [a, c]`.

The spec writes the branch configs to extend `a` (they are committed extends-free, so the tree
typechecks before any sync), re-syncs each, then writes the consumer config and re-syncs it. All three
canonical configs are restored in a `finally`, and the spec re-syncs them so the tree is canonical after a run.

Checked against the served `styled/styles.css` and the computed paints in `index.html`:

1. The statement is `@layer neo-layers11-a, neo-layers11-b, neo-layers11-c, neo-layers11;`, one line,
   in first-occurrence order.
2. The package blocks are `a, b, c, own`. The shared base prints once, at the position the merge first
   reaches it (through `b`, before `b` itself). A second copy would repeat identical bytes, so it is never printed.
3. `a-only` paints a's colour and `b-only` paints b's. `race` carries b's and c's utilities on one element,
   so c wins (`rgb(21, 128, 61)`) because its layer comes later in the statement.

The published payload still lists `a` in each branch's streams. Only the printed sheets dedupe, and a
consumer of this consumer dedupes at print too.

Evidence: `src/system/base/streams.ts` (`mergeStreams` prints the first occurrence of each system),
`src/system/base/streams.test.ts` (the diamond unit test). Siblings: NEO-LAYERS-03 (config order and the
winner flip), NEO-LAYERS-14 (the relation rejections), NEO-CHAIN-02 (the extends diamond).

> Search terms: diamond, shared upstream, shared base, duplicate block, print once, first occurrence, order statement, layers, mergeStreams, NEO-LAYERS-03, NEO-CHAIN-02
