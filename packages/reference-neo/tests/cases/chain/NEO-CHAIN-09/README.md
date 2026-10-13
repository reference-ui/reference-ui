# NEO-CHAIN-09 — a diamond keeps a branch's override: D→[B,C] resolves B's value for a token only A and B write

The diamond is built from real syncs, as NEO-CHAIN-06 does: the shared base A writes `colors.x = #aa0000`;
branch B extends A and overrides `x = #bb0000`; branch C extends A and writes only its own leaf, `cLeaf`;
the app D extends `[B, C]` and writes nothing. The spec syncs A, then B and C on A, then D on `[B, C]` and
again on `[C, B]`, and restores every canonical config in a `finally`. Each order checks the synced spec's
resolved `x` and the computed paints of two probes: `x`, and C's `cLeaf`. The served sheet is not an
oracle here: it can declare one var more than once (under `[C, B]` the first `--colors-x` it prints is
`#aa0000` while the paint is `#bb0000`), so the paint is the cascade's answer.

This case is red until the fix slice lands. Today D on `[B, C]` evaluates A, B, A, C, D: the second A run
puts `#aa0000` back after B's override, so D resolves `x` as `#aa0000` and paints `rgb(170, 0, 0)`. D on
`[C, B]` evaluates A, C, A, B, D and still resolves `#bb0000`, so that order passes today and guards the fix.

Cause: `createPortableFragmentBundle` (`src/system/base/fragments.ts`) concatenates upstream fragments without
deduping, and `getUpstreamFragments` (`src/collect/lib/evaluate.ts`) hands every copy to the one evaluator, so
a base that two branches republish runs twice.

Siblings: NEO-CHAIN-02 (the extends diamond through stand-ins), NEO-CHAIN-06 (the real-sync template),
NEO-CHAIN-10 (the shared base evaluated once, and the app extending the diamond).

> Search terms: diamond, branch override, last writer wins, shared base, extends order, fragment concatenation, dedupe, real sync, NEO-CHAIN-02, NEO-CHAIN-06, NEO-CHAIN-10
