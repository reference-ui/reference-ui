# CORE-WATCH — watch lifecycle case group

This group proves the lifecycle of `ref sync --watch` and the syncs it drives:
how the generated folder is published and replaced, who holds it, what a watch
sees and when it resyncs, how the types build keeps up, and how the processes
stop. Browser paint after a watched edit is one leg of that lifecycle, not the
whole group. `SPEC.md` numbers the claims (LC-nn, grouped A to F), names the
proof for each, and lists the known open gaps at its end. `TESTS.md` is the
case ledger.

Ports the browser-paint leg of the matrix watch contract
(`matrix/watch/tests/e2e/watch-contract.spec.ts`) to Core: file mutation →
watch resync → browser paint. Readiness is the watcher's `onResync` callback,
since Core emits no `session.json` sentinel.

## Where each leg is proven today

- node-side resync on add, change and unlink, and include scope: CORE-SYNC-14
- the spawned `ref sync --watch` boot and SIGTERM shutdown: CORE-CLI-02
- a killed one-shot recovering on the next sync: CORE-CLI-01
- failed-sync atomicity (last-good folder kept): CORE-SYNC-11
- commit, lock, scheduler and tasty contracts: the unit and repro tests that
  `SPEC.md` names
- browser paint after a watched edit: CORE-WATCH-01 (this group)
- the legs this group adds, each in its own case: symlinked roots and targets,
  gitignored and dotfile includes, lock re-assert, the types-build failure line,
  contention and recycled pids, covered and stopping one-shots, boot and
  dropped-event saves, wedged passes, `--json` output, tasty warnings, commit
  rollback, break-lock, a file in the way of a generated dir, SIGTERM mid-commit
  and dead include globs: CORE-WATCH-02 to 23, plus dangling symlinks under
  include and new files inside a symlinked directory target: CORE-WATCH-24 and 25,
  plus config-load races and timeouts, bare-specifier upstreams, and
  outside-root and exact-file includes: CORE-WATCH-26 to 31

Each case proves one or more `LC-nn` claims. Gaps the claims do not cover are
in the Known open section of `SPEC.md`.

Thirty-one cases carry the group (CORE-WATCH-01 to 31); the per-case
ledger with its status words lives in `TESTS.md`.

The matrix contract's webpack dual-consumption leg is not ported. Core
has no webpack target.

> Search terms: watch lifecycle, watch paint loop, live edit repaint, file mutation paint, watch resync paint, session lock, staged publish, atomic commit, debounce, watch scope, stop signals, types refresh, onResync, P-watch-1, watch port, covered one-shot, watch-state, lock contention, recycled pid, stopping watch, commit rollback, break-lock, file in the way, SIGTERM mid-commit, include glob warning, json failure array, boot edit, dropped events, wedged sync, LC-01, CORE-SYNC-14, CORE-CLI-02
