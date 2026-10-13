# NEO-WATCH — watch lifecycle case group

This group proves the lifecycle of `ref sync --watch` and the syncs it drives:
how the generated folder is published and replaced, who holds it, what a watch
sees and when it resyncs, how the types build keeps up, and how the processes
stop. Browser paint after a watched edit is one leg of that lifecycle, not the
whole group. `SPEC.md` numbers the claims (LC-nn, grouped A to E) and names the
proof for each. `TESTS.md` is the case ledger.

Ports the browser-paint leg of the matrix watch contract
(`matrix/watch/tests/e2e/watch-contract.spec.ts`) to Neo: file mutation →
watch resync → browser paint. Readiness is the watcher's `onResync` callback,
since Neo emits no `session.json` sentinel.

## Where each leg is proven today

- node-side resync on add, change and unlink, and include scope: NEO-SYNC-14
- the spawned `ref sync --watch` boot and SIGTERM shutdown: NEO-CLI-02
- a killed one-shot recovering on the next sync: NEO-CLI-01
- failed-sync atomicity (last-good folder kept): NEO-SYNC-11
- commit, lock, scheduler and tasty contracts: the unit and repro tests that
  `SPEC.md` names
- browser paint after a watched edit: NEO-WATCH-01 (this group)

The cases below cover the legs those leave open. A planned case stays
`in-progress` until its folder lands. NEO-WATCH-09 and up are reserved for the
doom round.

## Cases

- NEO-WATCH-01 — live-edit→paint loop: css edit, token-value edit, fragment add and delete each repaint the browser.
- NEO-WATCH-02 — symlinked project root (planned).
- NEO-WATCH-03 — directory move into and out of include (planned).
- NEO-WATCH-04 — symlinked source target edit (planned).
- NEO-WATCH-05 — gitignored include (planned).
- NEO-WATCH-06 — dotfile include (planned).
- NEO-WATCH-07 — lock re-assert after `.reference-ui` deletion (planned).
- NEO-WATCH-08 — a watch resync whose types build fails reports the failure, then recovers on the next good save (in progress).

The matrix contract's webpack dual-consumption leg is not ported. The H5
default retire stands, and Neo has no webpack target.

> Search terms: watch lifecycle, watch paint loop, live edit repaint, file mutation paint, watch resync paint, session lock, staged publish, atomic commit, debounce, watch scope, stop signals, types refresh, onResync, P-watch-1, watch port, LC-01, NEO-SYNC-14, NEO-CLI-02
