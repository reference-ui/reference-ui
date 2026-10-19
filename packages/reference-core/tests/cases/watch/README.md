# CORE-WATCH — watch lifecycle case group

This group proves the lifecycle of `ref sync --watch` and the syncs it drives:
how the generated folder is published and replaced, who holds it, what a watch
sees and when it resyncs, how the types build keeps up, and how the processes
stop. Browser paint after a watched edit is one leg of that lifecycle, not the
whole group. `SPEC.md` numbers the claims (LC-nn, grouped A to F), names the
proof for each, and lists the known open gaps at its end. `TESTS.md` is the
case ledger.

The browser-paint leg — file mutation → watch resync → browser paint —
lives in CORE-WATCH-01. Readiness is the watcher's `onResync` callback,
since Core emits no `session.json` sentinel.

Each case proves one or more `LC-nn` claims. Gaps the claims do not cover are
in the Known open section of `SPEC.md`.

Thirty-one cases carry the group (CORE-WATCH-01 to 31); the per-case
ledger with its status words lives in `TESTS.md`.

No webpack dual-consumption leg: Core has no webpack target.

## Shared helper

`shared/commit-world.ts` carries the temp-world harness the WATCH-19..23 commit specs share: spawned `ref` CLI,
commit pause-point driver, folder snapshots, and disposal.

Parent: [tests/cases/](../README.md).

> Search terms: watch lifecycle, watch paint loop, live edit repaint, file mutation paint, watch resync paint, session lock, staged publish, atomic commit, debounce, watch scope, stop signals, types refresh, onResync, P-watch-1, watch port, covered one-shot, watch-state, lock contention, recycled pid, stopping watch, commit rollback, break-lock, file in the way, SIGTERM mid-commit, include glob warning, json failure array, boot edit, dropped events, wedged sync, LC-01, CORE-SYNC-14, CORE-CLI-02
